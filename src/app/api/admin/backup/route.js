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

export async function GET(request) {
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

    // Conectar diretamente ao PostgreSQL via DATABASE_URL
    client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    // Descobrir todas as tabelas do schema public dinamicamente
    const tablesResult = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
    );
    const tableNames = tablesResult.rows.map((r) => r.tablename);

    // Para cada tabela, exportar dados e metadados de colunas
    const data = {};
    const schema = {};
    let totalRows = 0;

    for (const tableName of tableNames) {
      // Ignorar tabela de migrações do Prisma
      if (tableName === "_prisma_migrations") continue;

      // Obter metadados das colunas
      const columnsResult = await client.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [tableName],
      );
      schema[tableName] = columnsResult.rows;

      // Exportar todos os dados da tabela
      const dataResult = await client.query(`SELECT * FROM "${tableName}"`);
      data[tableName] = dataResult.rows;
      totalRows += dataResult.rows.length;
    }

    const backupDate = new Date().toISOString();
    const dateStr = backupDate.slice(0, 10); // YYYY-MM-DD

    const backup = {
      metadata: {
        date: backupDate,
        version: "1.0",
        generator: "nossolocal-admin-backup",
        tableCount: Object.keys(data).length,
        totalRows,
        tables: Object.keys(data),
      },
      schema,
      data,
    };

    const jsonContent = JSON.stringify(backup, null, 2);

    return new Response(jsonContent, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-nossolocal-${dateStr}.json"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar backup:", error);
    return NextResponse.json(
      {
        error: "Erro ao gerar backup do banco de dados",
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
