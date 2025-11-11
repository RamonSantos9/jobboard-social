import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import Vacancy from "@/models/Vacancy";
import Application from "@/models/Application";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    const companyId = params.id;

    // Verificar se a empresa existe
    const company = await Company.findById(companyId).lean();
    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é admin do sistema
    const user = await User.findById(session.user.id).select("role").lean();
    const isSystemAdmin = user?.role === "admin";

    // Verificar se o usuário é admin ou recrutador da empresa
    const isCompanyAdmin = company.admins?.some(
      (admin: any) => admin.toString() === session.user.id
    );
    const isRecruiter = company.recruiters?.some(
      (recruiter: any) => recruiter.toString() === session.user.id
    );

    if (!isSystemAdmin && !isCompanyAdmin && !isRecruiter) {
      return NextResponse.json(
        { error: "Você não tem permissão para acessar estas estatísticas" },
        { status: 403 }
      );
    }

    // Métricas da empresa
    const [
      totalVacancies,
      publishedVacancies,
      totalApplications,
      totalViews,
    ] = await Promise.all([
      Vacancy.countDocuments({ companyId }),
      Vacancy.countDocuments({ companyId, status: "published" }),
      Application.countDocuments({
        jobId: {
          $in: await Vacancy.find({ companyId }).distinct("_id"),
        },
      }),
      Vacancy.aggregate([
        { $match: { companyId: companyId } },
        { $group: { _id: null, total: { $sum: "$viewsCount" } } },
      ]),
    ]);

    // Vagas por status
    const vacanciesByStatus = await Vacancy.aggregate([
      {
        $match: { companyId: companyId },
      },
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

    const companyVacancyIds = await Vacancy.find({ companyId }).distinct("_id");

    const applicationsByMonth = await Application.aggregate([
      {
        $match: {
          jobId: { $in: companyVacancyIds },
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

    // Candidaturas por status
    const applicationsByStatus = await Application.aggregate([
      {
        $match: {
          jobId: { $in: companyVacancyIds },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Taxa de conversão (candidaturas / visualizações)
    const conversionRate =
      totalViews[0]?.total > 0
        ? ((totalApplications / totalViews[0].total) * 100).toFixed(2)
        : "0.00";

    // Vagas mais visualizadas
    const topViewedVacancies = await Vacancy.find({ companyId })
      .sort({ viewsCount: -1 })
      .limit(5)
      .select("title viewsCount applicationsCount")
      .lean();

    // Vagas com mais candidaturas
    const topAppliedVacancies = await Vacancy.find({ companyId })
      .sort({ applicationsCount: -1 })
      .limit(5)
      .select("title viewsCount applicationsCount")
      .lean();

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
        totalViews: totalViews[0]?.total || 0,
        conversionRate: parseFloat(conversionRate),
      },
      vacanciesByStatus: vacanciesByStatus.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>
      ),
      applicationsByStatus: applicationsByStatus.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>
      ),
      trends: {
        applicationsByMonth: applicationsByMonth.map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          count: item.count,
        })),
      },
      topViewedVacancies,
      topAppliedVacancies,
    });
  } catch (error) {
    console.error("Company dashboard stats error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas da empresa" },
      { status: 500 }
    );
  }
}

