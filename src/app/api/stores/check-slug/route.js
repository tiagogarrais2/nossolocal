import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Slug é obrigatório" },
        { status: 400 },
      );
    }

    // Validar formato do slug (apenas letras minúsculas e números)
    const slugRegex = /^[a-z0-9]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "Slug deve conter apenas letras minúsculas e números" },
        { status: 400 },
      );
    }

    // Verificar se o slug já existe - usando select para evitar problemas com colunas que podem não existir
    const existingStore = await prisma.store.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
      },
    });

    return NextResponse.json({
      available: !existingStore,
      slug,
    });
  } catch (error) {
    console.error("Erro ao verificar slug:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
