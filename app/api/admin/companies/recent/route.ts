import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";

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
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem acessar." },
        { status: 403 }
      );
    }

    const companies = await Company.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name logoUrl jobsCount isVerified createdAt")
      .lean();

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Admin companies fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar empresas" },
      { status: 500 }
    );
  }
}

