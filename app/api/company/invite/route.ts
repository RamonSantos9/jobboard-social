import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import Invite from "@/models/Invite";
import Notification from "@/models/Notification";
import { sendInviteEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;
    const { email, role } = await request.json();

    // Validar dados
    if (!email || !role) {
      return NextResponse.json(
        { error: "Email e role são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar role
    if (!["recruiter", "admin"].includes(role)) {
      return NextResponse.json({ error: "Role inválido" }, { status: 400 });
    }

    // Validar email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuário que está convidando
    const inviter = await User.findById(userId);
    if (!inviter || !inviter.companyId) {
      return NextResponse.json(
        { error: "Usuário não vinculado a nenhuma empresa" },
        { status: 400 }
      );
    }

    // Buscar empresa e verificar se user é admin
    const company = await Company.findById(inviter.companyId);
    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    if (!company.admins.includes(userId)) {
      return NextResponse.json(
        { error: "Apenas administradores podem enviar convites" },
        { status: 403 }
      );
    }

    // Verificar se email já está na empresa
    const existingMember = await User.findOne({
      email: normalizedEmail,
      companyId: company._id,
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "Este usuário já faz parte da empresa" },
        { status: 400 }
      );
    }

    // Verificar se já existe convite pendente
    const existingInvite = await Invite.findOne({
      email: normalizedEmail,
      companyId: company._id,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "Já existe um convite pendente para este email" },
        { status: 400 }
      );
    }

    // Gerar token único
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    // Criar invite
    const invite = new Invite({
      companyId: company._id,
      email: normalizedEmail,
      role,
      token,
      createdBy: userId,
      used: false,
      expiresAt,
    });

    await invite.save();

    // Verificar se usuário já existe (FLUXO LINKEDIN)
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      // CASO A: Usuário existe - criar notificação interna
      const notification = new Notification({
        userId: existingUser._id,
        type: "company_invite",
        title: "Convite para empresa",
        message: `Você foi convidado para ser ${
          role === "admin" ? "administrador" : "recrutador"
        } na empresa ${company.name}`,
        read: false,
        metadata: {
          companyId: company._id,
          inviteId: invite._id,
          role,
          invitedBy: userId,
        },
      });

      await notification.save();

      return NextResponse.json(
        {
          success: true,
          type: "notification",
          message: `Notificação enviada para ${existingUser.name}`,
          userId: existingUser._id,
        },
        { status: 200 }
      );
    } else {
      // CASO B: Usuário não existe - enviar email
      const acceptUrl = `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/invite/accept?token=${token}`;

      const emailSent = await sendInviteEmail(
        normalizedEmail,
        company.name,
        role === "admin" ? "Administrador" : "Recrutador",
        acceptUrl
      );

      if (!emailSent) {
        console.warn("Erro ao enviar email, mas convite foi criado");
      }

      return NextResponse.json(
        {
          success: true,
          type: "email",
          message: `Email enviado para ${normalizedEmail}`,
          inviteId: invite._id,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Erro ao enviar convite:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
