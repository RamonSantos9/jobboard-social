import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserModel from "@/models/User";
import CompanyModel from "@/models/Company";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: true, message: "Email é obrigatório" },
        { status: 400 }
      );
    }

    await connectDB();

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuário ou empresa
    const [user, company] = await Promise.all([
      UserModel.findOne({ email: normalizedEmail }),
      CompanyModel.findOne({ email: normalizedEmail }),
    ]);

    // Se não encontrou nem usuário nem empresa, retornar sucesso mesmo assim
    // (por segurança, não revelar se o email existe ou não)
    if (!user && !company) {
      return NextResponse.json({
        success: true,
        message:
          "Se o email existir, você receberá instruções de redefinição de senha.",
      });
    }

    // TODO: Implementar envio de email de redefinição de senha
    // Por enquanto, apenas retornar sucesso
    return NextResponse.json({
      success: true,
      message:
        "Se o email existir, você receberá instruções de redefinição de senha.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: true, message: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}

