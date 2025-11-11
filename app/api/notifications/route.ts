import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Notification from "@/models/Notification";
import User from "@/models/User";
import Company from "@/models/Company";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Buscar notificações com dados relacionados
    const notifications = await Notification.find({
      userId: session.user.id,
    })
      .populate("relatedUserId", "name email")
      .populate("metadata.companyId", "name logoUrl")
      .populate("metadata.invitedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Contar notificações não lidas
    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      read: false,
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total: notifications.length,
      },
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar notificações" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { notificationIds, markAllAsRead } = await request.json();

    await connectDB();

    if (markAllAsRead) {
      await Notification.updateMany(
        { userId: session.user.id, read: false },
        { read: true }
      );
    } else if (notificationIds && notificationIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, userId: session.user.id },
        { read: true }
      );
    }

    return NextResponse.json({
      message: "Notificações marcadas como lidas",
    });
  } catch (error) {
    console.error("Mark notifications as read error:", error);
    return NextResponse.json(
      { error: "Erro ao marcar notificações como lidas" },
      { status: 500 }
    );
  }
}
