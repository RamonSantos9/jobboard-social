import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Post from "@/models/Post";

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
    const { highlight = true } = body;

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é o dono do post
    if (post.authorId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para destacar este post" },
        { status: 403 }
      );
    }

    // Atualizar destaque
    post.isHighlighted = highlight;
    post.highlightedBy = highlight ? session.user.id : null;
    await post.save();

    return NextResponse.json({
      success: true,
      isHighlighted: post.isHighlighted,
      message: highlight
        ? "Post destacado com sucesso"
        : "Destaque removido com sucesso",
    });
  } catch (error: any) {
    console.error("Highlight post error:", error);
    return NextResponse.json(
      {
        error: "Erro ao destacar/remover destaque do post",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

