import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import User from "@/models/User";
import Application from "@/models/Application";
import Company from "@/models/Company";
import Vacancy from "@/models/Vacancy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
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

    const { id, applicationId } = await params;
    const companyId = id;

    // Verificar se a empresa existe
    const company = (await Company.findById(companyId).lean()) as unknown as {
      _id: mongoose.Types.ObjectId;
      admins?: mongoose.Types.ObjectId[];
      recruiters?: mongoose.Types.ObjectId[];
    } | null;
    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é admin do sistema
    const user = await User.findById(session.user.id).select("role").lean() as { role?: string } | null;
    const isSystemAdmin = user?.role === "admin";

    // Verificar se o usuário é admin ou recrutador da empresa
    const isCompanyAdmin = company.admins?.some(
      (admin: mongoose.Types.ObjectId) => admin.toString() === session.user.id
    );
    const isRecruiter = company.recruiters?.some(
      (recruiter: mongoose.Types.ObjectId) => recruiter.toString() === session.user.id
    );

    if (!isSystemAdmin && !isCompanyAdmin && !isRecruiter) {
      return NextResponse.json(
        { error: "Você não tem permissão para acessar esta candidatura" },
        { status: 403 }
      );
    }

    // Buscar candidatura
    const application = await Application.findById(applicationId)
      .populate("candidateId", "name email")
      .populate("jobId", "title companyId")
      .lean();

    if (!application) {
      return NextResponse.json(
        { error: "Candidatura não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se a candidatura pertence a uma vaga da empresa
    const job = application.jobId as any;
    if (job?.companyId?.toString() !== companyId) {
      return NextResponse.json(
        { error: "Candidatura não pertence a esta empresa" },
        { status: 403 }
      );
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Application fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar candidatura" },
      { status: 500 }
    );
  }
}

