import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import User from "@/models/User";
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

    const { id } = await params;
    const companyId = id;

    // Verificar se o usuário é admin do sistema
    const user = (await User.findById(session.user.id)
      .select("role companyId")
      .lean()) as unknown as { role?: string; companyId?: mongoose.Types.ObjectId } | null;
    const isSystemAdmin = user?.role === "admin";

    // Verificar se a empresa existe
    const company = (await Company.findById(companyId)
      .select("admins recruiters")
      .lean()) as unknown as {
      _id: mongoose.Types.ObjectId;
      admins?: mongoose.Types.ObjectId[];
      recruiters?: mongoose.Types.ObjectId[];
    } | null;

    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é admin ou recrutador da empresa
    const isCompanyAdmin = company.admins?.some(
      (admin: mongoose.Types.ObjectId) => admin.toString() === session.user.id
    );
    const isRecruiter = company.recruiters?.some(
      (recruiter: mongoose.Types.ObjectId) => recruiter.toString() === session.user.id
    );

    if (!isSystemAdmin && !isCompanyAdmin && !isRecruiter) {
      return NextResponse.json(
        { error: "Acesso negado. Você precisa ser admin ou recrutador desta empresa." },
        { status: 403 }
      );
    }

    return NextResponse.json({ hasAccess: true });
  } catch (error) {
    console.error("Check access error:", error);
    return NextResponse.json(
      { error: "Erro ao verificar permissões" },
      { status: 500 }
    );
  }
}

