import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import Notification from "@/models/Notification";

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
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    const userId = session.user.id;

    // Incrementar contador de compartilhamentos
    post.sharesCount = (post.sharesCount || 0) + 1;
    await post.save();

    // Criar notificação para o autor do post (se não for o próprio usuário)
    if (post.authorId.toString() !== userId.toString()) {
      await Notification.create({
        userId: post.authorId,
        type: "share",
        title: "Publicação compartilhada",
        message: "Alguém compartilhou sua publicação",
        link: `/feed`,
        relatedPostId: post._id,
        relatedUserId: userId,
      });
    }

    return NextResponse.json({
      success: true,
      sharesCount: post.sharesCount,
      link: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/posts/${post._id}`,
    });
  } catch (error) {
    console.error("Erro ao compartilhar post:", error);
    return NextResponse.json(
      { error: "Erro ao compartilhar post" },
      { status: 500 }
    );
  }
}
