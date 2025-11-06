import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Application from "@/models/Application";
import Job from "@/models/Job";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { jobId, coverLetter } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "ID da vaga é obrigatório" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already applied
    const existingApplication = await Application.findOne({
      jobId,
      candidateId: session.user.id,
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "Você já se candidatou a esta vaga" },
        { status: 400 }
      );
    }

    // Check if job exists and is active
    const job = await Job.findOne({ _id: jobId, status: "active" });
    if (!job) {
      return NextResponse.json(
        { error: "Vaga não encontrada ou não está mais ativa" },
        { status: 404 }
      );
    }

    const application = new Application({
      jobId,
      candidateId: session.user.id,
      coverLetter,
    });

    await application.save();

    // Update job applications count
    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicationsCount: 1 },
    });

    return NextResponse.json(
      { message: "Candidatura enviada com sucesso", application },
      { status: 201 }
    );
  } catch (error) {
    console.error("Application creation error:", error);
    return NextResponse.json(
      { error: "Erro ao enviar candidatura" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    const applications = await Application.find({
      candidateId: session.user.id,
    })
      .populate("jobId", "title companyId")
      .populate({
        path: "jobId",
        populate: {
          path: "companyId",
          select: "name logoUrl",
        },
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Applications fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar candidaturas" },
      { status: 500 }
    );
  }
}
