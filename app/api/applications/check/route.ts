import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Application from "@/models/Application";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "ID da vaga é obrigatório" },
        { status: 400 }
      );
    }

    // Validar se jobId é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({
        hasApplied: false,
        applicationId: null,
      });
    }

    await connectDB();

    const existingApplication = await Application.findOne({
      jobId,
      candidateId: session.user.id,
    }).lean();

    return NextResponse.json({
      hasApplied: !!existingApplication,
      applicationId: existingApplication?._id?.toString() || null,
    });
  } catch (error) {
    console.error("Check application error:", error);
    return NextResponse.json(
      { error: "Erro ao verificar candidatura" },
      { status: 500 }
    );
  }
}

