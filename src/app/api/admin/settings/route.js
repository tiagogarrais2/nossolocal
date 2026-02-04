import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Helper para verificar se o usuário é admin
function isAdmin(email) {
  const adminEmails = process.env.ADMIN_EMAILS || "";
  const adminList = adminEmails.split(",").map((e) => e.trim().toLowerCase());
  return adminList.includes(email?.toLowerCase());
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Acesso negado. Você não é administrador." },
        { status: 403 }
      );
    }

    // Buscar todas as configurações
    const settings = await prisma.adminSettings.findMany();

    // Converter para objeto chave-valor
    const settingsObj = {};
    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });

    // Garantir que as configurações padrão existam
    const defaultSettings = {
      emailOnNewUser: false,
      emailOnNewStore: false,
    };

    // Retornar configurações mescladas com padrões
    return NextResponse.json({
      settings: { ...defaultSettings, ...settingsObj },
    });
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: "Acesso negado. Você não é administrador." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof value !== "boolean") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Atualizar ou criar a configuração
    const setting = await prisma.adminSettings.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        description: getSettingDescription(key),
      },
    });

    return NextResponse.json({ setting });
  } catch (error) {
    console.error("Erro ao atualizar configuração:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function getSettingDescription(key) {
  const descriptions = {
    emailOnNewUser:
      "Enviar e-mail para administradores quando um novo usuário se cadastrar",
    emailOnNewStore:
      "Enviar e-mail para administradores quando uma nova loja for cadastrada",
  };
  return descriptions[key] || "";
}
