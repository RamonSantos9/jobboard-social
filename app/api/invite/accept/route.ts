import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import Invite from "@/models/Invite";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 400 }
      );
    }

    // Buscar convite
    const invite = await Invite.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Convite inválido ou expirado" },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se email do usuário corresponde ao email do convite
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email não corresponde ao convite" },
        { status: 403 }
      );
    }

    // Verificar se usuário já está em outra empresa
    if (
      user.companyId &&
      user.companyId.toString() !== invite.companyId.toString()
    ) {
      return NextResponse.json(
        { error: "Você já está vinculado a outra empresa" },
        { status: 400 }
      );
    }

    // Buscar empresa
    const company = await Company.findById(invite.companyId);
    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Atualizar usuário
    user.companyId = company._id;
    user.isRecruiter = true;
    if (invite.role === "admin") {
      user.role = "admin";
    }
    await user.save();

    // Adicionar usuário à empresa
    if (invite.role === "admin" && !company.admins.includes(user._id)) {
      company.admins.push(user._id);
    }
    if (!company.recruiters.includes(user._id)) {
      company.recruiters.push(user._id);
    }
    await company.save();

    // Marcar convite como usado
    invite.used = true;
    await invite.save();

    return NextResponse.json(
      {
        success: true,
        message: "Convite aceito com sucesso",
        companyId: company._id,
        companyName: company.name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
