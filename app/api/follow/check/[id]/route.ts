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

    await connectDB();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "user";

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
    const connection = await Connection.findOne({
      followerId: new mongoose.Types.ObjectId(followerId),
      followingId: new mongoose.Types.ObjectId(id),
      type,
      status: "accepted",
    });

    return NextResponse.json({
      isFollowing: !!connection,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao verificar se está seguindo",
      },
      { status: 500 }
    );
  }
}

