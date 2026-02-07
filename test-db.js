#!/usr/bin/env node

// Script para testar conexão com o banco antes de fazer login OAuth

const { PrismaClient } = require("@prisma/client");

async function test() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ["error", "warn"],
  });

  try {
    console.log("🔍 Testando conexão com banco de dados...");
    
    // Teste 1: Verificar se consegue conectar
    console.log("\n1️⃣  Verificar tabelas User...");
    const users = await prisma.user.findMany({ take: 1 });
    console.log("✅ User table OK, encontrados:", users.length, "usuários");

    // Teste 2: Verificar se consegue criar um usuário temporário
    console.log("\n2️⃣  Criar usuário de teste...");
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
      },
    });
    console.log("✅ Usuário criado:", testUser.id);

    // Teste 3: Deletar usuário de teste
    console.log("\n3️⃣  Deletar usuário de teste...");
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log("✅ Usuário deletado");

    // Teste 4: Verificar tabelas de OAuth
    console.log("\n4️⃣  Verificar tabelas de OAuth...");
    const accounts = await prisma.account.findMany({ take: 1 });
    console.log("✅ Account table OK");

    const sessions = await prisma.session.findMany({ take: 1 });
    console.log("✅ Session table OK");

    console.log("\n✅ Todos os testes passaram! Banco está OK.");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERRO:", error.message);
    console.error("\nStack:", error.stack);
    console.error("\nCódigo:", error.code);
    console.error("\nMeta:", error.meta);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
