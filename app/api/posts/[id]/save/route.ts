import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { toast } from "sonner";

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
    // Futuramente pode ser implementado um modelo SavedPost
    return NextResponse.json({
      success: true,
      message: "Post salvo com sucesso",
    });
  } catch (error: any) {
    console.error("Save post error:", error);
    return NextResponse.json(
      {
        error: "Erro ao salvar post",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

