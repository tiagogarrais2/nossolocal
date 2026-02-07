const { PrismaClient } = require("@prisma/client");

async function checkProducts() {
  const prisma = new PrismaClient();

  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, images: true },
      take: 10,
    });

    console.log("📊 Status dos Produtos no Banco:");
    console.log("=====================================");

    products.forEach((p) => {
      console.log(`ID: ${p.id}`);
      console.log(`Nome: ${p.name}`);
      console.log(
        `  images (novo): ${p.images && p.images.length > 0 ? `✅ SIM (${p.images.length} imagens)` : "❌ NÃO"}`,
      );
      console.log("---");
    });

    // Estatísticas
    const total = products.length;
    const comImagesNovo = products.filter(
      (p) => p.images && p.images.length > 0,
    ).length;

    console.log("\n📈 Estatísticas:");
    console.log(`Total de produtos: ${total}`);
    console.log(`Com campo images (novo): ${comImagesNovo}`);
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
