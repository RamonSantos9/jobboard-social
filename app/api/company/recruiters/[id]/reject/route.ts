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
    const { reason } = await request.json();

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
          error: "Apenas o administrador da empresa pode rejeitar recrutadores",
        },
        { status: 403 }
      );
    }

    // Verificar se já foi processado (status não é pending)
    if (recruiterUser.status !== "pending") {
      return NextResponse.json(
        { error: "Solicitação já foi processada" },
        { status: 400 }
      );
    }

    // Rejeitar recrutador - atualizar status do usuário
    recruiterUser.status = "suspended";
    await recruiterUser.save();

    // Remover da lista de recrutadores da empresa
    company.recruiters = company.recruiters.filter(
      (id: mongoose.Types.ObjectId) => id.toString() !== recruiterUserId
    );
    await company.save();

    // Mock notification and email
    console.log(`[MOCK NOTIFICATION] Recruiter rejected: ${recruiterUser.email}`);
    console.log(`[MOCK EMAIL] Rejection email sent to: ${recruiterUser.email}. Reason: ${reason}`);
    
    // In a real implementation, we would create a notification record here
    // const notification = await Notification.create({ ... });

    return NextResponse.json({
      message: "Solicitação de recrutador rejeitada",
      recruiter: {
        id: recruiterUser._id,
        status: recruiterUser.status,
        rejectedAt: new Date(),
        reason: reason || "Não especificado",
      },
    });
  } catch (error) {
    console.error("Erro ao rejeitar recrutador:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
