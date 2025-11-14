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
        { error: "Acesso negado. Apenas administradores do sistema podem remover admins de empresa." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const companyId = id;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

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
    const userToRemove = await User.findById(userId);
    if (!userToRemove) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Converter userId para ObjectId
    const userIdObjectId = new mongoose.Types.ObjectId(userId);

    // Verificar se o usuário é admin da empresa
    const isAdmin = company.admins.some(
      (adminId: mongoose.Types.ObjectId) => adminId.toString() === userId
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Usuário não é admin desta empresa" },
        { status: 400 }
      );
    }

    // Verificar se é o último admin (não permitir remover se for o último)
    if (company.admins.length === 1) {
      return NextResponse.json(
        { error: "Não é possível remover o último admin da empresa. A empresa deve ter pelo menos um admin." },
        { status: 400 }
      );
    }

    // Remover usuário dos admins usando $pull
    await Company.findByIdAndUpdate(
      companyId,
      {
        $pull: { 
          admins: userIdObjectId
        }
      },
      { new: true, runValidators: false }
    );

    // Buscar empresa atualizada (sem populate primeiro para verificar arrays)
    const companyAfterUpdate = await Company.findById(companyId);
    if (!companyAfterUpdate) {
      return NextResponse.json(
        { error: "Erro ao buscar empresa atualizada" },
        { status: 500 }
      );
    }

    // Verificar se o usuário ainda está nos recruiters (verificar IDs diretamente)
    const isStillRecruiter = companyAfterUpdate.recruiters.some(
      (recruiterId: any) => recruiterId.toString() === userId
    );

    // Se não estiver mais em nenhum dos arrays (admins ou recruiters), limpar companyId
    if (!isStillRecruiter && userToRemove.companyId?.toString() === companyId) {
      userToRemove.companyId = null;
      await userToRemove.save();
    }
    // Se ainda estiver nos recruiters, manter o companyId (já está correto)

    // Buscar empresa com dados populados para retornar
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

    return NextResponse.json({
      success: true,
      message: `${userToRemove.name} foi removido como admin da empresa ${company.name}`,
      company: updatedCompany,
    });
  } catch (error: any) {
    console.error("Remove admin error:", error);
    return NextResponse.json(
      { 
        error: "Erro ao remover admin",
        message: error.message || "Erro desconhecido",
        details: error.stack 
      },
      { status: 500 }
    );
  }
}

