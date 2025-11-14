import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
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

    // Verificar se o usuário é admin usando o role da sessão
    const userRole = (session.user as any)?.role || session.user?.role;
    if (!userRole || userRole !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem acessar." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = (await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("_id name email")
      .limit(limit)
      .lean()) as unknown as Array<{ _id: mongoose.Types.ObjectId; name: string; email: string }>;

    return NextResponse.json({
      users: users.map((u) => ({
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
      })),
    });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

