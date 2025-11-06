import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import Invite from "@/models/Invite";
import Notification from "@/models/Notification";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;
    const { notificationId, inviteId, accept } = await request.json();

    if (!notificationId || !inviteId || accept === undefined) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Buscar notificação
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se notificação pertence ao usuário
    if (notification.userId.toString() !== userId) {
      return NextResponse.json(
        { error: "Notificação não pertence a este usuário" },
        { status: 403 }
      );
    }

    // Buscar convite
    const invite = await Invite.findById(inviteId);
    if (!invite) {
      return NextResponse.json(
        { error: "Convite não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se convite já foi usado
    if (invite.used) {
      return NextResponse.json(
        { error: "Convite já foi utilizado" },
        { status: 400 }
      );
    }

    // Verificar se convite expirou
    if (invite.expiresAt < new Date()) {
      notification.read = true;
      notification.accepted = false;
      await notification.save();

      return NextResponse.json({ error: "Convite expirado" }, { status: 400 });
    }

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se email corresponde
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email não corresponde ao convite" },
        { status: 403 }
      );
    }

    // Marcar notificação como lida
    notification.read = true;
    notification.accepted = accept;
    await notification.save();

    if (accept) {
      // Aceitar convite
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
          accepted: true,
          message: "Convite aceito com sucesso",
          companyId: company._id,
          companyName: company.name,
        },
        { status: 200 }
      );
    } else {
      // Recusar convite
      return NextResponse.json(
        {
          success: true,
          accepted: false,
          message: "Convite recusado",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Erro ao processar resposta ao convite:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
