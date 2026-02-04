import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Função para validar CPF
function validateCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");

  if (cpf.length !== 11) return false;

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false;

  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;

  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) return false;

  return true;
}

// Função para validar CNPJ
function validateCNPJ(cnpj) {
  cnpj = cnpj.replace(/\D/g, "");

  if (cnpj.length !== 14) return false;

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validar primeiro dígito verificador
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cnpj.charAt(12))) return false;

  // Validar segundo dígito verificador
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cnpj.charAt(13))) return false;

  return true;
}

// Função para validar telefone brasileiro
function validatePhone(phone) {
  phone = phone.replace(/\D/g, "");

  // Telefone deve ter 10 (fixo) ou 11 (celular) dígitos
  if (phone.length !== 10 && phone.length !== 11) return false;

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(phone)) return false;

  // DDD deve estar entre 11 e 99
  const ddd = parseInt(phone.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;

  // Se for celular (11 dígitos), deve começar com 9
  if (phone.length === 11 && phone.charAt(2) !== "9") return false;

  return true;
}

// Função para validar e-mail
function validateEmail(email) {
  // Regex básico para validação de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para validar chave aleatória (UUID)
function validateRandomKey(key) {
  // Chave aleatória PIX deve ser um UUID (formato: 00000000-0000-0000-0000-000000000000)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(key);
}

// GET - Buscar chaves PIX de uma loja
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { error: "ID da loja é obrigatório" },
        { status: 400 }
      );
    }

    const pixKeys = await prisma.pixKey.findMany({
      where: { storeId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ pixKeys });
  } catch (error) {
    console.error("Erro ao buscar chaves PIX:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar nova chave PIX
export async function POST(request) {
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

    const body = await request.json();
    const { storeId, type, key, isPrimary } = body;

    // Validar campos obrigatórios
    if (!storeId || !type || !key) {
      return NextResponse.json(
        { error: "Dados obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Validar CPF se o tipo for cpf
    if (type === "cpf" && !validateCPF(key)) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    // Validar CNPJ se o tipo for cnpj
    if (type === "cnpj" && !validateCNPJ(key)) {
      return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
    }

    // Validar telefone se o tipo for phone
    if (type === "phone" && !validatePhone(key)) {
      return NextResponse.json(
        {
          error: "Telefone inválido. Use formato com DDD: (11) 99999-9999",
        },
        { status: 400 }
      );
    }

    // Validar e-mail se o tipo for email
    if (type === "email" && !validateEmail(key)) {
      return NextResponse.json(
        {
          error: "E-mail inválido",
        },
        { status: 400 }
      );
    }

    // Validar chave aleatória se o tipo for random
    if (type === "random" && !validateRandomKey(key)) {
      return NextResponse.json(
        {
          error:
            "Chave aleatória inválida. Deve ser um UUID (ex: 12345678-1234-1234-1234-123456789012)",
        },
        { status: 400 }
      );
    }

    // Verificar se a loja pertence ao usuário
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store || store.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Loja não encontrada ou sem permissão" },
        { status: 403 }
      );
    }

    // Se a nova chave é primária, remover isPrimary das outras
    if (isPrimary) {
      await prisma.pixKey.updateMany({
        where: { storeId },
        data: { isPrimary: false },
      });
    }

    // Criar a chave PIX
    const pixKey = await prisma.pixKey.create({
      data: {
        storeId,
        type,
        key,
        isPrimary: isPrimary || false,
      },
    });

    return NextResponse.json({ pixKey }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar chave PIX:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
