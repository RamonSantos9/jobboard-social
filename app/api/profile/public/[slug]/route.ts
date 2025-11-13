import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Profile from "@/models/Profile";
import User from "@/models/User";
import { generateUniqueSlugForProfile } from "@/lib/slug";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    try {
      await connectDB();
    } catch (dbError: any) {
      return NextResponse.json(
        {
          error: "Erro de conexão com o banco de dados",
        },
        { status: 500 }
      );
    }

    // Garantir que o modelo Profile está registrado
    if (!mongoose.models.Profile) {
      await import("@/models/Profile");
    }

    const { slug } = await params;

    // Primeiro, tentar buscar por slug exato
    let profile = await Profile.findOne({ slug })
      .populate("userId", "name email")
      .lean();

    // Se não encontrou, tentar buscar por slug case-insensitive
    if (!profile) {
      profile = await Profile.findOne({
        slug: { $regex: new RegExp(`^${slug}$`, "i") },
      })
        .populate("userId", "name email")
        .lean();
    }

    // Se ainda não encontrou, tentar buscar por nome (fallback)
    if (!profile) {
      const nameParts = slug.split("-");
      const firstName = nameParts[0];

      profile = await Profile.findOne({
        firstName: { $regex: new RegExp(`^${firstName}$`, "i") },
      })
        .populate("userId", "name email")
        .lean();
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    // Garantir que o perfil tem slug
    if (!(profile as any)?.slug) {
      const newSlug = await generateUniqueSlugForProfile(
        (profile as any)?.firstName || "Usuario",
        (profile as any)?.lastName || "Anonimo",
        Profile
      );

      // Atualizar o perfil com o slug
      await Profile.findByIdAndUpdate((profile as any)?._id, { slug: newSlug });
      (profile as any).slug = newSlug;
    }

    // Garantir que followersCount está incluído (já deve estar no profile, mas garantimos default 0)
    const profileWithFollowers = {
      ...profile,
      followersCount: (profile as any).followersCount ?? 0,
    };

    return NextResponse.json({ profile: profileWithFollowers });
  } catch (error: any) {
    // Verificar se é erro de conexão com banco
    if (
      error instanceof Error &&
      (error.message.includes("MongoServerError") ||
        error.message.includes("Mongoose") ||
        error.message.includes("connection") ||
        error.message.includes("timeout") ||
        error.message.includes("MongoNetworkError"))
    ) {
      return NextResponse.json(
        {
          error: "Erro de conexão com o banco de dados",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Erro ao buscar perfil público",
      },
      { status: 500 }
    );
  }
}
