import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Vacancy from "@/models/Vacancy";
import Company from "@/models/Company";
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

    await connectDB();

    // Verificar se o usuário é admin
    const user = await User.findById(session.user.id).select("role").lean() as { role?: string } | null;
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem acessar." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    // Construir query de busca
    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const [vacancies, total] = await Promise.all([
      Vacancy.find(query)
        .select("title description location remote type level category salaryRange requirements responsibilities benefits skills tags status applicationsCount viewsCount createdAt companyId postedBy _id")
        .populate("companyId", "name logoUrl")
        .populate("postedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vacancy.countDocuments(query),
    ]);

    // Calcular applicationsCount real para cada vaga
    const vacancyIds = vacancies.map((v: any) => v._id);
    const applicationsCounts = await Application.aggregate([
      {
        $match: {
          jobId: { $in: vacancyIds },
        },
      },
      {
        $group: {
          _id: "$jobId",
          count: { $sum: 1 },
        },
      },
    ]);

    // Criar um mapa de jobId -> count
    const applicationsMap = new Map(
      applicationsCounts.map((item: any) => [
        item._id.toString(),
        item.count,
      ])
    );

    // Atualizar applicationsCount com valores reais
    const vacanciesWithRealCounts = vacancies.map((vacancy: any) => ({
      ...vacancy,
      applicationsCount: applicationsMap.get(vacancy._id.toString()) || 0,
    }));

    return NextResponse.json({
      vacancies: vacanciesWithRealCounts,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin vacancies fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vagas" },
      { status: 500 }
    );
  }
}

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

    // Verificar se o usuário é admin
    const user = await User.findById(session.user.id).select("role").lean() as { role?: string } | null;
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem criar vagas." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      companyId,
      description,
      location,
      remote,
      type,
      level,
      category,
      salaryRange,
      requirements,
      responsibilities,
      benefits,
      skills,
      tags,
      status,
    } = body;

    // Validar campos obrigatórios
    if (!title || !companyId || !description || !location || !type || !level || !category) {
      return NextResponse.json(
        { error: "Campos obrigatórios: título, empresa, descrição, localização, tipo, nível e categoria" },
        { status: 400 }
      );
    }

    // Verificar se a empresa existe
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Criar vaga
    const vacancy = new Vacancy({
      companyId,
      postedBy: session.user.id,
      title,
      description,
      location,
      remote: remote || false,
      type,
      level,
      category,
      salaryRange: salaryRange || undefined,
      requirements: requirements || [],
      responsibilities: responsibilities || [],
      benefits: benefits || [],
      skills: skills || [],
      tags: tags || [],
      status: status || "draft",
      applicationsCount: 0,
      viewsCount: 0,
      publishedAt: status === "published" ? new Date() : undefined,
    });

    await vacancy.save();

    // Atualizar contador de vagas da empresa
    await Company.findByIdAndUpdate(companyId, {
      $inc: { jobsCount: 1 },
    });

    // Buscar vaga criada com dados populados
    const createdVacancy = await Vacancy.findById(vacancy._id)
      .populate("companyId", "name logoUrl")
      .populate("postedBy", "name email")
      .lean();

    return NextResponse.json(
      {
        vacancy: createdVacancy,
        message: "Vaga criada com sucesso",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create vacancy error:", error);
    return NextResponse.json(
      { error: "Erro ao criar vaga" },
      { status: 500 }
    );
  }
}

