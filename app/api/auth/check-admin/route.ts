import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

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

    const user = await User.findById(session.user.id).select("role").lean() as { role?: string } | null;

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem acessar." },
        { status: 403 }
      );
    }

    return NextResponse.json({ isAdmin: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao verificar permissões" },
      { status: 500 }
    );
  }
}

