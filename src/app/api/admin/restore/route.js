import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pg from "pg";

// Helper para verificar se o usuário é admin
function isAdmin(email) {
  const adminEmails = process.env.ADMIN_EMAILS || "";
  const adminList = adminEmails.split(",").map((e) => e.trim().toLowerCase());
  return adminList.includes(email?.toLowerCase());
}

export async function POST(request) {
  let client = null;

  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Acesso negado. Você não é administrador." },
        { status: 403 },
      );
    }

    // Ler o corpo da requisição (arquivo de backup)
    const backup = await request.json();

    // Validar estrutura básica do backup
    if (!backup || !backup.metadata || !backup.data) {
      return NextResponse.json(
        {
          error:
            "Arquivo de backup inválido. Faltam campos obrigatórios (metadata, data).",
        },
        { status: 400 },
      );
    }

    if (backup.metadata.generator !== "nossolocal-admin-backup") {
      return NextResponse.json(
        { error: "Arquivo de backup não reconhecido. Generator inválido." },
        { status: 400 },
      );
    }

    // Conectar diretamente ao PostgreSQL
    client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    // Descobrir tabelas atuais do banco
    const tablesResult = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
    );
    const currentTables = tablesResult.rows
      .map((r) => r.tablename)
      .filter((t) => t !== "_prisma_migrations");

    const backupTables = Object.keys(backup.data);
    const warnings = [];

    // Tabelas no backup que não existem mais no banco
    const removedTables = backupTables.filter(
      (t) => !currentTables.includes(t),
    );
    if (removedTables.length > 0) {
      warnings.push(
        `Tabelas ignoradas (não existem no banco atual): ${removedTables.join(", ")}`,
      );
    }

    // Tabelas no banco que não estão no backup
    const newTables = currentTables.filter((t) => !backupTables.includes(t));
    if (newTables.length > 0) {
      warnings.push(
        `Tabelas mantidas vazias (não estão no backup): ${newTables.join(", ")}`,
      );
    }

    // Tabelas que existem em ambos (serão restauradas)
    const tablesToRestore = backupTables.filter((t) =>
      currentTables.includes(t),
    );

    // Iniciar transação
    await client.query("BEGIN");

    try {
      // Desabilitar verificação de FK para toda a sessão
      // Isso permite inserir em qualquer ordem sem se preocupar com dependências
      await client.query("SET session_replication_role = 'replica'");

      // Fase 1: TRUNCATE todas as tabelas atuais (CASCADE para segurança)
      for (const tableName of currentTables) {
        await client.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
      }

      // Fase 2: INSERT dos dados do backup
      let totalRowsRestored = 0;
      let tablesRestored = 0;

      for (const tableName of tablesToRestore) {
        const rows = backup.data[tableName];
        if (!rows || rows.length === 0) continue;

        // Descobrir colunas atuais da tabela no banco
        const columnsResult = await client.query(
          `SELECT column_name FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1
           ORDER BY ordinal_position`,
          [tableName],
        );
        const currentColumns = columnsResult.rows.map((r) => r.column_name);

        // Para cada row, inserir apenas colunas que existem tanto no backup quanto no banco
        for (const row of rows) {
          const backupColumns = Object.keys(row);
          // Usar interseção: colunas que existem no backup E no banco atual
          const columns = backupColumns.filter((c) =>
            currentColumns.includes(c),
          );

          if (columns.length === 0) continue;

          const values = columns.map((c) => row[c]);
          const placeholders = columns.map((_, i) => `$${i + 1}`);
          const columnNames = columns.map((c) => `"${c}"`).join(", ");

          await client.query(
            `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders.join(", ")})`,
            values,
          );
        }

        totalRowsRestored += rows.length;
        tablesRestored++;
      }

      // Resetar sequences para tabelas com colunas serial/identity
      // (CUIDs não precisam, mas caso haja algum campo numérico auto-increment)
      for (const tableName of tablesToRestore) {
        try {
          const seqResult = await client.query(
            `SELECT column_name, pg_get_serial_sequence('"${tableName}"', column_name) as seq
             FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = $1`,
            [tableName],
          );

          for (const seqRow of seqResult.rows) {
            if (seqRow.seq) {
              await client.query(
                `SELECT setval('${seqRow.seq}', COALESCE((SELECT MAX("${seqRow.column_name}") FROM "${tableName}"), 1), true)`,
              );
            }
          }
        } catch (seqError) {
          // Ignorar erros de sequence (tabelas sem auto-increment)
        }
      }

      // Reabilitar verificação de FK
      await client.query("SET session_replication_role = 'DEFAULT'");

      // Commit da transação
      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        tablesRestored,
        totalRowsRestored,
        warnings,
        backupDate: backup.metadata.date,
      });
    } catch (txError) {
      // Rollback em caso de erro
      await client.query("ROLLBACK");
      console.error("Erro durante restauração (rollback executado):", txError);
      return NextResponse.json(
        {
          error:
            "Erro durante a restauração. Rollback executado — o banco permanece intacto.",
          details: txError.message,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Erro ao restaurar backup:", error);
    return NextResponse.json(
      {
        error: "Erro ao restaurar backup do banco de dados",
        details: error.message,
      },
      { status: 500 },
    );
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (e) {
        console.error("Erro ao fechar conexão pg:", e);
      }
    }
  }
}
