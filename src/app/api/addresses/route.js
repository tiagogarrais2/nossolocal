import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // If session exists but user.id is missing, try to get it from the database
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

    // Buscar o usuário
    const usuario = await prisma.usuario.findUnique({
      where: { userId: session.user.id },
      include: {
        addresses: {
          orderBy: [
            { isPrimary: "desc" }, // Endereços principais primeiro
            { state: "asc" }, // Depois por estado (alfabético)
            { neighborhood: "asc" }, // Depois por bairro
            { street: "asc" }, // Depois por rua
          ],
        },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ addresses: usuario.addresses });
  } catch (error) {
    console.error("Erro ao buscar endereços:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    // If session exists but user.id is missing, try to get it from the database
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
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      isPrimary,
    } = body;

    // Validar campos obrigatórios
    if (!street || !number || !neighborhood || !city || !state || !zipCode) {
      return NextResponse.json(
        {
          errors: ["Todos os campos obrigatórios devem ser preenchidos"],
        },
        { status: 400 },
      );
    }

    // Buscar o usuário
    const usuario = await prisma.usuario.findUnique({
      where: { userId: session.user.id },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Se está marcando como principal, desmarcar outros endereços
    if (isPrimary) {
      await prisma.address.updateMany({
        where: { usuarioId: usuario.id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // Criar o endereço
    const address = await prisma.address.create({
      data: {
        usuarioId: usuario.id,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        latitude: latitude !== null && latitude !== undefined ? latitude : null,
        longitude:
          longitude !== null && longitude !== undefined ? longitude : null,
        isPrimary: isPrimary || false,
      },
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Erro ao criar endereço:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      isPrimary,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID do endereço é obrigatório" },
        { status: 400 },
      );
    }

    // Buscar o usuário
    const usuario = await prisma.usuario.findUnique({
      where: { userId: session.user.id },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se o endereço pertence ao usuário
    const existingAddress = await prisma.address.findFirst({
      where: { id, usuarioId: usuario.id },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: "Endereço não encontrado" },
        { status: 404 },
      );
    }

    // Se está marcando como principal, desmarcar outros endereços
    if (isPrimary) {
      await prisma.address.updateMany({
        where: { usuarioId: usuario.id, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    // Atualizar o endereço
    const address = await prisma.address.update({
      where: { id },
      data: {
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        latitude: latitude !== null && latitude !== undefined ? latitude : null,
        longitude:
          longitude !== null && longitude !== undefined ? longitude : null,
        isPrimary,
      },
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Erro ao atualizar endereço:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do endereço é obrigatório" },
        { status: 400 },
      );
    }

    // Buscar o usuário
    const usuario = await prisma.usuario.findUnique({
      where: { userId: session.user.id },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se o endereço pertence ao usuário
    const existingAddress = await prisma.address.findFirst({
      where: { id, usuarioId: usuario.id },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: "Endereço não encontrado" },
        { status: 404 },
      );
    }

    // Deletar o endereço
    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar endereço:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
