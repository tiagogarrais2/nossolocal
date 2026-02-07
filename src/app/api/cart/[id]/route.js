import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

// PATCH - Atualizar quantidade do item
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("cart_session")?.value;
    const { id } = await params;

    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Quantidade inválida" },
        { status: 400 },
      );
    }

    let userId = null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      userId = user?.id;
    }

    // Buscar item e verificar permissão
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se o carrinho pertence ao usuário ou sessão
    if (userId && cartItem.cart.userId !== userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!userId && cartItem.cart.sessionId !== sessionId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Atualizar quantidade
    await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });

    // Buscar carrinho atualizado
    const cart = await prisma.cart.findUnique({
      where: { id: cartItem.cartId },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// DELETE - Remover item do carrinho
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("cart_session")?.value;
    const { id } = await params;

    let userId = null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      userId = user?.id;
    }

    // Buscar item e verificar permissão
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se o carrinho pertence ao usuário ou sessão
    if (userId && cartItem.cart.userId !== userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!userId && cartItem.cart.sessionId !== sessionId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const cartId = cartItem.cartId;

    // Remover item
    await prisma.cartItem.delete({
      where: { id },
    });

    // Verificar se o carrinho ainda tem itens
    const remainingItems = await prisma.cartItem.count({
      where: { cartId },
    });

    // Se não tem mais itens, deletar o carrinho
    if (remainingItems === 0) {
      await prisma.cart.delete({
        where: { id: cartId },
      });
      return NextResponse.json({ cart: null });
    }

    // Buscar carrinho atualizado
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("Erro ao remover item:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
