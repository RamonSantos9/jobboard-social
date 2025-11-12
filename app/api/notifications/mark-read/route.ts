import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Notification from "@/models/Notification";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: "ID da notificação é obrigatório" },
        { status: 400 }
      );
    }

    await connectDB();

    // Marcar notificação específica como lida
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: session.user.id,
        read: false,
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { error: "Notificação não encontrada ou já lida" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notificação marcada como lida",
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return NextResponse.json(
      { error: "Erro ao marcar notificação como lida" },
      { status: 500 }
    );
  }
}
