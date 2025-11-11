import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Application from "@/models/Application";
import Vacancy from "@/models/Vacancy";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    // Verificar se o usuário é admin
    const user = await User.findById(session.user.id).select("role").lean();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem acessar." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") || "";

    // Construir query
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const [applications, total] = await Promise.all([
      Application.find(query)
        .select("status createdAt jobId candidateId")
        .populate("jobId", "title companyId")
        .populate("candidateId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Application.countDocuments(query),
    ]);

    return NextResponse.json({
      applications,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin applications fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar candidaturas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    // Verificar se o usuário é admin
    const user = await User.findById(session.user.id).select("role").lean();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem criar candidaturas." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { jobId, candidateId, coverLetter, resumeUrl, status, notes } = body;

    // Validar campos obrigatórios
    if (!jobId || !candidateId) {
      return NextResponse.json(
        { error: "Campos obrigatórios: vaga e candidato" },
        { status: 400 }
      );
    }

    // Verificar se a vaga existe
    const vacancy = await Vacancy.findById(jobId);
    if (!vacancy) {
      return NextResponse.json(
        { error: "Vaga não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se o candidato existe
    const candidate = await User.findById(candidateId);
    if (!candidate) {
      return NextResponse.json(
        { error: "Candidato não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se já existe candidatura
    const existingApplication = await Application.findOne({
      jobId,
      candidateId,
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "Candidatura já existe para esta vaga" },
        { status: 400 }
      );
    }

    // Criar candidatura
    const application = new Application({
      jobId,
      candidateId,
      coverLetter: coverLetter || undefined,
      resumeUrl: resumeUrl || undefined,
      status: status || "pending",
      notes: notes || undefined,
      appliedAt: new Date(),
    });

    await application.save();

    // Atualizar contador de candidaturas da vaga
    await Vacancy.findByIdAndUpdate(jobId, {
      $inc: { applicationsCount: 1 },
    });

    // Buscar candidatura criada com dados populados
    const createdApplication = await Application.findById(application._id)
      .populate("jobId", "title companyId")
      .populate("candidateId", "name email")
      .lean();

    return NextResponse.json(
      {
        application: createdApplication,
        message: "Candidatura criada com sucesso",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create application error:", error);
    return NextResponse.json(
      { error: "Erro ao criar candidatura" },
      { status: 500 }
    );
  }
}

