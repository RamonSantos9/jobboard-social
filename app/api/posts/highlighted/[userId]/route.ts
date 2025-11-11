import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import Profile from "@/models/Profile";
import User from "@/models/User";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();

    const { userId } = await params;

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Buscar posts destacados do usuário
    const highlightedPosts = await Post.find({
      isHighlighted: true,
      highlightedBy: userId,
    })
      .populate("authorId", "name email")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Buscar perfis dos autores
    const postsWithProfiles = await Promise.all(
      highlightedPosts.map(async (post: any) => {
        const profile = await Profile.findOne({ userId: post.authorId._id })
          .select("firstName lastName photoUrl headline slug")
          .lean();

        return {
          ...post,
          authorId: {
            ...post.authorId,
            profile: profile || null,
          },
        };
      })
    );

    return NextResponse.json({
      posts: postsWithProfiles,
      count: postsWithProfiles.length,
    });
  } catch (error: any) {
    console.error("Get highlighted posts error:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar posts destacados",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

