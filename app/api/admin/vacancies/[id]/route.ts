import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Vacancy from "@/models/Vacancy";
import Company from "@/models/Company";

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

    // Verificar se o usuário é admin
    const currentUser = await User.findById(session.user.id).select("role").lean();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem acessar." },
        { status: 403 }
      );
    }

    const vacancy = await Vacancy.findById(params.id)
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

    // Verificar se o usuário é admin
    const currentUser = await User.findById(session.user.id).select("role").lean();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem editar vagas." },
        { status: 403 }
      );
    }

    const vacancyId = params.id;
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
    const allowedFields = [
      "title",
      "description",
      "location",
      "remote",
      "type",
      "level",
      "category",
      "salaryRange",
      "requirements",
      "responsibilities",
      "benefits",
      "skills",
      "tags",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        (vacancy as any)[field] = body[field];
      }
    });

    // Se status mudou para published, atualizar publishedAt
    if (body.status === "published" && vacancy.status !== "published") {
      vacancy.publishedAt = new Date();
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
  } catch (error) {
    console.error("Update vacancy error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar vaga" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verificar se o usuário é admin
    const currentUser = await User.findById(session.user.id).select("role").lean();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem deletar vagas." },
        { status: 403 }
      );
    }

    const vacancyId = params.id;

    const vacancy = await Vacancy.findById(vacancyId);
    if (!vacancy) {
      return NextResponse.json(
        { error: "Vaga não encontrada" },
        { status: 404 }
      );
    }

    const companyId = vacancy.companyId;

    await Vacancy.findByIdAndDelete(vacancyId);

    // Atualizar contador de vagas da empresa
    if (companyId) {
      await Company.findByIdAndUpdate(companyId, {
        $inc: { jobsCount: -1 },
      });
    }

    return NextResponse.json({
      message: "Vaga deletada com sucesso",
    });
  } catch (error) {
    console.error("Delete vacancy error:", error);
    return NextResponse.json(
      { error: "Erro ao deletar vaga" },
      { status: 500 }
    );
  }
}

