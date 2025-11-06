import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Profile from "@/models/Profile";
import User from "@/models/User";
import { generateUniqueSlugForProfile } from "@/lib/slug";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    const { slug } = params;

    console.log("Searching for profile with slug:", slug);

    // Primeiro, tentar buscar por slug exato
    let profile = await Profile.findOne({ slug })
      .populate("userId", "name email")
      .lean();

    console.log("Found profile (exact):", profile);

    // Se não encontrou, tentar buscar por slug case-insensitive
    if (!profile) {
      console.log("Trying case-insensitive search...");
      profile = await Profile.findOne({
        slug: { $regex: new RegExp(`^${slug}$`, "i") },
      })
        .populate("userId", "name email")
        .lean();

      console.log("Found profile (case-insensitive):", profile);
    }

    // Se ainda não encontrou, tentar buscar por nome (fallback)
    if (!profile) {
      console.log("Trying name-based search...");
      const nameParts = slug.split("-");
      const firstName = nameParts[0];

      profile = await Profile.findOne({
        firstName: { $regex: new RegExp(`^${firstName}$`, "i") },
      })
        .populate("userId", "name email")
        .lean();

      console.log("Found profile (name-based):", profile);
    }

    if (!profile) {
      console.log("Profile not found for slug:", slug);
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    // Garantir que o perfil tem slug
    if (!(profile as any)?.slug) {
      console.log("Profile has no slug, generating one...");
      const newSlug = await generateUniqueSlugForProfile(
        (profile as any)?.firstName || "Usuario",
        (profile as any)?.lastName || "Anonimo",
        Profile
      );

      // Atualizar o perfil com o slug
      await Profile.findByIdAndUpdate((profile as any)?._id, { slug: newSlug });
      (profile as any).slug = newSlug;
      console.log("Profile updated with slug:", newSlug);
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error("Public profile fetch error:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      {
        error: "Erro ao buscar perfil público",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
