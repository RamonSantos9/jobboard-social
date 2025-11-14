import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Company from "@/models/Company";
import Vacancy, { vacancyLevelSalaryBands, type VacancyLevel } from "@/models/Vacancy";
import { generateCompanyUsername, generateCompanyPassword } from "@/lib/company-utils";

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

    const body = await request.json();
    const {
      title,
      companyId,
      workLocationType,
      location,
      jobType,
      level = "mid",
      description,
      salaryMin,
      salaryMax,
      requirements,
      benefits,
      skills,
      tags,
    } = body;

    // Validar campos obrigatórios
    if (!title || !companyId || !workLocationType || !location || !jobType) {
      return NextResponse.json(
        { error: "Campos obrigatórios: título, empresa, tipo de localização, localização e tipo de vaga" },
        { status: 400 }
      );
    }

    // Validar e tipar o nível
    const validLevels: VacancyLevel[] = ["junior", "mid", "senior", "lead", "executive"];
    if (!validLevels.includes(level as VacancyLevel)) {
      return NextResponse.json(
        { error: "Nível informado é inválido" },
        { status: 400 }
      );
    }

    const typedLevel = level as VacancyLevel;

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
      (admin: mongoose.Types.ObjectId) => admin.toString() === session.user.id
    );
    const isRecruiter = company.recruiters.some(
      (recruiter: mongoose.Types.ObjectId) => recruiter.toString() === session.user.id
    );

    if (!isAdmin && !isRecruiter) {
      return NextResponse.json(
        { error: "Você não tem permissão para criar vagas nesta empresa" },
        { status: 403 }
      );
    }

    // Gerar credenciais automaticamente se a empresa não tiver
    let credentialsGenerated = false;
    let generatedUsername = "";
    let generatedPassword = "";
    
    if (!company.username || !company.password) {
      if (!company.username) {
        generatedUsername = await generateCompanyUsername(company.name, company.cnpj);
        company.username = generatedUsername;
      }
      
      if (!company.password) {
        generatedPassword = generateCompanyPassword();
        company.password = generatedPassword; // Será hasheado pelo pre-save hook
      }
      
      await company.save();
      credentialsGenerated = true;
    }

    // Determinar se é remoto baseado no workLocationType
    const remote = workLocationType !== "presencial";

    let salaryRange;
    if (typeof salaryMin === "number" || typeof salaryMax === "number") {
      const band = vacancyLevelSalaryBands[typedLevel];
      const min = typeof salaryMin === "number" ? salaryMin : band.min;
      const max = typeof salaryMax === "number" ? salaryMax : band.max;

      if (min > max) {
        return NextResponse.json(
          { error: "Salário mínimo não pode ser maior que o máximo" },
          { status: 400 }
        );
      }

      if (min < band.min || max > band.max) {
        return NextResponse.json(
          {
            error: `Faixa salarial deve estar entre R$${band.min} e R$${band.max} para o nível ${typedLevel}`,
          },
          { status: 400 }
        );
      }

      salaryRange = {
        min,
        max,
        currency: "BRL",
      } as const;
    }

    // Criar a vaga
    const job = await Vacancy.create({
      companyId,
      postedBy: session.user.id,
      title,
      description: description || "",
      requirements: requirements || [],
      responsibilities: [],
      benefits: benefits || [],
      skills: skills || [],
      tags: tags || [],
      salaryRange,
      location,
      remote,
      type: jobType,
      level: typedLevel,
      category: company.industry || "Tecnologia",
      status: "published",
      publishedAt: new Date(),
      applicationsCount: 0,
      viewsCount: 0,
    });

    // Incrementar contador de vagas da empresa
    await Company.findByIdAndUpdate(companyId, {
      $inc: { jobsCount: 1 },
    });

    // Popular dados da empresa para retornar
    const createdJob = await Vacancy.findById(job._id).populate(
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
