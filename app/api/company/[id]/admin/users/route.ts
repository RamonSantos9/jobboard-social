import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import User from "@/models/User";
import Application from "@/models/Application";
import Company from "@/models/Company";
import Vacancy from "@/models/Vacancy";
import Profile from "@/models/Profile";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
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
        { error: "Você não tem permissão para acessar estes dados" },
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
      .lean();

    // Extrair IDs únicos de candidatos
    const candidateIds = [...new Set(
      applications.map((app: any) => app.candidateId?._id?.toString()).filter(Boolean)
    )];

    // Buscar usuários com seus perfis (apenas dados públicos)
    const users = await User.find({
      _id: { $in: candidateIds },
    })
      .select("name email profile createdAt")
      .populate("profile", "firstName lastName headline location bio sector photoUrl bannerUrl experience education skills")
      .lean();

    // Buscar histórico de candidaturas para cada usuário
    const usersWithApplications = users.map((user: any) => {
      const userApplications = applications.filter(
        (app: any) => app.candidateId?._id?.toString() === user._id.toString()
      );
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        applicationsCount: userApplications.length,
        applications: userApplications.map((app: any) => ({
          _id: app._id,
          jobTitle: app.jobId?.title || "Vaga",
          status: app.status,
          createdAt: app.createdAt,
        })),
        createdAt: user.createdAt,
      };
    });

    return NextResponse.json({ users: usersWithApplications });
  } catch (error) {
    console.error("Company users fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

