import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendOrderNotificationToStore } from "@/lib/email";

// GET - Listar pedidos (cliente vê suas compras, loja vê seus pedidos)
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const asStore = searchParams.get("asStore") === "true";
    const orderId = searchParams.get("orderId");

    // Se foi passado orderId, buscar apenas esse pedido
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return NextResponse.json(
          { error: "Pedido não encontrado" },
          { status: 404 },
        );
      }

      // Verificar se o usuário tem permissão para ver este pedido
      if (order.userId !== session.user.id) {
        // Verificar se é dono da loja
        const store = await prisma.store.findUnique({
          where: { id: order.storeId },
        });

        if (!store || store.userId !== session.user.id) {
          return NextResponse.json(
            { error: "Você não tem permissão para ver este pedido" },
            { status: 403 },
          );
        }
      }

      return NextResponse.json({ order });
    }

    let orders;

    if (asStore && storeId) {
      // Verificar se o usuário é dono da loja
      const store = await prisma.store.findUnique({
        where: { id: storeId },
      });

      if (!store || store.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Você não tem permissão para ver estes pedidos" },
          { status: 403 },
        );
      }

      // Buscar pedidos da loja
      orders = await prisma.order.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
      });

      // Buscar o whatsapp de cada cliente
      orders = await Promise.all(
        orders.map(async (order) => {
          const usuario = await prisma.usuario.findUnique({
            where: { userId: order.userId },
          });
          return {
            ...order,
            customerWhatsapp: usuario?.whatsapp || null,
          };
        }),
      );
    } else {
      // Buscar compras do cliente
      const where = { userId: session.user.id };

      // Se especificou uma loja, filtrar por ela
      if (storeId) {
        where.storeId = storeId;
      }

      orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// POST - Criar novo pedido
export async function POST(request) {
  try {
    console.log("=== Iniciando criação de pedido ===");

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
      console.log("Não autorizado - sem sessão ou user.id");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("User ID:", session.user.id);

    const body = await request.json();
    console.log("Body recebido:", JSON.stringify(body, null, 2));

    const {
      storeId,
      items,
      subtotal,
      deliveryFee,
      total,
      customerName,
      customerPhone,
      paymentMethod,
      needsChange,
      changeAmount,
      deliveryType,
      deliveryAddress,
    } = body;

    const errors = [];

    // Validações
    if (!storeId) {
      errors.push("ID da loja é obrigatório");
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      errors.push("Items do pedido são obrigatórios");
    }
    if (typeof subtotal !== "number" || subtotal <= 0) {
      errors.push("Subtotal inválido");
    }
    if (typeof total !== "number" || total <= 0) {
      errors.push("Total inválido");
    }

    if (errors.length > 0) {
      console.log("Erros de validação:", errors);
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Buscar informações da loja
    console.log("Buscando loja:", storeId);
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      console.log("Loja não encontrada");
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 },
      );
    }

    console.log("Loja encontrada:", store.name);

    // Validar estoque dos produtos antes de criar o pedido
    const stockErrors = [];
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        stockErrors.push(`Produto "${item.productName}" não encontrado`);
        continue;
      }

      // Se o produto tem controle de estoque (stock não é null)
      if (product.stock !== null) {
        if (product.stock < item.quantity) {
          stockErrors.push(
            `Estoque insuficiente para "${item.productName}". Disponível: ${product.stock}, Solicitado: ${item.quantity}`,
          );
        }
      }
    }

    if (stockErrors.length > 0) {
      console.log("Erros de estoque:", stockErrors);
      return NextResponse.json({ errors: stockErrors }, { status: 400 });
    }

    // Criar o pedido
    console.log("Criando pedido no banco...");
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        storeId,
        items,
        subtotal,
        deliveryFee: deliveryFee || 0,
        total,
        status: "pending",
        customerName: customerName || session.user.name,
        customerPhone: customerPhone || null,
        storeName: store.name,
        storePhone: store.phone,
        paymentMethod,
        needsChange: needsChange || false,
        changeAmount: needsChange ? changeAmount : null,
        deliveryType: deliveryType || "delivery",
        deliveryAddress: deliveryType === "delivery" ? deliveryAddress : null,
      },
    });

    console.log("Pedido criado com sucesso:", order.id);

    // Atualizar estoque dos produtos
    try {
      console.log("Atualizando estoque dos produtos...");
      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        // Só atualiza se o produto tem controle de estoque
        if (product && product.stock !== null) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
          console.log(
            `Estoque do produto ${item.productName} reduzido em ${item.quantity}`,
          );
        }
      }
      console.log("Estoque atualizado com sucesso");
    } catch (stockError) {
      console.error("Erro ao atualizar estoque:", stockError);
      // Não falhar o pedido se não conseguir atualizar o estoque
      // mas isso pode causar inconsistência
    }

    // Buscar dados completos do cliente para o log
    let customerProfile = null;
    try {
      customerProfile = await prisma.usuario.findUnique({
        where: { userId: session.user.id },
        include: {
          addresses: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      });
    } catch (profileError) {
      console.error("Erro ao buscar perfil do cliente:", profileError);
    }

    // Montar endereço de entrega
    let formattedDeliveryAddress = null;
    if (customerProfile?.addresses?.[0]) {
      const addr = customerProfile.addresses[0];
      formattedDeliveryAddress = `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ""}, ${addr.neighborhood}, ${addr.city}/${addr.state}, CEP: ${addr.zipCode}`;
    }

    // Montar endereço da loja
    const storeAddress = `${store.street}, ${store.number}${store.complement ? ` - ${store.complement}` : ""}, ${store.neighborhood}, ${store.city}/${store.state}, CEP: ${store.zipCode}`;

    // Criar log de venda com todos os dados
    try {
      console.log("Criando log de venda...");
      await prisma.salesLog.create({
        data: {
          orderId: order.id,
          orderStatus: order.status,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
          paymentMethod: order.paymentMethod,
          needsChange: order.needsChange,
          changeAmount: order.changeAmount,
          items: items,
          customerId: session.user.id,
          customerEmail: session.user.email,
          customerName:
            customerName || session.user.name || customerProfile?.fullName,
          customerPhone: customerPhone || customerProfile?.whatsapp,
          customerCpf: customerProfile?.cpf,
          customerWhatsapp: customerProfile?.whatsapp,
          storeId: store.id,
          storeName: store.name,
          storeEmail: store.email,
          storePhone: store.phone,
          storeCnpj: store.cnpj,
          storeCategory: store.category,
          storeAddress: storeAddress,
          deliveryAddress: formattedDeliveryAddress,
        },
      });
      console.log("Log de venda criado com sucesso");
    } catch (logError) {
      console.error("Erro ao criar log de venda:", logError);
      // Não falhar o pedido se o log falhar
    }

    // Enviar notificação por email para a loja
    try {
      console.log("Enviando notificação por email para a loja...");

      if (store.email) {
        await sendOrderNotificationToStore({
          storeEmail: store.email,
          storeName: store.name,
          order,
          customerName: customerName || session.user.name || "Cliente",
        });
        console.log(
          "Notificação por email enviada com sucesso para:",
          store.email,
        );
      } else {
        console.log("Email da loja não encontrado no cadastro");
      }
    } catch (emailError) {
      console.error("Erro ao enviar email de notificação:", emailError);
      // Não falhar se não conseguir enviar o email
    }

    // Limpar carrinho do usuário para esta loja
    try {
      console.log("Limpando carrinho...");
      await prisma.cart.deleteMany({
        where: {
          userId: session.user.id,
          storeId,
        },
      });
      console.log("Carrinho limpo");
    } catch (cartError) {
      console.error("Erro ao limpar carrinho:", cartError);
      // Não falhar se não conseguir limpar o carrinho
    }

    console.log("=== Pedido criado com sucesso ===");
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      { error: "Erro interno do servidor: " + error.message },
      { status: 500 },
    );
  }
}
