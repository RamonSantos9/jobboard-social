import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Job from "@/models/Job";
import Company from "@/models/Company";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      title,
      companyId,
      workLocationType,
      location,
      jobType,
      description,
      salaryMin,
      salaryMax,
      requirements,
      benefits,
    } = body;

    // Validar campos obrigatórios
    if (!title || !companyId || !workLocationType || !location || !jobType) {
      return NextResponse.json(
        { error: "Campos obrigatórios: título, empresa, tipo de localização, localização e tipo de vaga" },
        { status: 400 }
      );
    }

    // Verificar se a empresa existe e se o usuário tem permissão
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é admin ou recrutador da empresa
    const isAdmin = company.admins.some(
      (admin: any) => admin.toString() === session.user.id
    );
    const isRecruiter = company.recruiters.some(
      (recruiter: any) => recruiter.toString() === session.user.id
    );

    if (!isAdmin && !isRecruiter) {
      return NextResponse.json(
        { error: "Você não tem permissão para criar vagas nesta empresa" },
        { status: 403 }
      );
    }

    // Determinar se é remoto baseado no workLocationType
    const remote = workLocationType === "remoto";

    // Criar a vaga
    const job = new Job({
      companyId,
      title,
      description: description || "",
      requirements: requirements || [],
      responsibilities: [],
      salaryRange:
        salaryMin || salaryMax
          ? {
              min: salaryMin ? parseFloat(salaryMin) : 0,
              max: salaryMax ? parseFloat(salaryMax) : 0,
              currency: "BRL",
            }
          : undefined,
      location,
      remote,
      type: jobType,
      level: "mid", // Default, pode ser ajustado depois
      category: company.industry || "Tecnologia",
      skills: [],
      benefits: benefits || [],
      status: "active",
      applicationsCount: 0,
      viewsCount: 0,
    });

    await job.save();

    // Incrementar contador de vagas da empresa
    await Company.findByIdAndUpdate(companyId, {
      $inc: { jobsCount: 1 },
    });

    // Popular dados da empresa para retornar
    const createdJob = await Job.findById(job._id).populate(
      "companyId",
      "name logoUrl"
    );

    return NextResponse.json(
      {
        message: "Vaga criada com sucesso",
        job: createdJob,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao criar vaga:", error);
    return NextResponse.json(
      { error: "Erro ao criar vaga", details: error.message },
      { status: 500 }
    );
  }
}
