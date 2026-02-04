import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

// GET - Buscar carrinho do usuário
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("cart_session")?.value;

    let cart = null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        cart = await prisma.cart.findFirst({
          where: { userId: user.id },
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
            store: true,
          },
        });
      }
    } else if (sessionId) {
      cart = await prisma.cart.findFirst({
        where: { sessionId },
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
          store: true,
        },
      });
    }

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("Erro ao buscar carrinho:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// POST - Adicionar produto ao carrinho
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("cart_session")?.value;

    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "ID do produto é obrigatório" },
        { status: 400 },
      );
    }

    // Buscar o produto
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    if (!product.available) {
      return NextResponse.json(
        { error: "Produto indisponível" },
        { status: 400 },
      );
    }

    if (!product.store.isOpen) {
      return NextResponse.json(
        {
          error:
            "Esta loja está fechada no momento. Tente novamente mais tarde.",
        },
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

    // Se não há sessionId, criar um
    if (!userId && !sessionId) {
      sessionId = uuidv4();
    }

    // Buscar carrinho existente
    let cart = null;
    if (userId) {
      cart = await prisma.cart.findFirst({
        where: { userId },
      });
    } else if (sessionId) {
      cart = await prisma.cart.findFirst({
        where: { sessionId },
      });
    }

    // Se existe carrinho mas é de loja diferente, retornar erro
    if (cart && cart.storeId !== product.storeId) {
      return NextResponse.json(
        {
          error:
            "Você já tem produtos de outra loja no carrinho. Finalize ou limpe o carrinho antes de adicionar produtos de uma loja diferente.",
        },
        { status: 400 },
      );
    }

    // Se não existe carrinho, criar
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          sessionId: !userId ? sessionId : null,
          storeId: product.storeId,
        },
      });
    }

    // Verificar se o produto já está no carrinho
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    let cartItem;
    if (existingItem) {
      // Atualizar quantidade
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Criar novo item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // Buscar carrinho completo atualizado
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
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
        store: true,
      },
    });

    const response = NextResponse.json({ cart: updatedCart });

    // Se criou novo sessionId, salvar em cookie
    if (!userId && sessionId && !cookieStore.get("cart_session")?.value) {
      response.cookies.set("cart_session", sessionId, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 dias
      });
    }

    return response;
  } catch (error) {
    console.error("Erro ao adicionar ao carrinho:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// DELETE - Limpar carrinho
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("cart_session")?.value;

    let userId = null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      userId = user?.id;
    }

    if (userId) {
      await prisma.cart.deleteMany({
        where: { userId },
      });
    } else if (sessionId) {
      await prisma.cart.deleteMany({
        where: { sessionId },
      });
    }

    return NextResponse.json({ message: "Carrinho limpo com sucesso" });
  } catch (error) {
    console.error("Erro ao limpar carrinho:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
