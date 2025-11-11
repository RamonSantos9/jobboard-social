import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Connection from "@/models/Connection";
import Profile from "@/models/Profile";
import Company from "@/models/Company";
import User from "@/models/User";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { type = "user" } = body; // "user" ou "company"

    const followerId = session.user.id;

    // Verificar se usuário não está tentando se seguir a si mesmo
    if (type === "user") {
      const userToFollow = await User.findById(id);
      if (!userToFollow) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      if (followerId === id) {
        return NextResponse.json(
          { error: "Você não pode se seguir a si mesmo" },
          { status: 400 }
        );
      }
    } else if (type === "company") {
      const companyToFollow = await Company.findById(id);
      if (!companyToFollow) {
        return NextResponse.json(
          { error: "Empresa não encontrada" },
          { status: 404 }
        );
      }
    }

    // Verificar se já está seguindo
    const existingConnection = await Connection.findOne({
      followerId,
      followingId: id,
      type,
    });

    let isFollowing = false;
    let followersCount = 0;

    if (existingConnection) {
      // Deixar de seguir
      await Connection.deleteOne({ _id: existingConnection._id });

      // Atualizar contagem de seguidores
      if (type === "user") {
        const profile = await Profile.findOne({ userId: id });
        if (profile) {
          profile.followersCount = Math.max(0, (profile.followersCount || 0) - 1);
          await profile.save();
          followersCount = profile.followersCount || 0;
        }
      } else if (type === "company") {
        const company = await Company.findById(id);
        if (company) {
          company.followersCount = Math.max(0, (company.followersCount || 0) - 1);
          await company.save();
          followersCount = company.followersCount || 0;
        }
      }

      isFollowing = false;
    } else {
      // Seguir
      await Connection.create({
        followerId,
        followingId: id,
        type,
        typeModel: type === "user" ? "User" : "Company",
        status: "accepted",
      });

      // Atualizar contagem de seguidores
      if (type === "user") {
        const profile = await Profile.findOne({ userId: id });
        if (profile) {
          profile.followersCount = (profile.followersCount || 0) + 1;
          await profile.save();
          followersCount = profile.followersCount || 0;
        }
      } else if (type === "company") {
        const company = await Company.findById(id);
        if (company) {
          company.followersCount = (company.followersCount || 0) + 1;
          await company.save();
          followersCount = company.followersCount || 0;
        }
      }

      isFollowing = true;
    }

    return NextResponse.json({
      success: true,
      isFollowing,
      followersCount,
      message: isFollowing ? "Seguindo com sucesso" : "Deixou de seguir",
    });
  } catch (error: any) {
    console.error("Follow/unfollow error:", error);
    return NextResponse.json(
      {
        error: "Erro ao seguir/deixar de seguir",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

