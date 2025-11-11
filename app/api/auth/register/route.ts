import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import Invite from "@/models/Invite";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email, password, token } = await request.json();

    // Validar dados obrigatórios
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Validar senha mínima
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    let companyId = null;
    let userRole = "user";
    let isRecruiter = false;

    // Se houver token de convite, processar
    if (token) {
      const invite = await Invite.findOne({
        token,
        used: false,
        expiresAt: { $gt: new Date() },
      }).populate("companyId");

      if (!invite) {
        return NextResponse.json(
          { error: "Convite inválido ou expirado" },
          { status: 400 }
        );
      }

      // Verificar se o email do convite corresponde
      if (invite.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email não corresponde ao convite" },
          { status: 403 }
        );
      }

      companyId = invite.companyId._id;
      userRole = invite.role === "admin" ? "admin" : "user";
      isRecruiter = true;

      // Marcar convite como usado
      invite.used = true;
      await invite.save();
    }

    // Criar usuário
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
      companyId,
      isRecruiter,
      status: "active",
      onboardingCompleted: false,
    });

    await user.save();

    // Se tem convite, adicionar user à company
    if (token && companyId) {
      const company = await Company.findById(companyId);
      if (company) {
        if (userRole === "admin") {
          if (!company.admins.includes(user._id)) {
            company.admins.push(user._id);
          }
        }
        if (!company.recruiters.includes(user._id)) {
          company.recruiters.push(user._id);
        }
        await company.save();
      }
    }

    return NextResponse.json(
      {
        message: "Usuário cadastrado com sucesso",
        userId: user._id,
        companyId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
