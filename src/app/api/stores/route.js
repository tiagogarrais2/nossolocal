import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendNewStoreNotificationToAdmins } from "@/lib/email";
import {
  canCreateStoresForOthers,
  canManageStore,
  isUserAdmin,
} from "@/lib/permissions";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const city = searchParams.get("city");
    const state = searchParams.get("state");

    // Buscar ID do usuário se estiver logado
    let currentUserId = null;
    if (session && session.user) {
      // Tentativa 1: Usar session.user.id se já estiver lá
      if (session.user.id) {
        currentUserId = session.user.id;
      }
      // Tentativa 2: Buscar no banco pelo email
      else if (session.user.email) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
        });
        if (user) {
          currentUserId = user.id;
        }
      }
    }

    console.log("GET /api/stores - currentUserId:", currentUserId, "session email:", session?.user?.email);

    // Se foi passado um slug, buscar apenas essa loja
    if (slug) {
      const store = await prisma.store.findUnique({
        where: { slug: slug.trim() },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!store) {
        return NextResponse.json(
          { error: "Loja não encontrada" },
          { status: 404 },
        );
      }

      // Adicionar flag isOwner se houver usuário logado
      const storeWithOwnership = {
        ...store,
        isOwner: currentUserId ? store.userId === currentUserId : false,
        createdByTeam: store.createdBy !== null, // Se foi criada por gerente/admin
      };

      return NextResponse.json({ stores: [storeWithOwnership] });
    }

    // Construir filtros baseados nos parâmetros
    const whereClause = {};

    if (city) {
      whereClause.city = {
        equals: city.trim(),
        mode: "insensitive", // Case insensitive
      };
    }

    if (state) {
      whereClause.state = state.trim();
    }

    // Buscar lojas com filtros aplicados
    const stores = await prisma.store.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Adicionar flag isOwner se houver usuário logado
    const storesWithOwnership = stores.map((store) => ({
      ...store,
      owner: store.user, // Renomear user para owner para consistência
      isOwner: currentUserId ? store.userId === currentUserId : false,
    }));

    return NextResponse.json({ stores: storesWithOwnership });
  } catch (error) {
    console.error("Erro ao buscar lojas:", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
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
      ownerId, // ID do proprietário (quando gerente/admin cria para outro usuário)
    } = body;

    console.log("Dados recebidos no POST:", JSON.stringify(body, null, 2));

    // Determinar o proprietário da loja
    let storeOwnerId = session.user.id; // Por padrão, criador é o proprietário
    let createdByUserId = null; // Quem criou (null se for auto-cadastro)

    // Se ownerId foi fornecido, validar permissões
    if (ownerId && ownerId !== session.user.id) {
      if (!canCreateStoresForOthers(session)) {
        return NextResponse.json(
          {
            error:
              "Você não tem permissão para criar lojas para outros usuários",
          },
          { status: 403 },
        );
      }

      // Verificar se o proprietário existe
      const ownerUser = await prisma.user.findUnique({
        where: { id: ownerId },
      });

      if (!ownerUser) {
        return NextResponse.json(
          { error: "Usuário proprietário não encontrado" },
          { status: 404 },
        );
      }

      storeOwnerId = ownerId;
      createdByUserId = session.user.id; // Registrar quem criou
    }

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
      } else {
        // Verificar se slug já existe
        const existingStore = await prisma.store.findUnique({
          where: { slug: slug.trim() },
        });
        if (existingStore) {
          errors.push("Esta identificação já está em uso");
        }
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
      console.error("Erros de validação:", errors);
      return NextResponse.json({ errors }, { status: 400 });
    }

    console.log("Criando loja com os dados:", {
      userId: storeOwnerId,
      createdBy: createdByUserId,
      name: name.trim(),
      slug: slug.trim(),
      category: category.trim(),
      cnpj: cnpj.trim(),
      phone: phone.trim(),
      email: email.trim(),
      street: address.street.trim(),
      number: address.number.trim(),
      neighborhood: address.neighborhood.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      zipCode: address.zipCode.trim(),
    });

    // Criar a loja
    const store = await prisma.store.create({
      data: {
        userId: storeOwnerId,
        createdBy: createdByUserId,
        name: name.trim(),
        slug: slug.trim(),
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

    // Enviar notificação para administradores se configurado
    try {
      const setting = await prisma.adminSettings.findUnique({
        where: { key: "emailOnNewStore" },
      });

      if (setting?.value === true) {
        const owner = await prisma.user.findUnique({
          where: { id: session.user.id },
        });

        if (owner) {
          await sendNewStoreNotificationToAdmins({ store, owner });
        }
      }
    } catch (emailError) {
      console.error("Erro ao enviar e-mail de nova loja:", emailError);
      // Não impedir a criação da loja se o e-mail falhar
    }

    return NextResponse.json({ store }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar loja:", error);

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

export async function PUT(request) {
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
    const {
      id,
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
      ownerId, // Novo proprietário (apenas ADMIN pode alterar)
    } = body;

    const errors = [];

    // Buscar loja atual para validação
    const currentStore = await prisma.store.findUnique({
      where: { id },
    });

    if (!currentStore) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 },
      );
    }

    if (!canManageStore(session, currentStore)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Verificar se está tentando mudar o proprietário
    if (ownerId && ownerId !== currentStore.userId) {
      // Apenas ADMIN pode alterar proprietário
      if (!isUserAdmin(session)) {
        return NextResponse.json(
          {
            error:
              "Apenas administradores podem alterar o proprietário da loja",
          },
          { status: 403 },
        );
      }

      // Verificar se o novo proprietário existe
      const newOwner = await prisma.user.findUnique({
        where: { id: ownerId },
      });

      if (!newOwner) {
        return NextResponse.json(
          { error: "Novo proprietário não encontrado" },
          { status: 404 },
        );
      }
    }

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
      } else if (slug.trim() !== currentStore.slug) {
        // Verificar se slug já existe (apenas se mudou)
        const existingStore = await prisma.store.findUnique({
          where: { slug: slug.trim() },
        });
        if (existingStore) {
          errors.push("Esta identificação já está em uso");
        }
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

    // Verificar se a loja existe
    const existingStore = await prisma.store.findUnique({
      where: { userId: session.user.id },
    });

    if (!existingStore) {
      return NextResponse.json(
        { errors: ["Loja não encontrada"] },
        { status: 404 },
      );
    }

    // Atualizar a loja
    const updateData = {
      name: name.trim(),
      slug: slug.trim(),
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
    };

    // Se ownerId foi fornecido e validado, atualizar o proprietário
    if (ownerId && ownerId !== currentStore.userId) {
      updateData.userId = ownerId;
    }

    const store = await prisma.store.update({
      where: { userId: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ store });
  } catch (error) {
    console.error("Erro ao atualizar loja:", error);
    return NextResponse.json(
      { errors: ["Erro interno do servidor"] },
      { status: 500 },
    );
  }
}

export async function DELETE() {
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

    // Verificar se a loja existe
    const existingStore = await prisma.store.findUnique({
      where: { userId: session.user.id },
    });

    if (!existingStore) {
      return NextResponse.json(
        { errors: ["Loja não encontrada"] },
        { status: 404 },
      );
    }

    // Deletar a loja
    await prisma.store.delete({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ message: "Loja removida com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar loja:", error);
    return NextResponse.json(
      { errors: ["Erro interno do servidor"] },
      { status: 500 },
    );
  }
}
