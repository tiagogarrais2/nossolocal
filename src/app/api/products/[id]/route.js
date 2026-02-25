import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManageProduct } from "@/lib/permissions";

// GET: Buscar produto específico
export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        store: true,
        groups: {
          include: { options: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// PUT: Atualizar produto
export async function PUT(request, { params }) {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const {
      storeId,
      name,
      description,
      price,
      images,
      available,
      stock,
      isAssemblable,
      groups,
    } = await request.json();

    // Validação básica
    const errors = [];
    if (!name || name.trim().length === 0) {
      errors.push("Nome do produto é obrigatório");
    }
    if (!price || isNaN(price) || parseFloat(price) < 0) {
      errors.push("Preço válido é obrigatório");
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Buscar o produto e verificar propriedade
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        store: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se o usuário pode gerenciar este produto
    if (!canManageProduct(session, existingProduct)) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar este produto" },
        { status: 403 },
      );
    }

    // Atualizar o produto e sincronizar grupos em transação
    const updatedProduct = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          price: parseFloat(price),
          images: images || [],
          available: available === true,
          stock:
            stock !== undefined && stock !== null && stock !== ""
              ? parseInt(stock)
              : null,
          isAssemblable: isAssemblable || false,
        },
      });

      // Sincronizar grupos: delete-and-recreate
      await tx.productGroupOption.deleteMany({
        where: { group: { productId: id } },
      });
      await tx.productGroup.deleteMany({
        where: { productId: id },
      });

      if (isAssemblable && groups && Array.isArray(groups)) {
        for (let gi = 0; gi < groups.length; gi++) {
          const group = groups[gi];
          const createdGroup = await tx.productGroup.create({
            data: {
              productId: id,
              name: group.name,
              type: group.type || "checkbox",
              required: group.required || false,
              minSelections: group.minSelections || 0,
              maxSelections: group.maxSelections || 1,
              order: gi,
              dependsOn: group.dependsOn || null,
            },
          });

          if (group.options && Array.isArray(group.options)) {
            for (let oi = 0; oi < group.options.length; oi++) {
              const option = group.options[oi];
              await tx.productGroupOption.create({
                data: {
                  groupId: createdGroup.id,
                  name: option.name,
                  description: option.description || null,
                  price: parseFloat(option.price || 0),
                  available:
                    option.available !== undefined ? option.available : true,
                  order: oi,
                  priceMatrix: option.priceMatrix || null,
                },
              });
            }
          }
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: {
          groups: {
            include: { options: { orderBy: { order: "asc" } } },
            orderBy: { order: "asc" },
          },
        },
      });
    });

    console.log("Produto atualizado:", updatedProduct.id);

    return NextResponse.json({
      message: "Produto atualizado com sucesso",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// DELETE: Remover produto
export async function DELETE(request, { params }) {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Buscar o produto e verificar propriedade
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        store: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se o usuário pode gerenciar este produto
    if (!canManageProduct(session, existingProduct)) {
      return NextResponse.json(
        { error: "Você não tem permissão para excluir este produto" },
        { status: 403 },
      );
    }

    // Deletar o produto
    await prisma.product.delete({
      where: { id },
    });

    console.log("Produto deletado:", id);

    return NextResponse.json({
      message: "Produto excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
