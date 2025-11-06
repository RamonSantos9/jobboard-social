import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import Comment from "@/models/Comment";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const comments = await Comment.find({ postId: params.id })
      .populate("authorId", "name email")
      .populate({
        path: "authorId",
        populate: {
          path: "profile",
          model: "Profile",
          select: "firstName lastName photoUrl",
        },
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar comentários" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Conteúdo do comentário é obrigatório" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar se o post existe
    const post = await Post.findById(params.id);
    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    // Criar comentário
    const comment = new Comment({
      postId: params.id,
      authorId: session.user.id,
      content: content.trim(),
    });

    await comment.save();

    // Atualizar contador de comentários do post
    await Post.findByIdAndUpdate(params.id, {
      $inc: { commentsCount: 1 },
    });

    // Buscar comentário com dados do autor
    const populatedComment = await Comment.findById(comment._id).populate(
      "authorId",
      "name email"
    );

    return NextResponse.json(
      { message: "Comentário criado com sucesso", comment: populatedComment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create comment error:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      {
        error: "Erro ao criar comentário",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
