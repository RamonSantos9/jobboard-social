import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";

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

    // Por enquanto, apenas retornar sucesso
    // Futuramente pode ser implementado um modelo HiddenPost ou usar localStorage
    return NextResponse.json({
      success: true,
      message: "Post oculto do feed",
    });
  } catch (error: any) {
    console.error("Hide post error:", error);
    return NextResponse.json(
      {
        error: "Erro ao ocultar post",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

