const { PrismaClient } = require("@prisma/client");

async function migrateProductImages() {
  const prisma = new PrismaClient();

  try {
    console.log("🚀 Iniciando migração...");

    // Buscar produtos que precisam de migração
    const products = await prisma.product.findMany({
      select: { id: true, name: true, image: true, images: true },
    });

    console.log(`Encontrados ${products.length} produtos`);

    for (const product of products) {
      if (product.image && (!product.images || product.images.length === 0)) {
        console.log(`Migrando ${product.name}...`);
        await prisma.product.update({
          where: { id: product.id },
          data: { images: [product.image] },
        });
      }
    }

    console.log("✅ Migração concluída!");
  } catch (error) {
    console.error("Erro:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

migrateProductImages().catch(console.error);
