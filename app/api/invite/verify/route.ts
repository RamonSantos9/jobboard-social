import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Invite from "@/models/Invite";
import Company from "@/models/Company";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token não fornecido" },
        { status: 400 }
      );
    }

    await connectDB();

    const invite = await Invite.findOne({ token }).populate("companyId");

    if (!invite) {
      return NextResponse.json(
        { valid: false, error: "Convite não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se já foi usado
    if (invite.used) {
      return NextResponse.json(
        { valid: false, used: true, error: "Convite já foi utilizado" },
        { status: 400 }
      );
    }

    // Verificar se expirou
    const now = new Date();
    const expired = invite.expiresAt < now;

    if (expired) {
      return NextResponse.json(
        { valid: false, expired: true, error: "Convite expirado" },
        { status: 400 }
      );
    }

    // Retornar dados do convite (sem informações sensíveis)
    return NextResponse.json(
      {
        valid: true,
        email: invite.email,
        companyName: invite.companyId.name,
        role: invite.role,
        expired: false,
        expiresAt: invite.expiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao verificar convite:", error);
    return NextResponse.json(
      { valid: false, error: "Erro ao verificar convite" },
      { status: 500 }
    );
  }
}

