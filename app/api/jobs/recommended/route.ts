import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Job from "@/models/Job";
import Profile from "@/models/Profile";
import { calculateJobMatchScore } from "@/lib/jobRecommendation";

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

    // Buscar perfil do usuário
    const profile = await Profile.findOne({ userId: session.user.id }).lean();

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    // Buscar todas as vagas ativas
    const jobs = await Job.find({ status: "active" })
      .populate("companyId", "name logoUrl")
      .lean()
      .limit(100);

    // Calcular scores para cada vaga
    const jobsWithScores = jobs.map((job) => {
      const score = calculateJobMatchScore(profile, job);
      return {
        ...job,
        matchScore: score.total,
        matchBreakdown: score.breakdown,
      };
    });

    // Ordenar por score (maior primeiro)
    jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

    // Retornar top 20 vagas recomendadas
    const recommendedJobs = jobsWithScores.slice(0, 20);

    return NextResponse.json({
      jobs: recommendedJobs,
      total: recommendedJobs.length,
    });
  } catch (error: any) {
    console.error("Erro ao buscar vagas recomendadas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vagas recomendadas", details: error.message },
      { status: 500 }
    );
  }
}
