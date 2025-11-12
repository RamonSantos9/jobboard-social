import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import User from "@/models/User";
import Profile from "@/models/Profile";

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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    // Construir query de busca
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Excluir o próprio usuário
    query._id = { $ne: session.user.id };

    const users = (await User.find(query)
      .select("name email _id")
      .limit(limit)
      .lean()) as unknown as Array<{ _id: mongoose.Types.ObjectId; name: string; email: string }>;

    // Buscar perfis para cada usuário
    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const profile = await Profile.findOne({ userId: user._id })
          .select("firstName lastName photoUrl")
          .lean();

        return {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          profile: profile || undefined,
        };
      })
    );

    return NextResponse.json({ users: usersWithProfiles });
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

