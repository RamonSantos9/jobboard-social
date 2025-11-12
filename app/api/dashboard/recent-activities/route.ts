import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Vacancy from "@/models/Vacancy";
import Company from "@/models/Company";
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

    // Verificar se o usuário é admin
    const user = await User.findById(session.user.id).select("role").lean() as { role?: string } | null;
    if (!user || user.role !== "admin") {
      console.log(`Acesso negado para usuário ${session.user.id}: role=${user?.role}`);
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas administradores podem acessar estas atividades.",
        },
        { status: 403 }
      );
    }

    console.log(`Buscando atividades recentes para admin ${session.user.id}`);

    // Executar todas as queries em paralelo com limites reduzidos
    const [
      recentVacancies,
      recentApplications,
      recentCompanies,
      recentPosts,
    ] = await Promise.all([
      // Buscar vagas recentes (limitado a 10)
      Vacancy.find({ status: "published" })
        .select("title status applicationsCount viewsCount createdAt companyId")
        .populate("companyId", "name logoUrl")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // Buscar candidaturas recentes (limitado a 10)
      Application.find()
        .select("status createdAt jobId candidateId")
        .populate("jobId", "title")
        .populate("candidateId", "name email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // Buscar empresas recentes (limitado a 10)
      Company.find()
        .select("name logoUrl industry location createdAt isVerified jobsCount followersCount")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // Buscar posts recentes (limitado a 10)
      Post.find()
        .select("content createdAt authorId")
        .populate("authorId", "name email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // Formatar dados para a tabela
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
      ...recentApplications.slice(0, 10).map((app, index) => ({
        id: recentVacancies.length + index + 1,
        empresa: (app.jobId as any)?.title || "Vaga não encontrada",
        tipoSecao: "Candidatura",
        statusSecao: app.status === "pending" ? "Pendente" : app.status === "accepted" ? "Aceita" : app.status === "reviewed" ? "Revisada" : "Rejeitada",
        meta: "1",
        limite: "1",
        revisor: (app.candidateId as any)?.name || "Usuário não encontrado",
        data: app.createdAt,
        tipo: "candidatura",
      })),
      ...recentCompanies.slice(0, 10).map((company, index) => ({
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
    ].sort((a, b) => {
      const dateA = new Date(a.data).getTime();
      const dateB = new Date(b.data).getTime();
      return dateB - dateA;
    }).slice(0, 50);

    console.log(`Retornando ${activities.length} atividades recentes`);

    return NextResponse.json({
      activities,
      total: activities.length,
    });
  } catch (error) {
    console.error("Recent activities error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
    return NextResponse.json(
      { error: "Erro ao buscar atividades recentes" },
      { status: 500 }
    );
  }
}
