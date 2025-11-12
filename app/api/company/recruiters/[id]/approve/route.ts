import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import User from "@/models/User";
import Company from "@/models/Company";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const recruiterUserId = id;

    // Buscar usuário recrutador
    const recruiterUser = await User.findById(recruiterUserId);
    if (!recruiterUser) {
      return NextResponse.json(
        { error: "Recrutador não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é realmente um recrutador
    if (!recruiterUser.isRecruiter || !recruiterUser.companyId) {
      return NextResponse.json(
        { error: "Usuário não é um recrutador" },
        { status: 400 }
      );
    }

    // Buscar empresa do recrutador
    const company = await Company.findById(recruiterUser.companyId);
    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é admin da empresa
    const isAdmin = company.admins.some(
      (adminId: mongoose.Types.ObjectId) => adminId.toString() === session.user.id
    );
    if (!isAdmin) {
      return NextResponse.json(
        {
          error: "Apenas o administrador da empresa pode aprovar recrutadores",
        },
        { status: 403 }
      );
    }

    // Verificar se já foi aprovado (status active e onboardingCompleted)
    if (recruiterUser.status === "active" && recruiterUser.onboardingCompleted) {
      return NextResponse.json(
        { error: "Recrutador já foi aprovado" },
        { status: 400 }
      );
    }

    // Aprovar recrutador - atualizar status do usuário
    recruiterUser.status = "active";
    recruiterUser.onboardingCompleted = true;
    await recruiterUser.save();

    // Adicionar recrutador à lista de recrutadores da empresa (se ainda não estiver)
    if (!company.recruiters.some((id: mongoose.Types.ObjectId) => id.toString() === recruiterUserId)) {
      company.recruiters.push(recruiterUser._id);
      await company.save();
    }

    // TODO: Enviar notificação para o recrutador
    // TODO: Enviar email de aprovação

    return NextResponse.json({
      message: "Recrutador aprovado com sucesso",
      recruiter: {
        id: recruiterUser._id,
        status: recruiterUser.status,
        approvedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Erro ao aprovar recrutador:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
