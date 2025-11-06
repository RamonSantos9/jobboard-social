import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Post from "@/models/Post";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    const post = await Post.findById(params.id);
    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    // 🔹 Corrigindo identificação segura do usuário
    const userId = session.user.id || session.user.id || session.user.email;

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário não encontrado na sessão" },
        { status: 400 }
      );
    }

    //  Verifica se já curtiu
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Remover like
      post.likes = post.likes.filter(
        (likeId: string) => likeId.toString() !== userId.toString()
      );
    } else {
      // Adicionar like (sem duplicar)
      if (!post.likes.includes(userId)) {
        post.likes.push(userId);
      }
    }

    await post.save();

    //  Retorna post completo e status do like
    return NextResponse.json({
      success: true,
      isLiked: !isLiked,
      likesCount: post.likes.length,
      likedBy: post.likes, // Agora o front pode renderizar quem curtiu
    });
  } catch (error) {
    console.error("Erro ao curtir post:", error);
    return NextResponse.json({ error: "Erro ao curtir post" }, { status: 500 });
  }
}
