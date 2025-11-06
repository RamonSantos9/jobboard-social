import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import Company from "@/models/Company";
import Recruiter from "@/models/Recruiter";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const recruiterId = params.id;
    const { reason } = await request.json();

    // Buscar recrutador
    const recruiter = await Recruiter.findById(recruiterId).populate(
      "companyId"
    );
    if (!recruiter) {
      return NextResponse.json(
        { error: "Recrutador não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é admin da empresa
    const company = await Company.findById(recruiter.companyId);
    if (!company || company.adminUserId.toString() !== session.user.id) {
      return NextResponse.json(
        {
          error: "Apenas o administrador da empresa pode rejeitar recrutadores",
        },
        { status: 403 }
      );
    }

    // Verificar se já foi processado
    if (recruiter.status !== "pending") {
      return NextResponse.json(
        { error: "Solicitação já foi processada" },
        { status: 400 }
      );
    }

    // Rejeitar recrutador
    recruiter.status = "rejected";
    recruiter.approvedBy = session.user.id;
    recruiter.approvedAt = new Date();
    await recruiter.save();

    // Atualizar status do usuário
    const user = await User.findById(recruiter.userId);
    if (user) {
      user.status = "suspended";
      await user.save();
    }

    // Remover da lista de pendentes
    company.pendingRecruiters = company.pendingRecruiters.filter(
      (id) => id.toString() !== recruiter.userId.toString()
    );
    await company.save();

    // TODO: Enviar notificação para o recrutador
    // TODO: Enviar email de rejeição com motivo

    return NextResponse.json({
      message: "Solicitação de recrutador rejeitada",
      recruiter: {
        id: recruiter._id,
        status: recruiter.status,
        rejectedAt: recruiter.approvedAt,
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



