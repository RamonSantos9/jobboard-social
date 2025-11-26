import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
// Importar modelos antes de usar
import Company from "@/models/Company";
import Vacancy from "@/models/Vacancy";

// Cache simples em memória (válido por 30 segundos)
let cache: {
  data: any;
  timestamp: number;
  key: string;
} | null = null;

// Cache separado para o total (válido por 5 minutos - muda menos)
let totalCache: {
  count: number;
  timestamp: number;
} | null = null;

const CACHE_TTL = 30 * 1000; // 30 segundos
const TOTAL_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

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
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Máximo 100
    const skip = (page - 1) * limit;

    // Chave de cache baseada nos parâmetros
    const cacheKey = `jobs-${page}-${limit}`;
    const now = Date.now();

    // Verificar cache
    if (cache && cache.key === cacheKey && (now - cache.timestamp) < CACHE_TTL) {
      console.log(`✅ Cache HIT para ${cacheKey}`);
      // Usar Response direta para evitar overhead do Next.js
      return new Response(JSON.stringify(cache.data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=30'
        }
      });
    }

    console.log(`❌ Cache MISS para ${cacheKey}`);

    // Verificar cache do total
    let total: number;
    if (totalCache && (now - totalCache.timestamp) < TOTAL_CACHE_TTL) {
      total = totalCache.count;
      console.log(`✅ Total em cache: ${total}`);
    } else {
      // Usar estimatedDocumentCount para melhor performance
      // Nota: É uma estimativa, mas muito mais rápido que countDocuments
      total = await Vacancy.estimatedDocumentCount();
      totalCache = { count: total, timestamp: now };
      console.log(`❌ Total recalculado: ${total}`);
    }

    // Buscar apenas os jobs (sem count em paralelo)
    const jobs = await Vacancy.find({ status: "published" })
      .populate("companyId", "name logoUrl location") // Projeção: só campos necessários
      .select("title description location remote type level category salaryRange skills benefits publishedAt createdAt") // Projeção: só campos necessários
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // lean() para objetos JS simples (mais rápido)

    console.log(`Total de vagas: ${total}, Retornando: ${jobs.length}`);

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
        createdAt: (job.publishedAt || job.createdAt)?.toISOString?.() || new Date().toISOString(),
      };
    });

    const responseData = {
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Atualizar cache
    cache = {
      data: responseData,
      timestamp: now,
      key: cacheKey
    };

    return NextResponse.json(responseData, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=30'
      }
    });
  } catch (error) {
    console.error("Jobs fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vagas" },
      { status: 500 }
    );
  }
}
