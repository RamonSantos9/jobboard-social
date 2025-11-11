import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Application from "@/models/Application";
import Company from "@/models/Company";
import Vacancy from "@/models/Vacancy";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    const companyId = params.id;

    // Verificar se a empresa existe
    const company = await Company.findById(companyId).lean();
    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é admin do sistema
    const user = await User.findById(session.user.id).select("role").lean();
    const isSystemAdmin = user?.role === "admin";

    // Verificar se o usuário é admin ou recrutador da empresa
    const isCompanyAdmin = company.admins?.some(
      (admin: any) => admin.toString() === session.user.id
    );
    const isRecruiter = company.recruiters?.some(
      (recruiter: any) => recruiter.toString() === session.user.id
    );

    if (!isSystemAdmin && !isCompanyAdmin && !isRecruiter) {
      return NextResponse.json(
        { error: "Você não tem permissão para acessar estas candidaturas" },
        { status: 403 }
      );
    }

    // Buscar vagas da empresa
    const companyVacancyIds = await Vacancy.find({ companyId }).distinct("_id");

    // Buscar candidaturas
    const applications = await Application.find({
      jobId: { $in: companyVacancyIds },
    })
      .populate("candidateId", "name email")
      .populate("jobId", "title")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Company applications fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar candidaturas" },
      { status: 500 }
    );
  }
}
