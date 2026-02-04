import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH - Atualizar status do pedido
export async function PATCH(request, context) {
  try {
    console.log("=== Iniciando atualização de status ===");

    const session = await getServerSession(authOptions);
    console.log("Session:", session ? "Existe" : "Não existe");

    if (session && session.user && !session.user.id && session.user.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) {
        session.user.id = user.id;
        console.log("User ID encontrado:", user.id);
      }
    }

    if (!session?.user?.id) {
      console.log("Usuário não autorizado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Aguardar params no Next.js 15+
    const params = await Promise.resolve(context.params);
    const { id } = params;
    console.log("Order ID:", id);

    const body = await request.json();
    const { status } = body;
    console.log("Novo status:", status);

    // Validar status
    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "delivering",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      console.log("Status inválido:", status);
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    // Buscar pedido
    const order = await prisma.order.findUnique({
      where: { id },
    });
    console.log("Pedido encontrado:", order ? "Sim" : "Não");

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se é o dono da loja
    const store = await prisma.store.findUnique({
      where: { id: order.storeId },
    });
    console.log("Loja encontrada:", store ? "Sim" : "Não");
    console.log("User ID:", session.user.id, "Store userId:", store?.userId);

    if (!store || store.userId !== session.user.id) {
      console.log("Usuário não é dono da loja");
      return NextResponse.json(
        { error: "Você não tem permissão para atualizar este pedido" },
        { status: 403 },
      );
    }

    // Validar transições de status
    if (status === "cancelled") {
      // Não permitir cancelamento de pedidos já finalizados ou cancelados
      if (order.status === "completed") {
        return NextResponse.json(
          { error: "Não é possível cancelar pedidos já finalizados" },
          { status: 400 },
        );
      }
      if (order.status === "cancelled") {
        return NextResponse.json(
          { error: "Este pedido já foi cancelado" },
          { status: 400 },
        );
      }
    } else {
      // Não permitir outras alterações em pedidos cancelados
      if (order.status === "cancelled") {
        return NextResponse.json(
          { error: "Não é possível alterar o status de pedidos cancelados" },
          { status: 400 },
        );
      }
    }

    // Atualizar status
    console.log("Atualizando pedido para status:", status);
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });
    console.log("Pedido atualizado com sucesso");

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 },
    );
  }
}
