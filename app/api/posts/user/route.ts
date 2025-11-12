import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Buscar posts do usuário autenticado
    const posts = await Post.find({ authorId: session.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments({ authorId: session.user.id });

    // Formatar dados dos posts
    const formattedPosts = posts.map((post: any) => ({
      _id: post._id.toString(),
      content: post.content || "",
      type: post.type || "post",
      media: post.media || [],
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likes: post.likes?.length || 0,
      comments: post.commentsCount || 0,
      sharesCount: post.sharesCount || 0,
      reactions: post.reactions || [],
    }));

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar posts do usuário:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro ao buscar posts do usuário", details: errorMessage },
      { status: 500 }
    );
  }
}

