import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const skip = (page - 1) * limit;

    // Build search filter
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            {
              profile: {
                fullName: { contains: search, mode: "insensitive" },
              },
            },
            {
              profile: {
                cpf: { contains: search, mode: "insensitive" },
              },
            },
            {
              profile: {
                whatsapp: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }
      : {};

    // Build orderBy
    const orderBy = {};
    if (["createdAt", "name", "email"].includes(sort)) {
      orderBy[sort] = order === "asc" ? "asc" : "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          profile: {
            select: {
              fullName: true,
              cpf: true,
              whatsapp: true,
              whatsappCountryCode: true,
              isClient: true,
              isStore: true,
            },
          },
          _count: {
            select: {
              stores: true,
              orders: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
