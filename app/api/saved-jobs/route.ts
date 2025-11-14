import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import SavedJob from "@/models/SavedJob";
import Vacancy from "@/models/Vacancy";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    const savedJobs = await SavedJob.find({ userId })
      .populate({
        path: "jobId",
        populate: {
          path: "companyId",
          select: "name logoUrl location",
        },
      })
      .sort({ savedAt: -1 })
      .lean();

    const jobs = savedJobs
      .map((sj) => (sj as any).jobId)
      .filter((job) => job && job.status === "published");

    return NextResponse.json({ jobs, count: jobs.length });
  } catch (error: any) {
    console.error("Erro ao buscar vagas salvas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vagas salvas", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId é obrigatório" },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const jobIdObj = new mongoose.Types.ObjectId(jobId);

    // Verificar se a vaga existe
    const job = await Vacancy.findById(jobIdObj);
    if (!job) {
      return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
    }

    // Verificar se já está salva
    const existing = await SavedJob.findOne({ userId, jobId: jobIdObj });
    if (existing) {
      return NextResponse.json({ error: "Vaga já está salva" }, { status: 400 });
    }

    // Salvar
    const savedJob = new SavedJob({
      userId,
      jobId: jobIdObj,
      savedAt: new Date(),
    });

    await savedJob.save();

    // Registrar interação
    try {
      const UserInteraction = (await import("@/models/UserInteraction")).default;
      const interaction = new UserInteraction({
        userId,
        itemType: "job",
        itemId: jobIdObj,
        interactionType: "save",
        timestamp: new Date(),
      });
      await interaction.save();
    } catch (error) {
      // Ignorar erro se não conseguir registrar interação
    }

    return NextResponse.json({ success: true, savedJob: savedJob.toObject() });
  } catch (error: any) {
    if (error.code === 11000) {
      // Duplicata
      return NextResponse.json({ error: "Vaga já está salva" }, { status: 400 });
    }

    console.error("Erro ao salvar vaga:", error);
    return NextResponse.json(
      { error: "Erro ao salvar vaga", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId é obrigatório" },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const jobIdObj = new mongoose.Types.ObjectId(jobId);

    const deleted = await SavedJob.findOneAndDelete({ userId, jobId: jobIdObj });

    if (!deleted) {
      return NextResponse.json({ error: "Vaga salva não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao remover vaga salva:", error);
    return NextResponse.json(
      { error: "Erro ao remover vaga salva", details: error.message },
      { status: 500 }
    );
  }
}

