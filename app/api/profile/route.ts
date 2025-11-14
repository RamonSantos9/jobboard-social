import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Profile from "@/models/Profile";
import User from "@/models/User";
import { generateUniqueSlugForProfile } from "@/lib/slug";

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
        // Garantir que todos os campos estejam presentes
        headline: profile.headline || "",
        location: profile.location || "",
        bannerUrl: profile.bannerUrl || null,
        photoUrl: profile.photoUrl || null,
        education: profile.education || [],
        currentCompany: profile.currentCompany || "",
        currentTitle: profile.currentTitle || "",
        bio: profile.bio || "",
        skills: profile.skills || [],
        experience: profile.experience || [],
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
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const updates = await request.json();

    await connectDB();

    // Validar campos obrigatórios
    if (updates.firstName && updates.firstName.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome não pode estar vazio" },
        { status: 400 }
      );
    }

    if (updates.lastName && updates.lastName.trim().length === 0) {
      return NextResponse.json(
        { error: "Sobrenome não pode estar vazio" },
        { status: 400 }
      );
    }

    // Buscar perfil existente
    let profile = await Profile.findOne({ userId: session.user.id });

    // Verificação de segurança: garantir que o usuário só edite seu próprio perfil
    // Se o perfil existe, verificar se pertence ao usuário logado
    if (profile && profile.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar este perfil" },
        { status: 403 }
      );
    }

    // Se não existe, criar um novo
    if (!profile) {
      const user = await User.findById(session.user.id);
      if (!user) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      const firstName = updates.firstName || user.name.split(" ")[0] || "Usuario";
      const lastName = updates.lastName || user.name.split(" ").slice(1).join(" ") || "Anonimo";

      const slug = await generateUniqueSlugForProfile(
        firstName,
        lastName,
        Profile
      );

      // Converter datas em arrays de education e experience antes de criar
      const profileData: any = {
        userId: session.user.id,
        firstName,
        lastName,
        slug,
        ...updates,
      };

      if (profileData.education && Array.isArray(profileData.education)) {
        profileData.education = profileData.education.map((edu: any) => ({
          ...edu,
          startDate: edu.startDate ? new Date(edu.startDate) : new Date(),
          endDate: edu.endDate ? new Date(edu.endDate) : null,
        }));
      }

      if (profileData.experience && Array.isArray(profileData.experience)) {
        profileData.experience = profileData.experience.map((exp: any) => ({
          ...exp,
          startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
          endDate: exp.endDate ? new Date(exp.endDate) : null,
        }));
      }

      profile = new Profile(profileData);

      await profile.save();

      // Atualizar referência no usuário
      await User.findByIdAndUpdate(session.user.id, { profile: profile._id });
    } else {
      // Atualizar perfil existente
      // Se o nome mudou, atualizar também no User
      if (updates.firstName || updates.lastName) {
        const firstName = updates.firstName || profile.firstName;
        const lastName = updates.lastName || profile.lastName;
        const fullName = `${firstName} ${lastName}`.trim();

        await User.findByIdAndUpdate(session.user.id, {
          name: fullName,
        });

        // Se o nome mudou significativamente, pode ser necessário atualizar o slug
        if (
          (updates.firstName && updates.firstName !== profile.firstName) ||
          (updates.lastName && updates.lastName !== profile.lastName)
        ) {
          const newSlug = await generateUniqueSlugForProfile(
            firstName,
            lastName,
            Profile
          );
          updates.slug = newSlug;
        }
      }

      // Converter datas em arrays de education e experience
      if (updates.education && Array.isArray(updates.education)) {
        updates.education = updates.education.map((edu: any) => ({
          ...edu,
          startDate: edu.startDate ? new Date(edu.startDate) : new Date(),
          endDate: edu.endDate ? new Date(edu.endDate) : null,
        }));
      }

      if (updates.experience && Array.isArray(updates.experience)) {
        updates.experience = updates.experience.map((exp: any) => ({
          ...exp,
          startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
          endDate: exp.endDate ? new Date(exp.endDate) : null,
        }));
      }

      // Fazer merge do contactInfo se existir
      if (updates.contactInfo) {
        const existingContactInfo = profile.contactInfo
          ? (profile.contactInfo as any).toObject
            ? (profile.contactInfo as any).toObject()
            : profile.contactInfo
          : {};
        updates.contactInfo = {
          ...existingContactInfo,
          ...updates.contactInfo,
        };
      }

      // Atualizar campos
      Object.keys(updates).forEach((key) => {
        if (updates[key] !== undefined) {
          (profile as any)[key] = updates[key];
        }
      });

      await profile.save();
    }

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
      profile: profile.toObject(),
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    
    // Retornar mensagem de erro mais específica
    let errorMessage = "Erro ao atualizar perfil";
    if (error.name === "ValidationError") {
      errorMessage = `Erro de validação: ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
