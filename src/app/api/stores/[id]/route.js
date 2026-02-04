import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManageStore } from "@/lib/permissions";

export async function PUT(request, { params }) {
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

    const { id } = await params;
    console.log("Store ID a ser atualizado:", id);

    const body = await request.json();
    console.log("Dados recebidos no PUT:", JSON.stringify(body, null, 2));

    const {
      name,
      slug,
      description,
      image,
      category,
      cnpj,
      phone,
      email,
      minimumOrder,
      deliveryFee,
      freeShippingThreshold,
      address,
    } = body;

    const errors = [];

    // Validar campos obrigatórios
    if (!name || name.trim() === "") {
      errors.push("Nome da loja é obrigatório");
    }
    if (!slug || slug.trim() === "") {
      errors.push("Identificação única é obrigatória");
    } else {
      // Validar formato do slug
      const slugRegex = /^[a-z0-9]+$/;
      if (!slugRegex.test(slug)) {
        errors.push(
          "Identificação deve conter apenas letras minúsculas e números",
        );
      }
    }
    if (!category || category.trim() === "") {
      errors.push("Categoria é obrigatória");
    }
    if (!cnpj || cnpj.trim() === "") {
      errors.push("CNPJ é obrigatório");
    }
    if (!phone || phone.trim() === "") {
      errors.push("Telefone é obrigatório");
    }
    if (!email || email.trim() === "") {
      errors.push("Email é obrigatório");
    }

    // Validar endereço
    if (!address || typeof address !== "object") {
      errors.push("Endereço é obrigatório");
    } else {
      if (!address.zipCode || address.zipCode.trim() === "") {
        errors.push("CEP é obrigatório");
      }
      if (!address.street || address.street.trim() === "") {
        errors.push("Rua é obrigatória");
      }
      if (!address.number || address.number.trim() === "") {
        errors.push("Número é obrigatório");
      }
      if (!address.neighborhood || address.neighborhood.trim() === "") {
        errors.push("Bairro é obrigatório");
      }
      if (!address.city || address.city.trim() === "") {
        errors.push("Cidade é obrigatória");
      }
      if (!address.state || address.state.trim() === "") {
        errors.push("Estado é obrigatório");
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Verificar se a loja existe e pertence ao usuário
    const existingStore = await prisma.store.findUnique({
      where: { id },
    });

    console.log("Loja encontrada:", existingStore);

    if (!existingStore) {
      return NextResponse.json(
        { errors: ["Loja não encontrada"] },
        { status: 404 },
      );
    }

    if (!canManageStore(session, existingStore)) {
      console.log(
        "Tentativa de editar loja sem permissão. Store userId:",
        existingStore.userId,
        "Session userId:",
        session.user.id,
      );
      return NextResponse.json(
        { errors: ["Você não tem permissão para editar esta loja"] },
        { status: 403 },
      );
    }

    // Verificar se o slug está sendo alterado (não permitido)
    if (slug.trim() !== existingStore.slug) {
      errors.push(
        "A identificação única da loja não pode ser alterada após a criação",
      );
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    console.log("Atualizando loja...");

    // Atualizar a loja
    const store = await prisma.store.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        image: image?.trim() || null,
        category: category.trim(),
        cnpj: cnpj.trim(),
        phone: phone.trim(),
        email: email.trim(),
        minimumOrder: minimumOrder || null,
        deliveryFee: deliveryFee || null,
        freeShippingThreshold: freeShippingThreshold || null,
        street: address.street.trim(),
        number: address.number.trim(),
        complement: address.complement?.trim() || null,
        neighborhood: address.neighborhood.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        zipCode: address.zipCode.trim(),
        latitude: address.latitude || null,
        longitude: address.longitude || null,
      },
    });

    console.log("Loja atualizada com sucesso:", store);

    return NextResponse.json({ store });
  } catch (error) {
    console.error("Erro ao atualizar loja:", error);

    // Verificar erro de CNPJ duplicado
    if (error.code === "P2002" && error.meta?.target?.includes("cnpj")) {
      return NextResponse.json(
        {
          errors: [
            "CNPJ já cadastrado. Uma loja com este CNPJ já existe no sistema.",
          ],
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { errors: ["Erro interno do servidor"] },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
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

    const { id } = await params;

    // Verificar se a loja existe e pertence ao usuário
    const existingStore = await prisma.store.findUnique({
      where: { id },
    });

    if (!existingStore) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 },
      );
    }

    if (!canManageStore(session, existingStore)) {
      return NextResponse.json(
        { error: "Você não tem permissão para deletar esta loja" },
        { status: 403 },
      );
    }

    // Deletar a loja (produtos e PIX keys serão deletados automaticamente via cascade)
    await prisma.store.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Loja removida com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar loja:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
