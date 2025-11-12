import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
// Importar modelos antes de usar
import Company from "@/models/Company";
import Vacancy, { IVacancy } from "@/models/Vacancy";
import Profile, { IProfile } from "@/models/Profile";
import { calculateJobMatchScore } from "@/lib/jobRecommendation";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    await connectDB();
    
    // Garantir que os modelos estão registrados
    if (!mongoose.models.Company) {
      await import("@/models/Company");
    }
    if (!mongoose.models.Vacancy) {
      await import("@/models/Vacancy");
    }

    // Buscar todas as vagas publicadas
    const jobs = (await Vacancy.find({ status: "published" })
      .populate("companyId", "name logoUrl location")
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean()
      .limit(100)) as unknown as Partial<IVacancy>[];

    let jobsWithScores;

    if (session) {
      // Buscar perfil do usuário
      const profile = (await Profile.findOne({ userId: session.user.id }).lean()) as unknown as Partial<IProfile> | null;

      if (profile) {
        // Calcular scores para cada vaga
        jobsWithScores = jobs.map((job) => {
          const score = calculateJobMatchScore(profile, job);
          return {
            ...job,
            matchScore: score.total,
            matchBreakdown: score.breakdown,
          };
        });

        // Ordenar por score (maior primeiro)
        jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);
      } else {
        // Se não tem perfil, retornar vagas sem score
        jobsWithScores = jobs;
      }
    } else {
      // Se não está logado, retornar vagas sem score
      jobsWithScores = jobs;
    }

    console.log(`Vagas encontradas: ${jobs.length}`);

    // Formatar os dados para o formato esperado pelo frontend
    const formattedJobs = jobsWithScores.map((job: any) => {
      // Tratar companyId que pode ser ObjectId ou objeto populado
      let companyData = {
        _id: "",
        name: "Empresa",
        logoUrl: undefined as string | undefined,
        location: undefined as string | undefined,
      };

      if (job.companyId) {
        if (typeof job.companyId === "object" && job.companyId._id) {
          // Objeto populado
          companyData = {
            _id: job.companyId._id.toString(),
            name: job.companyId.name || "Empresa",
            logoUrl: job.companyId.logoUrl,
            location: job.companyId.location,
          };
        } else if (typeof job.companyId === "object") {
          // Pode ser ObjectId
          companyData._id = job.companyId.toString();
        }
      }

      return {
        _id: job._id.toString(),
        title: job.title,
        description: job.description,
        location: job.location,
        remote: job.remote,
        type: job.type,
        level: job.level,
        category: job.category,
        salaryRange: job.salaryRange,
        companyId: companyData,
        skills: job.skills || [],
        benefits: job.benefits || [],
        matchScore: job.matchScore,
        matchBreakdown: job.matchBreakdown,
        createdAt: (job.publishedAt || job.createdAt)?.toISOString() || new Date().toISOString(),
      };
    });

    // Retornar top 50 vagas (ou todas se tiver menos)
    const recommendedJobs = formattedJobs.slice(0, 50);

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
