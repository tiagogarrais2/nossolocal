const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando migração de dados dos carrinhos...");

  await prisma.$transaction(
    async (tx) => {
      // 1. Migrar carrinhos de usuários logados (userId)
      const userCartGroups = await tx.cart.groupBy({
        by: ["userId"],
        _count: { _all: true },
        having: {
          userId: {
            _count: {
              gt: 1,
            },
          },
        },
      });

      for (const group of userCartGroups) {
        if (!group.userId) continue;
        console.log(`- Mesclando carrinhos para o usuário: ${group.userId}`);
        const carts = await tx.cart.findMany({
          where: { userId: group.userId },
          orderBy: { createdAt: "asc" },
        });

        const [mainCart, ...otherCarts] = carts;
        const otherCartIds = otherCarts.map((c) => c.id);

        if (otherCartIds.length > 0) {
          // Mover itens dos outros carrinhos para o carrinho principal
          await tx.cartItem.updateMany({
            where: { cartId: { in: otherCartIds } },
            data: { cartId: mainCart.id },
          });
          // Deletar os carrinhos antigos e vazios
          await tx.cart.deleteMany({
            where: { id: { in: otherCartIds } },
          });
          console.log(
            `  - Carrinhos para o usuário ${group.userId} mesclados com sucesso.`,
          );
        }
      }

      // 2. Migrar carrinhos de sessões (sessionId)
      const sessionCartGroups = await tx.cart.groupBy({
        by: ["sessionId"],
        _count: { _all: true },
        having: {
          sessionId: {
            _count: {
              gt: 1,
            },
          },
        },
      });

      for (const group of sessionCartGroups) {
        if (!group.sessionId) continue;
        console.log(`- Mesclando carrinhos para a sessão: ${group.sessionId}`);
        const carts = await tx.cart.findMany({
          where: { sessionId: group.sessionId },
          orderBy: { createdAt: "asc" },
        });

        const [mainCart, ...otherCarts] = carts;
        const otherCartIds = otherCarts.map((c) => c.id);

        if (otherCartIds.length > 0) {
          await tx.cartItem.updateMany({
            where: { cartId: { in: otherCartIds } },
            data: { cartId: mainCart.id },
          });
          await tx.cart.deleteMany({
            where: { id: { in: otherCartIds } },
          });
          console.log(
            `  - Carrinhos para a sessão ${group.sessionId} mesclados com sucesso.`,
          );
        }
      }
    },
    {
      timeout: 60000, // Aumentar timeout para 1 minuto
    },
  );

  console.log("Migração de dados dos carrinhos concluída.");
}

main()
  .catch((e) => {
    console.error("Ocorreu um erro durante a migração dos carrinhos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
