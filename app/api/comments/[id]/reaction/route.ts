import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Comment from "@/models/Comment";
import type { ReactionType } from "@/models/Post";
import Notification from "@/models/Notification";

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
    const body = await request.json();
    const { reactionType }: { reactionType: ReactionType | null } = body;

    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json(
        { error: "Comentário não encontrado" },
        { status: 404 }
      );
    }

    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário não encontrado na sessão" },
        { status: 400 }
      );
    }

    // Inicializar reactions se não existir
    if (!comment.reactions) {
      comment.reactions = [];
    }

    // Encontrar reação existente do usuário
    const existingReactionIndex = comment.reactions.findIndex(
      (r: any) => r.userId.toString() === userId.toString()
    );

    if (reactionType === null) {
      // Remover reação
      if (existingReactionIndex !== -1) {
        comment.reactions.splice(existingReactionIndex, 1);
      }
    } else {
      if (existingReactionIndex !== -1) {
        // Atualizar reação existente
        comment.reactions[existingReactionIndex].type = reactionType;
      } else {
        // Adicionar nova reação
        comment.reactions.push({
          userId: userId,
          type: reactionType,
        });
      }
    }

    await comment.save();

    // Calcular contagem por tipo
    const reactionsCount = {
      like: 0,
      celebrate: 0,
      support: 0,
      interesting: 0,
      funny: 0,
      love: 0,
    };

    comment.reactions.forEach((r: any) => {
      if (reactionsCount[r.type as ReactionType] !== undefined) {
        reactionsCount[r.type as ReactionType]++;
      }
    });

    const totalReactions = comment.reactions.length;

    // Encontrar reação atual do usuário
    const currentReaction = comment.reactions.find(
      (r: any) => r.userId.toString() === userId.toString()
    );

    // Criar notificação se houver reação e não for o próprio autor
    if (
      reactionType &&
      comment.authorId.toString() !== userId.toString()
    ) {
      // Verificar se já existe notificação recente para evitar spam
      const existingNotification = await Notification.findOne({
        userId: comment.authorId,
        type: "reaction",
        relatedCommentId: comment._id,
        relatedUserId: userId,
        read: false,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Últimas 24h
      });

      if (!existingNotification) {
        const reactionLabels: Record<ReactionType, string> = {
          like: "curtiu",
          celebrate: "aplaudiu",
          support: "apoiou",
          interesting: "achou interessante",
          funny: "achou engraçado",
          love: "adorou",
        };

        await Notification.create({
          userId: comment.authorId,
          type: "reaction",
          title: "Nova reação",
          message: `Alguém ${reactionLabels[reactionType]} seu comentário`,
          link: `/feed`,
          relatedCommentId: comment._id,
          relatedUserId: userId,
          metadata: {
            reactionType: reactionType,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      currentReaction: currentReaction?.type || null,
      reactionsCount,
      totalReactions,
    });
  } catch (error) {
    console.error("Erro ao reagir ao comentário:", error);
    return NextResponse.json(
      { error: "Erro ao reagir ao comentário" },
      { status: 500 }
    );
  }
}

