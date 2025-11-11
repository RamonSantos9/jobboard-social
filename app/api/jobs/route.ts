import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
// Importar modelos antes de usar
import Company from "@/models/Company";
import Vacancy from "@/models/Vacancy";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Garantir que os modelos estão registrados
    if (!mongoose.models.Company) {
      await import("@/models/Company");
    }
    if (!mongoose.models.Vacancy) {
      await import("@/models/Vacancy");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const jobs = await Vacancy.find({ status: "published" })
      .populate("companyId", "name logoUrl location")
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Vacancy.countDocuments({ status: "published" });

    console.log(`Total de vagas encontradas: ${total}, Retornando: ${jobs.length}`);

    // Formatar os dados para o formato esperado pelo frontend
    const formattedJobs = jobs.map((job: any) => {
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
        createdAt: (job.publishedAt || job.createdAt)?.toISOString() || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Jobs fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vagas" },
      { status: 500 }
    );
  }
}
