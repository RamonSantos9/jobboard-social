import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Profile from "@/models/Profile";
import User from "@/models/User";
import { generateUniqueSlugForProfile } from "@/lib/slug";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    let profile = await Profile.findOne({ userId: session.user.id }).populate(
      "userId",
      "email"
    );

    // Se não existe perfil, criar um básico
    if (!profile) {
      console.log("Creating new profile for user:", session.user.id);
      const user = await User.findById(session.user.id);
      if (!user) {
        console.log("User not found:", session.user.id);
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      console.log("User found:", user.name);

      // Gerar slug único
      const firstName = user.name.split(" ")[0] || "Usuario";
      const lastName = user.name.split(" ").slice(1).join(" ") || "Anonimo";

      console.log("Generating slug for:", firstName, lastName);

      const slug = await generateUniqueSlugForProfile(
        firstName,
        lastName,
        Profile
      );

      console.log("Generated slug:", slug);

      profile = new Profile({
        userId: session.user.id,
        firstName: firstName,
        lastName: lastName,
        slug: slug,
        headline: "Desenvolvedor Full Stack",
        location: "São Paulo, Brasil",
      });

      await profile.save();
      console.log("Profile saved with slug:", profile.slug);

      // Atualizar a referência do perfil no usuário
      await User.findByIdAndUpdate(session.user.id, { profile: profile._id });
      console.log("User profile reference updated");
    }

    // Garantir que o slug existe
    let profileSlug = profile.slug;
    if (!profileSlug) {
      console.log("Profile has no slug, generating new one...");
      // Se não tem slug, gerar um novo
      const firstName = profile.firstName || "Usuario";
      const lastName = profile.lastName || "Anonimo";
      profileSlug = await generateUniqueSlugForProfile(
        firstName,
        lastName,
        Profile
      );

      console.log("Generated new slug:", profileSlug);

      // Atualizar o perfil com o novo slug
      await Profile.findByIdAndUpdate(profile._id, { slug: profileSlug });
      console.log("Profile updated with new slug");
    }

    return NextResponse.json({
      profile: {
        ...profile.toObject(),
        slug: profileSlug,
        connections: profile.connections?.length || 0,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar perfil" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const updates = await request.json();

    await connectDB();

    const profile = await Profile.findOneAndUpdate(
      { userId: session.user.id },
      updates,
      { new: true, upsert: true }
    );

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
      profile,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
