import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import Recruiter from "@/models/Recruiter";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const recruiterId = params.id;

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
          error: "Apenas o administrador da empresa pode aprovar recrutadores",
        },
        { status: 403 }
      );
    }

    // Verificar se já foi aprovado
    if (recruiter.status === "approved") {
      return NextResponse.json(
        { error: "Recrutador já foi aprovado" },
        { status: 400 }
      );
    }

    // Aprovar recrutador
    recruiter.status = "approved";
    recruiter.approvedBy = session.user.id;
    recruiter.approvedAt = new Date();
    await recruiter.save();

    // Atualizar status do usuário
    const user = await User.findById(recruiter.userId);
    if (user) {
      user.status = "active";
      user.onboardingCompleted = true;
      await user.save();
    }

    // Adicionar recrutador à empresa
    company.recruiters.push(recruiter.userId);
    company.pendingRecruiters = company.pendingRecruiters.filter(
      (id) => id.toString() !== recruiter.userId.toString()
    );
    await company.save();

    // TODO: Enviar notificação para o recrutador
    // TODO: Enviar email de aprovação

    return NextResponse.json({
      message: "Recrutador aprovado com sucesso",
      recruiter: {
        id: recruiter._id,
        status: recruiter.status,
        approvedAt: recruiter.approvedAt,
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



