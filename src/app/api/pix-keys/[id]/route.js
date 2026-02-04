import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManagePixKey } from "@/lib/permissions";

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

// PUT - Atualizar chave PIX
export async function PUT(request, { params }) {
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
    const body = await request.json();
    const { type, key, isPrimary } = body;

    // Buscar a chave PIX e verificar permissão
    const pixKey = await prisma.pixKey.findUnique({
      where: { id },
      include: { store: true },
    });

    if (!pixKey) {
      return NextResponse.json(
        { error: "Chave PIX não encontrada" },
        { status: 404 },
      );
    }

    if (!canManagePixKey(session, pixKey)) {
      return NextResponse.json(
        { error: "Sem permissão para editar esta chave" },
        { status: 403 },
      );
    }

    // Validar CPF se o tipo for cpf
    if (type === "cpf" && key && !validateCPF(key)) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    // Validar CNPJ se o tipo for cnpj
    if (type === "cnpj" && key && !validateCNPJ(key)) {
      return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
    }

    // Validar telefone se o tipo for phone
    if (type === "phone" && key && !validatePhone(key)) {
      return NextResponse.json(
        {
          error: "Telefone inválido. Use formato com DDD: (11) 99999-9999",
        },
        { status: 400 },
      );
    }

    // Validar e-mail se o tipo for email
    if (type === "email" && key && !validateEmail(key)) {
      return NextResponse.json(
        {
          error: "E-mail inválido",
        },
        { status: 400 },
      );
    }

    // Validar chave aleatória se o tipo for random
    if (type === "random" && key && !validateRandomKey(key)) {
      return NextResponse.json(
        {
          error:
            "Chave aleatória inválida. Deve ser um UUID (ex: 12345678-1234-1234-1234-123456789012)",
        },
        { status: 400 },
      );
    }

    // Se a chave está sendo marcada como primária, remover isPrimary das outras
    if (isPrimary) {
      await prisma.pixKey.updateMany({
        where: {
          storeId: pixKey.storeId,
          id: { not: id },
        },
        data: { isPrimary: false },
      });
    }

    // Atualizar a chave PIX
    const updatedPixKey = await prisma.pixKey.update({
      where: { id },
      data: {
        type: type || pixKey.type,
        key: key || pixKey.key,
        isPrimary: isPrimary !== undefined ? isPrimary : pixKey.isPrimary,
      },
    });

    return NextResponse.json({ pixKey: updatedPixKey });
  } catch (error) {
    console.error("Erro ao atualizar chave PIX:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// DELETE - Remover chave PIX
export async function DELETE(request, { params }) {
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

    // Buscar a chave PIX e verificar permissão
    const pixKey = await prisma.pixKey.findUnique({
      where: { id },
      include: { store: true },
    });

    if (!pixKey) {
      return NextResponse.json(
        { error: "Chave PIX não encontrada" },
        { status: 404 },
      );
    }

    if (!canManagePixKey(session, pixKey)) {
      return NextResponse.json(
        { error: "Sem permissão para remover esta chave" },
        { status: 403 },
      );
    }

    await prisma.pixKey.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Chave PIX removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover chave PIX:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
