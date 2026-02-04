import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { sendTestEmail } from "../../../../lib/email";

export async function POST(request) {
  try {
    // Verificar se o usuário está autenticado e é administrador
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se é administrador (você pode ajustar essa lógica conforme necessário)
    // Por enquanto, assumimos que qualquer usuário logado pode testar, mas idealmente
    // você deveria verificar se é admin no banco de dados
    const { to, subject, message } = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: "Campos obrigatórios: to e message" },
        { status: 400 },
      );
    }

    // Enviar e-mail de teste
    await sendTestEmail({ to, subject, message });

    return NextResponse.json({
      success: true,
      message: "E-mail de teste enviado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail de teste:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
