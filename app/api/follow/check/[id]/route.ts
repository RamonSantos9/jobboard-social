import { NextRequest, NextResponse } from "next/server";
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
    const type = searchParams.get("type") || "user"; // "user" ou "company"

    const followerId = session.user.id;

    // Verificar se está seguindo
    const connection = await Connection.findOne({
      followerId,
      followingId: id,
      type,
      status: "accepted",
    });

    return NextResponse.json({
      isFollowing: !!connection,
    });
  } catch (error: any) {
    console.error("Check follow error:", error);
    return NextResponse.json(
      {
        error: "Erro ao verificar se está seguindo",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

