import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Message from "@/models/Message";
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

    const body = await request.json();
    const { recipientId, content, postId } = body;

    if (!recipientId) {
      return NextResponse.json(
        { error: "Destinatário é obrigatório" },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Conteúdo da mensagem é obrigatório" },
        { status: 400 }
      );
    }

    await connectDB();

    const message = new Message({
      senderId: session.user.id,
      recipientId,
      content: content.trim(),
      postId: postId || undefined,
    });

    await message.save();

    // Criar notificação para o destinatário
    await Notification.create({
      userId: recipientId,
      type: "message",
      title: "Nova mensagem",
      message: "Você recebeu uma nova mensagem",
      link: `/messages`,
      relatedUserId: session.user.id,
      relatedPostId: postId || undefined,
    });

    return NextResponse.json(
      { message: "Mensagem enviada com sucesso", messageId: message._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return NextResponse.json(
      { error: "Erro ao enviar mensagem" },
      { status: 500 }
    );
  }
}

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
    const conversationWith = searchParams.get("with");

    let query: any = {
      $or: [
        { senderId: session.user.id },
        { recipientId: session.user.id },
      ],
    };

    if (conversationWith) {
      query = {
        $or: [
          {
            senderId: session.user.id,
            recipientId: conversationWith,
          },
          {
            senderId: conversationWith,
            recipientId: session.user.id,
          },
        ],
      };
    }

    const messages = await Message.find(query)
      .populate("senderId", "name email")
      .populate("recipientId", "name email")
      .populate("postId", "content")
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return NextResponse.json(
      { error: "Erro ao buscar mensagens" },
      { status: 500 }
    );
  }
}

