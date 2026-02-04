import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Buscar as últimas 3 lojas que têm pelo menos um produto disponível
    const stores = await prisma.store.findMany({
      where: {
        products: {
          some: {
            available: true,
          },
        },
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                available: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error("Erro ao buscar lojas recentes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
