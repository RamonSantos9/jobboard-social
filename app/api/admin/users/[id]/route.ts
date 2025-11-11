import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

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

    const user = await User.findById(params.id)
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
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
        { error: "Acesso negado. Apenas administradores podem editar usuários." },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body = await request.json();

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar campos permitidos
    const allowedFields = [
      "name",
      "email",
      "role",
      "isRecruiter",
      "status",
      "isActive",
      "onboardingCompleted",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        (user as any)[field] = body[field];
      }
    });

    // Se houver senha, atualizar
    if (body.password) {
      user.password = await bcrypt.hash(body.password, 10);
    }

    await user.save();

    // Buscar usuário atualizado sem senha
    const updatedUser = await User.findById(userId)
      .select("-password")
      .lean();

    return NextResponse.json({
      user: updatedUser,
      message: "Usuário atualizado com sucesso",
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
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
        { error: "Acesso negado. Apenas administradores podem deletar usuários." },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Não permitir deletar a si mesmo
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Você não pode deletar seu próprio usuário" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      message: "Usuário deletado com sucesso",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Erro ao deletar usuário" },
      { status: 500 }
    );
  }
}

