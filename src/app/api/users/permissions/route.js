import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canCreateStoresForOthers, isUserAdmin } from "@/lib/permissions";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const permissions = {
      canCreateStoresForOthers: canCreateStoresForOthers(session),
      isAdmin: isUserAdmin(session),
    };

    return NextResponse.json(permissions);
  } catch (error) {
    console.error("Erro ao verificar permissões:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
