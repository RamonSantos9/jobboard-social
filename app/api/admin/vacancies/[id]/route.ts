import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import User from "@/models/User";
import Vacancy from "@/models/Vacancy";
import Company from "@/models/Company";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Verificar se o usuário é admin usando o role da sessão
    const userRole = (session.user as any)?.role || session.user?.role;
    if (!userRole || userRole !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem acessar." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const vacancy = await Vacancy.findById(id)
      .populate("companyId", "name logoUrl")
      .populate("postedBy", "name email")
      .lean();

    if (!vacancy) {
      return NextResponse.json(
        { error: "Vaga não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ vacancy });
  } catch (error) {
    console.error("Get vacancy error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vaga" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Verificar se o usuário é admin
    const user = await User.findById(session.user.id).select("role").lean() as { role?: string } | null;
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem editar vagas." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const vacancyId = id;
    const body = await request.json();

    // Verificar se a vaga existe
    const vacancy = await Vacancy.findById(vacancyId);
    if (!vacancy) {
      return NextResponse.json(
        { error: "Vaga não encontrada" },
        { status: 404 }
      );
    }

    // Atualizar campos permitidos
    if (body.title !== undefined) vacancy.title = body.title;
    if (body.description !== undefined) vacancy.description = body.description;
    if (body.location !== undefined) vacancy.location = body.location;
    if (body.remote !== undefined) vacancy.remote = body.remote;
    if (body.type !== undefined) vacancy.type = body.type;
    if (body.level !== undefined) vacancy.level = body.level;
    if (body.category !== undefined) vacancy.category = body.category;
    if (body.salaryRange !== undefined) vacancy.salaryRange = body.salaryRange || undefined;
    if (body.requirements !== undefined) vacancy.requirements = Array.isArray(body.requirements) ? body.requirements : [];
    if (body.responsibilities !== undefined) vacancy.responsibilities = Array.isArray(body.responsibilities) ? body.responsibilities : [];
    if (body.benefits !== undefined) vacancy.benefits = Array.isArray(body.benefits) ? body.benefits : [];
    if (body.skills !== undefined) vacancy.skills = Array.isArray(body.skills) ? body.skills : [];
    if (body.tags !== undefined) vacancy.tags = Array.isArray(body.tags) ? body.tags : [];
    if (body.status !== undefined) {
      vacancy.status = body.status;
      // Se mudou para published e não tinha publishedAt, definir agora
      if (body.status === "published" && !vacancy.publishedAt) {
        vacancy.publishedAt = new Date();
      }
    }
    if (body.viewsCount !== undefined && typeof body.viewsCount === "number") {
      vacancy.viewsCount = body.viewsCount;
    }

    // Validar antes de salvar
    try {
      await vacancy.validate();
    } catch (validationError: any) {
      console.error("Validation error:", validationError);
      return NextResponse.json(
        { 
          error: "Erro de validação", 
          details: validationError.errors || validationError.message 
        },
        { status: 400 }
      );
    }

    await vacancy.save();

    // Buscar vaga atualizada com dados populados
    const updatedVacancy = await Vacancy.findById(vacancyId)
      .populate("companyId", "name logoUrl")
      .populate("postedBy", "name email")
      .lean();

    return NextResponse.json({
      vacancy: updatedVacancy,
      message: "Vaga atualizada com sucesso",
    });
  } catch (error: any) {
    console.error("Update vacancy error:", error);
    
    // Se for um erro de validação do Mongoose, retornar detalhes
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors || {}).map((err: any) => err.message);
      return NextResponse.json(
        { 
          error: "Erro de validação",
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    // Erro genérico
    return NextResponse.json(
      { 
        error: "Erro ao atualizar vaga",
        message: error.message || "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}
