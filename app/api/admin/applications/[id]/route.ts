import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Application from "@/models/Application";
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

    // Verificar se o usuário é admin
    const currentUser = await User.findById(session.user.id).select("role").lean();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem acessar." },
        { status: 403 }
      );
    }

    const application = await Application.findById(params.id)
      .populate("jobId", "title companyId")
      .populate("candidateId", "name email")
      .lean();

    if (!application) {
      return NextResponse.json(
        { error: "Candidatura não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Get application error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar candidatura" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Verificar se o usuário é admin
    const currentUser = await User.findById(session.user.id).select("role").lean();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem editar candidaturas." },
        { status: 403 }
      );
    }

    const applicationId = params.id;
    const body = await request.json();

    // Verificar se a candidatura existe
    const application = await Application.findById(applicationId);
    if (!application) {
      return NextResponse.json(
        { error: "Candidatura não encontrada" },
        { status: 404 }
      );
    }

    // Atualizar campos permitidos
    const allowedFields = [
      "status",
      "coverLetter",
      "resumeUrl",
      "notes",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        (application as any)[field] = body[field];
      }
    });

    // Se status mudou para reviewed ou accepted, atualizar reviewedAt
    if (body.status && (body.status === "reviewed" || body.status === "accepted" || body.status === "rejected")) {
      application.reviewedAt = new Date();
    }

    await application.save();

    // Buscar candidatura atualizada com dados populados
    const updatedApplication = await Application.findById(applicationId)
      .populate("jobId", "title companyId")
      .populate("candidateId", "name email")
      .lean();

    return NextResponse.json({
      application: updatedApplication,
      message: "Candidatura atualizada com sucesso",
    });
  } catch (error) {
    console.error("Update application error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar candidatura" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verificar se o usuário é admin
    const currentUser = await User.findById(session.user.id).select("role").lean();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem deletar candidaturas." },
        { status: 403 }
      );
    }

    const applicationId = params.id;

    const application = await Application.findById(applicationId);
    if (!application) {
      return NextResponse.json(
        { error: "Candidatura não encontrada" },
        { status: 404 }
      );
    }

    const jobId = application.jobId;

    await Application.findByIdAndDelete(applicationId);

    // Atualizar contador de candidaturas da vaga
    if (jobId) {
      await Vacancy.findByIdAndUpdate(jobId, {
        $inc: { applicationsCount: -1 },
      });
    }

    return NextResponse.json({
      message: "Candidatura deletada com sucesso",
    });
  } catch (error) {
    console.error("Delete application error:", error);
    return NextResponse.json(
      { error: "Erro ao deletar candidatura" },
      { status: 500 }
    );
  }
}

