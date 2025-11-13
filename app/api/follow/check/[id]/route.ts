import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Connection from "@/models/Connection";

export async function GET(
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

    try {
      await connectDB();
    } catch (dbError: any) {
      return NextResponse.json(
        {
          error: "Erro de conexão com o banco de dados",
        },
        { status: 500 }
      );
    }

    // Garantir que o modelo Connection está registrado
    if (!mongoose.models.Connection) {
      await import("@/models/Connection");
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "user";

    // Validar tipo
    if (type !== "user" && type !== "company") {
      return NextResponse.json(
        { error: "Tipo inválido. Deve ser 'user' ou 'company'" },
        { status: 400 }
      );
    }

    // Validar e converter IDs
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const followerId = session.user.id;
    if (!mongoose.Types.ObjectId.isValid(followerId)) {
      return NextResponse.json(
        { error: "ID de usuário inválido" },
        { status: 400 }
      );
    }

    // Verificar se está seguindo
    let connection;
    try {
      connection = await Connection.findOne({
        followerId: new mongoose.Types.ObjectId(followerId),
        followingId: new mongoose.Types.ObjectId(id),
        type,
        status: "accepted",
      });
    } catch (queryError: any) {
      // Se for erro de conexão, retornar erro específico
      if (
        queryError?.message?.includes("connection") ||
        queryError?.message?.includes("timeout") ||
        queryError?.message?.includes("Mongo") ||
        queryError?.name?.includes("Mongo")
      ) {
        return NextResponse.json(
          {
            error: "Erro de conexão com o banco de dados",
          },
          { status: 500 }
        );
      }
      // Para outros erros, retornar erro genérico
      return NextResponse.json(
        {
          error: "Erro ao verificar se está seguindo",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      isFollowing: !!connection,
    });
  } catch (error: any) {
    // Verificar se é erro de conexão com banco
    if (
      error instanceof Error &&
      (error.message.includes("MongoServerError") ||
        error.message.includes("Mongoose") ||
        error.message.includes("connection") ||
        error.message.includes("timeout") ||
        error.message.includes("MongoNetworkError"))
    ) {
      return NextResponse.json(
        {
          error: "Erro de conexão com o banco de dados",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Erro ao verificar se está seguindo",
      },
      { status: 500 }
    );
  }
}

