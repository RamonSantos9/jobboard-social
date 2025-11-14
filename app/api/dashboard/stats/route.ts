import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Application from "@/models/Application";
import Post from "@/models/Post";
import Company from "@/models/Company";
import Vacancy from "@/models/Vacancy";

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

    // Verificar se o usuário é admin usando o role da sessão
    const userRole = (session.user as any)?.role || session.user?.role;
    if (!userRole || userRole !== "admin") {
      console.log(`Acesso negado para usuário ${session.user.id}: role=${userRole}`);
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas administradores podem acessar estas estatísticas.",
        },
        { status: 403 }
      );
    }

    console.log(`Buscando estatísticas para admin ${session.user.id}`);

    // Métricas básicas - combinando queries similares
    const [
      totalUsers,
      totalApplications,
      totalPosts,
      totalVacancies,
      publishedVacancies,
      totalCompanies,
    ] = await Promise.all([
      User.countDocuments(),
      Application.countDocuments(),
      Post.countDocuments(),
      Vacancy.countDocuments(),
      Vacancy.countDocuments({ status: "published" }),
      Company.countDocuments(),
    ]);
    
    const activeVacancies = publishedVacancies; // Reutilizar resultado

    // Executar agregações em paralelo
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const [
      vacanciesByStatus,
      applicationsByMonth,
      postsByMonth,
      vacanciesByMonth,
      usersByMonth,
      applicationsByStatus,
    ] = await Promise.all([
      // Vagas por status
      Vacancy.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      // Candidaturas por mês (últimos 6 meses)
      Application.aggregate([
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
      ]),
      // Posts por mês (últimos 6 meses)
      Post.aggregate([
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
      ]),
      // Vagas por mês (últimos 6 meses)
      Vacancy.aggregate([
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
      ]),
      // Usuários por mês (últimos 6 meses)
      User.aggregate([
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
      ]),
      // Candidaturas por status
      Application.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Usuários ativos (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Executar queries de top e categorias em paralelo
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const [
      topViewedVacancies,
      topCompaniesByVacancies,
      vacanciesByCategory,
      filledVacanciesByMonth,
    ] = await Promise.all([
      // Vagas mais visualizadas (top 5)
      Vacancy.find({ status: "published" })
        .sort({ viewsCount: -1 })
        .limit(5)
        .select("title viewsCount applicationsCount")
        .lean(),
      // Empresas com mais vagas (top 5)
      Company.find()
        .sort({ jobsCount: -1 })
        .limit(5)
        .select("name jobsCount logoUrl")
        .lean(),
      // Vagas por categoria/tecnologia (para gráficos de pizza)
      Vacancy.aggregate([
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
      ]),
      // Vagas preenchidas por mês (últimos 12 meses) - usando candidaturas aceitas
      Application.aggregate([
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
      ]),
    ]);

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

    console.log(`Estatísticas calculadas: ${totalUsers} usuários, ${totalVacancies} vagas, ${totalApplications} candidaturas`);

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        totalApplications,
        totalPosts,
        totalVacancies,
        publishedVacancies,
        activeVacancies,
        totalCompanies,
      },
      vacanciesByStatus: vacanciesByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
      applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
      trends: {
        applicationsByMonth: applicationsByMonth.map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          count: item.count,
        })),
        postsByMonth: postsByMonth.map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          count: item.count,
        })),
        vacanciesByMonth: vacanciesByMonth.map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          count: item.count,
        })),
        usersByMonth: usersByMonth.map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          count: item.count,
        })),
        filledVacanciesByMonth: filledVacanciesByMonth.map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          count: item.count,
        })),
      },
      vacanciesByCategory: vacanciesByCategory.map((item) => ({
        category: item._id || "Outros",
        count: item.count,
      })),
      metrics: {
        newUsersLastMonth,
        growthRate: Math.round(growthRate * 100) / 100,
        estimatedRevenue,
        activeAccounts: activeUsers,
      },
      topViewedVacancies,
      topCompaniesByVacancies,
    });
      } catch (error) {
        console.error("Dashboard stats error:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
        return NextResponse.json(
          { error: "Erro ao buscar estatísticas" },
          { status: 500 }
        );
      }
}
