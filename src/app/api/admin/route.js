import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Helper para verificar se o usuário é admin
function isAdmin(email) {
  const adminEmails = process.env.ADMIN_EMAILS || "";
  const adminList = adminEmails.split(",").map((e) => e.trim().toLowerCase());
  return adminList.includes(email?.toLowerCase());
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Acesso negado. Você não é administrador." },
        { status: 403 },
      );
    }

    // Buscar estatísticas gerais
    const [
      totalUsers,
      totalStores,
      totalProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      recentOrders,
      recentStores,
      recentUsers,
      ordersWithRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.count({ where: { status: "completed" } }),
      prisma.order.count({ where: { status: "cancelled" } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          storeName: true,
          customerName: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.store.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
          state: true,
          isOpen: true,
          createdAt: true,
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "cancelled" } },
      }),
    ]);

    // Estatísticas por status de pedido
    const ordersByStatus = {
      pending: pendingOrders,
      completed: completedOrders,
      cancelled: cancelledOrders,
      other: totalOrders - pendingOrders - completedOrders - cancelledOrders,
    };

    // Lojas abertas/fechadas
    const openStores = await prisma.store.count({ where: { isOpen: true } });
    const closedStores = totalStores - openStores;

    // Produtos disponíveis/indisponíveis
    const availableProducts = await prisma.product.count({
      where: { available: true },
    });
    const unavailableProducts = totalProducts - availableProducts;

    return NextResponse.json({
      stats: {
        totalUsers,
        totalStores,
        openStores,
        closedStores,
        totalProducts,
        availableProducts,
        unavailableProducts,
        totalOrders,
        ordersByStatus,
        totalRevenue: ordersWithRevenue._sum.total || 0,
      },
      recentOrders,
      recentStores,
      recentUsers,
    });
  } catch (error) {
    console.error("Erro ao buscar dados de admin:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
