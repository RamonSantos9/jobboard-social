import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Profile from "@/models/Profile";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { bannerUrl } = await request.json();

    if (!bannerUrl || typeof bannerUrl !== "string") {
      return NextResponse.json(
        { error: "URL do banner é obrigatória" },
        { status: 400 }
      );
    }

    await connectDB();

    const profile = await Profile.findOneAndUpdate(
      { userId: session.user.id },
      { bannerUrl },
      { new: true, upsert: false }
    );

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Banner atualizado com sucesso",
      bannerUrl: profile.bannerUrl,
    });
  } catch (error) {
    console.error("Banner update error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar banner" },
      { status: 500 }
    );
  }
}

