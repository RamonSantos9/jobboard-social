import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import Comment from "@/models/Comment";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
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

    // Verificar se o usuário é o autor do post
    if (post.authorId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para deletar este post" },
        { status: 403 }
      );
    }

    // Deletar comentários relacionados
    await Comment.deleteMany({ postId: id });

    // Deletar o post
    await Post.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Post deletado com sucesso",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    console.error("Error details:", error.message);
    return NextResponse.json(
      {
        error: "Erro ao deletar post",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
