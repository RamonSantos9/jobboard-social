import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import Vacancy from "@/models/Vacancy";
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

    const user = await User.findById(session.user.id)
      .select("role companyId")
      .lean();

    // Se for admin do sistema, retornar erro (deve usar /api/dashboard/stats)
    if (user?.role === "admin") {
      return NextResponse.json(
        { error: "Use /api/dashboard/stats para dados do sistema" },
        { status: 400 }
      );
    }

    // Buscar empresas onde o usuário é admin ou recrutador
    const companies = await Company.find({
      $or: [
        { admins: session.user.id },
        { recruiters: session.user.id },
      ],
    }).lean();

    if (companies.length === 0) {
      return NextResponse.json(
        { error: "Você não é admin ou recrutador de nenhuma empresa" },
        { status: 403 }
      );
    }

    // Usar a primeira empresa (ou podemos retornar dados de todas)
    const company = companies[0];
    const companyId = company._id;

    // Buscar vagas da empresa
    const [totalVacancies, publishedVacancies, totalApplications] =
      await Promise.all([
        Vacancy.countDocuments({ companyId }),
        Vacancy.countDocuments({ companyId, status: "published" }),
        Application.countDocuments({
          jobId: { $in: await Vacancy.find({ companyId }).distinct("_id") },
        }),
      ]);

    // Vagas por status
    const vacanciesByStatus = await Vacancy.aggregate([
      { $match: { companyId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Candidaturas por status
    const vacancyIds = await Vacancy.find({ companyId }).distinct("_id");
    const applicationsByStatus = await Application.aggregate([
      { $match: { jobId: { $in: vacancyIds } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Candidaturas por mês (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const applicationsByMonth = await Application.aggregate([
      {
        $match: {
          jobId: { $in: vacancyIds },
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

    // Vagas por mês (últimos 6 meses)
    const vacanciesByMonth = await Vacancy.aggregate([
      {
        $match: {
          companyId,
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

    // Vagas por categoria
    const vacanciesByCategory = await Vacancy.aggregate([
      {
        $match: {
          companyId,
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

    return NextResponse.json({
      company: {
        _id: company._id,
        name: company.name,
        logoUrl: company.logoUrl,
      },
      overview: {
        totalVacancies,
        publishedVacancies,
        totalApplications,
        activeVacancies: publishedVacancies,
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
        vacanciesByMonth: vacanciesByMonth.map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          count: item.count,
        })),
      },
      vacanciesByCategory: vacanciesByCategory.map((item) => ({
        category: item._id || "Outros",
        count: item.count,
      })),
    });
  } catch (error) {
    console.error("Company stats error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas da empresa" },
      { status: 500 }
    );
  }
}

