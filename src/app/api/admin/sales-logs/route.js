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
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const storeId = searchParams.get("storeId") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const skip = (page - 1) * limit;

    // Construir filtros
    const where = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { customerCpf: { contains: search, mode: "insensitive" } },
        { storeName: { contains: search, mode: "insensitive" } },
        { orderId: { contains: search, mode: "insensitive" } },
      ];
    }

    if (storeId) {
      where.storeId = storeId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Buscar logs com paginação
    const [logs, totalCount] = await Promise.all([
      prisma.salesLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.salesLog.count({ where }),
    ]);

    // Estatísticas gerais
    const stats = await prisma.salesLog.aggregate({
      _sum: { total: true },
      _count: { id: true },
      _avg: { total: true },
    });

    // Buscar lista de lojas para filtro
    const stores = await prisma.store.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalSales: stats._count.id,
        totalRevenue: stats._sum.total || 0,
        averageTicket: stats._avg.total || 0,
      },
      stores,
    });
  } catch (error) {
    console.error("Erro ao buscar logs de vendas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Acesso negado. Você não é administrador." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do log é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o log existe
    const log = await prisma.salesLog.findUnique({
      where: { id },
    });

    if (!log) {
      return NextResponse.json(
        { error: "Log de venda não encontrado" },
        { status: 404 }
      );
    }

    // Deletar o log
    await prisma.salesLog.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Log de venda deletado com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar log de venda:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
