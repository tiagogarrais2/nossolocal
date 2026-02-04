import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    // Buscar ID do usuário se estiver logado
    let currentUserId = null;
    if (session && session.user && !session.user.id && session.user.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) {
        currentUserId = user.id;
      }
    } else if (session?.user?.id) {
      currentUserId = session.user.id;
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { error: "ID da loja é obrigatório" },
        { status: 400 },
      );
    }

    // Verificar se a loja existe
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 },
      );
    }

    // Buscar produtos (públicos para todos)
    const products = await prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    });

    // Adicionar flag isOwner se houver usuário logado
    const productsWithOwnership = products.map((product) => ({
      ...product,
      isOwner: currentUserId ? store.userId === currentUserId : false,
    }));

    return NextResponse.json({ products: productsWithOwnership });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (session && session.user && !session.user.id && session.user.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) {
        session.user.id = user.id;
      }
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, name, description, price, images, available, stock } =
      body;

    const errors = [];

    if (!storeId || storeId.trim() === "") {
      errors.push("ID da loja é obrigatório");
    }
    if (!name || name.trim() === "") {
      errors.push("Nome do produto é obrigatório");
    }
    if (price === undefined || price === null || price === "") {
      errors.push("Preço é obrigatório");
    } else if (isNaN(parseFloat(price))) {
      errors.push("Preço deve ser um número válido");
    }
    if (images && !Array.isArray(images)) {
      errors.push("Imagens deve ser um array");
    }
    if (images && images.some((img) => typeof img !== "string")) {
      errors.push("Imagens deve conter apenas strings");
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Verificar se a loja pertence ao usuário
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { errors: ["Loja não encontrada"] },
        { status: 404 },
      );
    }

    if (store.userId !== session.user.id) {
      return NextResponse.json(
        {
          errors: ["Você não tem permissão para adicionar produtos nesta loja"],
        },
        { status: 403 },
      );
    }

    const product = await prisma.product.create({
      data: {
        storeId,
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price.toString().replace(",", ".")),
        images: images || [],
        available: available !== undefined ? available : true,
        stock:
          stock !== undefined && stock !== null && stock !== ""
            ? parseInt(stock)
            : null,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { errors: ["Erro interno do servidor"] },
      { status: 500 },
    );
  }
}
