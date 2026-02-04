import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManageStore } from "@/lib/permissions";

export async function PATCH(request, { params }) {
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

    const { id } = await params;

    // Verificar se a loja existe e pertence ao usuário
    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 },
      );
    }

    if (!canManageStore(session, store)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Toggle o status isOpen
    const updatedStore = await prisma.store.update({
      where: { id },
      data: {
        isOpen: !store.isOpen,
      },
    });

    return NextResponse.json({
      store: updatedStore,
      message: updatedStore.isOpen
        ? "Loja aberta com sucesso"
        : "Loja fechada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao alterar status da loja:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
