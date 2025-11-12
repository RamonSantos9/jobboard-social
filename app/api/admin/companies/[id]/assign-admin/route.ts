import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import User from "@/models/User";
import Company from "@/models/Company";

export async function POST(
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

    // Verificar se o usuário é admin do sistema
    const currentUser = await User.findById(session.user.id)
      .select("role")
      .lean() as { role?: string } | null;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores do sistema podem atribuir admins de empresa." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const companyId = id;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
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

    // Verificar se o usuário existe
    const userToAssign = await User.findById(userId);
    if (!userToAssign) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário já é admin da empresa
    const isAlreadyAdmin = company.admins.some(
      (adminId: mongoose.Types.ObjectId) => adminId.toString() === userId
    );

    if (isAlreadyAdmin) {
      return NextResponse.json(
        { error: "Usuário já é admin desta empresa" },
        { status: 400 }
      );
    }

    // Adicionar usuário como admin
    company.admins.push(new mongoose.Types.ObjectId(userId));
    await company.save();

    return NextResponse.json({
      success: true,
      message: `${userToAssign.name} foi adicionado como admin da empresa ${company.name}`,
    });
  } catch (error) {
    console.error("Assign admin error:", error);
    return NextResponse.json(
      { error: "Erro ao atribuir admin" },
      { status: 500 }
    );
  }
}

