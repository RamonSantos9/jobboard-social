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
    const { reason, description } = body;

    // Verificar se o post existe
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    // Por enquanto, apenas retornar sucesso
    // Futuramente pode ser implementado um modelo Report para moderação
    console.log("Report post:", {
      postId: id,
      reportedBy: session.user.id,
      reason,
      description,
    });

    return NextResponse.json({
      success: true,
      message: "Post denunciado com sucesso. Nossa equipe irá revisar.",
    });
  } catch (error: any) {
    console.error("Report post error:", error);
    return NextResponse.json(
      {
        error: "Erro ao denunciar post",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

