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
    const body = await request.json();
    const { userId, role } = body; // role pode ser "admin" ou "recruiter"

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Validar role se fornecido
    const validRole = role === "recruiter" ? "recruiter" : "admin"; // default é admin

    // Validar se userId é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "userId inválido" },
        { status: 400 }
      );
    }

    // Validar se companyId é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return NextResponse.json(
        { error: "ID da empresa inválido" },
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

    // Converter userId para ObjectId
    const userIdObjectId = new mongoose.Types.ObjectId(userId);

    // Verificar se o usuário já está na empresa
    const isAlreadyAdmin = company.admins.some(
      (adminId: mongoose.Types.ObjectId) => adminId.toString() === userId
    );
    const isAlreadyRecruiter = company.recruiters.some(
      (recruiterId: mongoose.Types.ObjectId) => recruiterId.toString() === userId
    );

    if (validRole === "admin" && isAlreadyAdmin) {
      return NextResponse.json(
        { error: "Usuário já é admin desta empresa" },
        { status: 400 }
      );
    }

    if (validRole === "recruiter" && isAlreadyRecruiter) {
      return NextResponse.json(
        { error: "Usuário já é recrutador desta empresa" },
        { status: 400 }
      );
    }

    // Se o usuário estava em outra empresa, remover dos arrays da empresa anterior
    if (userToAssign.companyId && userToAssign.companyId.toString() !== companyId) {
      await Company.updateOne(
        { _id: userToAssign.companyId },
        {
          $pull: {
            admins: userIdObjectId,
            recruiters: userIdObjectId
          }
        }
      );
    }

    // Adicionar usuário conforme o role selecionado
    if (validRole === "admin") {
      // Adicionar como admin e remover de recruiters se estiver
      await Company.findByIdAndUpdate(
        companyId,
        {
          $addToSet: { admins: userIdObjectId },
          $pull: { recruiters: userIdObjectId }
        },
        { new: true, runValidators: false }
      );
    } else {
      // Adicionar como recruiter (não remover de admins se já for admin)
      await Company.findByIdAndUpdate(
        companyId,
        {
          $addToSet: { recruiters: userIdObjectId }
        },
        { new: true, runValidators: false }
      );
    }

    // Atualizar companyId do usuário
    userToAssign.companyId = new mongoose.Types.ObjectId(companyId);
    await userToAssign.save();

    // Buscar empresa atualizada com dados populados
    const updatedCompany = await Company.findById(companyId)
      .populate("admins", "name email")
      .populate("recruiters", "name email")
      .lean();

    if (!updatedCompany) {
      return NextResponse.json(
        { error: "Erro ao buscar empresa atualizada" },
        { status: 500 }
      );
    }

    const roleText = validRole === "admin" ? "administrador" : "recrutador";
    return NextResponse.json({
      success: true,
      message: `${userToAssign.name} foi adicionado como ${roleText} da empresa ${company.name}`,
      company: updatedCompany,
    });
  } catch (error: any) {
    console.error("Assign admin error:", error);
    return NextResponse.json(
      { 
        error: "Erro ao atribuir admin",
        message: error.message || "Erro desconhecido",
        details: error.stack 
      },
      { status: 500 }
    );
  }
}

