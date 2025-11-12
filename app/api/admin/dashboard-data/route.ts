import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import Vacancy from "@/models/Vacancy";
import Application from "@/models/Application";
import Post from "@/models/Post";

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

    // Verificar se o usuário é admin apenas uma vez
    const adminUser = await User.findById(session.user.id).select("role").lean() as { role?: string } | null;
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem acessar." },
        { status: 403 }
      );
    }

    // Executar todas as queries em paralelo
    const [
      // Stats básicas
      totalUsers,
      totalApplications,
      totalPosts,
      totalVacancies,
      publishedVacancies,
      totalCompanies,
      // Dados para tabelas (limitados a 10)
      companies,
      users,
      vacancies,
      applications,
      // Atividades recentes (limitadas a 10)
      recentVacancies,
      recentApplications,
      recentCompanies,
      recentPosts,
    ] = await Promise.all([
      // Stats
      User.countDocuments(),
      Application.countDocuments(),
      Post.countDocuments(),
      Vacancy.countDocuments(),
      Vacancy.countDocuments({ status: "published" }),
      Company.countDocuments(),
      // Tabelas - limitadas a 10 itens
      Company.find()
        .select("name cnpj industry isVerified jobsCount followersCount createdAt admins recruiters")
        .populate("admins", "name email")
        .populate("recruiters", "name email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      User.find()
        .select("name email role isRecruiter companyId createdAt isActive")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Vacancy.find()
        .select("title status applicationsCount viewsCount createdAt companyId postedBy")
        .populate("companyId", "name logoUrl")
        .populate("postedBy", "name email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Application.find()
        .select("status createdAt jobId candidateId")
        .populate("jobId", "title companyId")
        .populate("candidateId", "name email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // Atividades recentes - limitadas a 10
      Vacancy.find({ status: "published" })
        .select("title status applicationsCount viewsCount createdAt companyId")
        .populate("companyId", "name logoUrl")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Application.find()
        .select("status createdAt jobId candidateId")
        .populate("jobId", "title")
        .populate("candidateId", "name email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Company.find()
        .select("name logoUrl industry location createdAt isVerified jobsCount followersCount")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Post.find()
        .select("content createdAt authorId")
        .populate("authorId", "name email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // Calcular estatísticas agregadas (simplificadas)
    const vacanciesByStatus = await Vacancy.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const applicationsByMonth = await Application.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const vacanciesByMonth = await Vacancy.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Vagas por categoria/tecnologia (para gráficos de pizza)
    const vacanciesByCategory = await Vacancy.aggregate([
      {
        $match: {
          status: "published",
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Vagas preenchidas por mês (últimos 12 meses) - usando candidaturas aceitas
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const filledVacanciesByMonth = await Application.aggregate([
      {
        $match: {
          status: "accepted",
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Buscar atividades das últimas 24 horas
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const [
      last24hVacancies,
      last24hApplications,
      last24hCompanies,
      last24hPosts,
    ] = await Promise.all([
      Vacancy.find({
        status: "published",
        createdAt: { $gte: twentyFourHoursAgo },
      })
        .select("title status applicationsCount viewsCount createdAt companyId")
        .populate("companyId", "name logoUrl")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Application.find({
        createdAt: { $gte: twentyFourHoursAgo },
      })
        .select("status createdAt jobId candidateId")
        .populate("jobId", "title")
        .populate("candidateId", "name email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Company.find({
        createdAt: { $gte: twentyFourHoursAgo },
      })
        .select("name logoUrl industry location createdAt isVerified jobsCount followersCount")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Post.find({
        createdAt: { $gte: twentyFourHoursAgo },
      })
        .select("content createdAt authorId")
        .populate("authorId", "name email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // Formatar atividades recentes
    const activities = [
      ...recentVacancies.map((vacancy, index) => ({
        id: index + 1,
        empresa: (vacancy.companyId as any)?.name || "Empresa não encontrada",
        tipoSecao: "Vaga",
        statusSecao: vacancy.status === "published" ? "Publicada" : "Rascunho",
        meta: vacancy.applicationsCount?.toString() || "0",
        limite: vacancy.viewsCount?.toString() || "0",
        revisor: "Sistema",
        data: vacancy.createdAt,
        tipo: "vaga",
      })),
      ...recentApplications.slice(0, 5).map((app, index) => ({
        id: recentVacancies.length + index + 1,
        empresa: (app.jobId as any)?.title || "Vaga não encontrada",
        tipoSecao: "Candidatura",
        statusSecao:
          app.status === "pending"
            ? "Pendente"
            : app.status === "accepted"
            ? "Aceita"
            : app.status === "reviewed"
            ? "Revisada"
            : "Rejeitada",
        meta: "1",
        limite: "1",
        revisor: (app.candidateId as any)?.name || "Usuário não encontrado",
        data: app.createdAt,
        tipo: "candidatura",
      })),
      ...recentCompanies.slice(0, 5).map((company, index) => ({
        id: recentVacancies.length + recentApplications.length + index + 1,
        empresa: company.name,
        tipoSecao: "Empresa",
        statusSecao: company.isVerified ? "Verificada" : "Não verificada",
        meta: company.jobsCount?.toString() || "0",
        limite: company.followersCount?.toString() || "0",
        revisor: "Sistema",
        data: company.createdAt,
        tipo: "empresa",
      })),
    ];

    // Calcular métricas adicionais para SectionCards
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const newUsersLastMonth = await User.countDocuments({
      createdAt: { $gte: lastMonth },
    });

    // Calcular taxa de crescimento (usuários)
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const usersPreviousMonth = await User.countDocuments({
      createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
    });
    const growthRate =
      usersPreviousMonth > 0
        ? ((newUsersLastMonth - usersPreviousMonth) / usersPreviousMonth) * 100
        : 0;

    // Usuários ativos (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Calcular receita estimada (soma de salários máximos das vagas com candidaturas aceitas)
    const acceptedApplications = await Application.find({
      status: "accepted",
    })
      .populate({
        path: "jobId",
        select: "salaryRange",
      })
      .lean();

    const estimatedRevenue = acceptedApplications.reduce((sum, app: any) => {
      if (app.jobId?.salaryRange?.max) {
        return sum + app.jobId.salaryRange.max;
      }
      return sum;
    }, 0);

    // Formatar stats
    const stats = {
      overview: {
        totalUsers,
        totalApplications,
        totalPosts,
        totalVacancies,
        publishedVacancies,
        totalCompanies,
        activeVacancies: publishedVacancies,
        activeUsers, // Adicionar activeUsers ao overview
      },
      vacanciesByStatus: vacanciesByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
      trends: {
        applicationsByMonth: applicationsByMonth.map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          count: item.count,
        })),
        vacanciesByMonth: vacanciesByMonth.map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          count: item.count,
        })),
        vacanciesByCategory: vacanciesByCategory.map((item) => ({
          category: item._id || "Outros",
          count: item.count,
        })),
        filledVacanciesByMonth: filledVacanciesByMonth.map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          count: item.count,
        })),
      },
      metrics: {
        newUsersLastMonth,
        growthRate: Math.round(growthRate * 100) / 100,
        estimatedRevenue,
        activeAccounts: activeUsers,
      },
    };

    // Formatar atividades das últimas 24 horas
    const activitiesLast24h = [
      ...last24hVacancies.map((vacancy, index) => ({
        id: index + 1,
        empresa: (vacancy.companyId as any)?.name || "Empresa não encontrada",
        tipoSecao: "Vaga",
        statusSecao: vacancy.status === "published" ? "Publicada" : "Rascunho",
        meta: vacancy.applicationsCount?.toString() || "0",
        limite: vacancy.viewsCount?.toString() || "0",
        revisor: "Sistema",
        data: vacancy.createdAt,
        tipo: "vaga",
      })),
      ...last24hApplications.slice(0, 5).map((app, index) => ({
        id: last24hVacancies.length + index + 1,
        empresa: (app.jobId as any)?.title || "Vaga não encontrada",
        tipoSecao: "Candidatura",
        statusSecao:
          app.status === "pending"
            ? "Pendente"
            : app.status === "accepted"
            ? "Aceita"
            : app.status === "reviewed"
            ? "Revisada"
            : "Rejeitada",
        meta: "1",
        limite: "1",
        revisor: (app.candidateId as any)?.name || "Usuário não encontrado",
        data: app.createdAt,
        tipo: "candidatura",
      })),
      ...last24hCompanies.slice(0, 5).map((company, index) => ({
        id: last24hVacancies.length + last24hApplications.length + index + 1,
        empresa: company.name,
        tipoSecao: "Empresa",
        statusSecao: company.isVerified ? "Verificada" : "Não verificada",
        meta: company.jobsCount?.toString() || "0",
        limite: company.followersCount?.toString() || "0",
        revisor: "Sistema",
        data: company.createdAt,
        tipo: "empresa",
      })),
    ].sort((a, b) => {
      const dateA = new Date(a.data).getTime();
      const dateB = new Date(b.data).getTime();
      return dateB - dateA;
    }).slice(0, 50);

    // Serializar IDs para strings (garantir que ObjectIds sejam convertidos)
    const serializeId = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) {
        return obj.map(serializeId);
      }
      
      const serialized = { ...obj };
      
      // Converter _id
      if (serialized._id && typeof serialized._id !== 'string') {
        serialized._id = serialized._id.toString();
      }
      
      // Converter id
      if (serialized.id && typeof serialized.id !== 'string' && serialized.id.toString) {
        serialized.id = serialized.id.toString();
      }
      
      // Converter IDs comuns (companyId, jobId, candidateId, userId, etc.)
      const idFields = ['companyId', 'jobId', 'candidateId', 'userId', 'authorId', 'postedBy'];
      idFields.forEach(field => {
        if (serialized[field] && typeof serialized[field] !== 'string') {
          if (typeof serialized[field] === 'object' && serialized[field]._id) {
            // Se for um objeto populado, manter o objeto mas serializar o _id interno
            serialized[field] = serializeId(serialized[field]);
          } else if (serialized[field].toString) {
            serialized[field] = serialized[field].toString();
          }
        }
      });
      
      // Serializar arrays de IDs (admins, recruiters, etc.)
      const arrayIdFields = ['admins', 'recruiters'];
      arrayIdFields.forEach(field => {
        if (Array.isArray(serialized[field])) {
          serialized[field] = serialized[field].map((item: any) => {
            if (typeof item === 'object' && item._id) {
              return serializeId(item);
            }
            if (item && typeof item !== 'string' && item.toString) {
              return item.toString();
            }
            return item;
          });
        }
      });
      
      return serialized;
    };

    return NextResponse.json({
      stats,
      activities,
      activitiesLast24h,
      companies: companies.map(serializeId),
      users: users.map(serializeId),
      vacancies: vacancies.map(serializeId),
      applications: applications.map(serializeId),
    });
  } catch (error) {
    console.error("Admin dashboard data fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados da dashboard" },
      { status: 500 }
    );
  }
}

