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
            { slug: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
            { cnpj: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    // Build orderBy
    const orderBy = {};
    if (["createdAt", "name", "city", "category"].includes(sort)) {
      orderBy[sort] = order === "asc" ? "asc" : "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [stores, totalStores] = await Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          category: true,
          description: true,
          cnpj: true,
          phone: true,
          email: true,
          city: true,
          state: true,
          isOpen: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      prisma.store.count({ where }),
    ]);

    return NextResponse.json({
      stores,
      pagination: {
        total: totalStores,
        page,
        limit,
        totalPages: Math.ceil(totalStores / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar lojas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
