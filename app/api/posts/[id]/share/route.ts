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

    if (!session) {
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

    // Incrementar contador de compartilhamentos
    await Post.findByIdAndUpdate(params.id, {
      $inc: { sharesCount: 1 },
    });

    return NextResponse.json({
      success: true,
      message: "Post compartilhado com sucesso",
    });
  } catch (error) {
    console.error("Share post error:", error);
    return NextResponse.json(
      { error: "Erro ao compartilhar post" },
      { status: 500 }
    );
  }
}
