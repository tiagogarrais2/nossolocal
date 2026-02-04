import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Buscar os últimos 6 produtos disponíveis, ordenados por data de criação
    const products = await prisma.product.findMany({
      where: {
        available: true,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Erro ao buscar produtos recentes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
