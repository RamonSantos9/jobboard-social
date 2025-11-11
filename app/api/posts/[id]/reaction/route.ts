import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Post, { ReactionType } from "@/models/Post";
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

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    const accountId = session.user.id;
    const accountType = (session.user as any).accountType || "user";
    const companyId = session.user.companyId;

    if (!accountId) {
      return NextResponse.json(
        { error: "ID não encontrado na sessão" },
        { status: 400 }
      );
    }

    // Determinar se é reação de usuário ou empresa
    const isCompanyReaction = accountType === "company" && companyId === accountId;
    const reactionUserId = isCompanyReaction ? null : accountId;
    const reactionCompanyId = isCompanyReaction ? accountId : null;

    // Validar: empresa não pode reagir a seu próprio post
    if (isCompanyReaction && post.companyId && post.companyId.toString() === accountId) {
      return NextResponse.json(
        { error: "Empresa não pode reagir a seu próprio post" },
        { status: 400 }
      );
    }

    // Validar: usuário não pode reagir como empresa se não tiver companyId na sessão
    if (!isCompanyReaction && !reactionUserId) {
      return NextResponse.json(
        { error: "Tipo de conta inválido para reação" },
        { status: 400 }
      );
    }

    // Inicializar reactions se não existir
    if (!post.reactions) {
      post.reactions = [];
    }

    // Encontrar reação existente (por userId ou companyId)
    const existingReactionIndex = post.reactions.findIndex((r: any) => {
      if (isCompanyReaction) {
        return r.companyId && r.companyId.toString() === accountId.toString();
      } else {
        return r.userId && r.userId.toString() === accountId.toString();
      }
    });

    if (reactionType === null) {
      // Remover reação
      if (existingReactionIndex !== -1) {
        post.reactions.splice(existingReactionIndex, 1);
      }
    } else {
      if (existingReactionIndex !== -1) {
        // Atualizar reação existente
        post.reactions[existingReactionIndex].type = reactionType;
      } else {
        // Adicionar nova reação
        const newReaction: any = {
          type: reactionType,
        };
        if (reactionUserId) {
          newReaction.userId = reactionUserId;
        }
        if (reactionCompanyId) {
          newReaction.companyId = reactionCompanyId;
        }
        post.reactions.push(newReaction);
      }
    }

    await post.save();

    // Calcular contagem por tipo
    const reactionsCount = {
      like: 0,
      celebrate: 0,
      support: 0,
      interesting: 0,
      funny: 0,
      love: 0,
    };

    post.reactions.forEach((r: any) => {
      if (reactionsCount[r.type as ReactionType] !== undefined) {
        reactionsCount[r.type as ReactionType]++;
      }
    });

    const totalReactions = post.reactions.length;

    // Encontrar reação atual (por userId ou companyId)
    const currentReaction = post.reactions.find((r: any) => {
      if (isCompanyReaction) {
        return r.companyId && r.companyId.toString() === accountId.toString();
      } else {
        return r.userId && r.userId.toString() === accountId.toString();
      }
    });

    // Criar notificação se houver reação e não for o próprio autor
    // Nota: posts podem ter authorId (usuário) ou companyId (empresa)
    const isOwnPost = isCompanyReaction
      ? post.companyId && post.companyId.toString() === accountId.toString()
      : post.authorId.toString() === accountId.toString();

    if (reactionType && !isOwnPost) {
      // Verificar se já existe notificação recente para evitar spam
      const notificationUserId = post.authorId; // Notificações são sempre para o autor do post (usuário)
      
      const existingNotification = await Notification.findOne({
        userId: notificationUserId,
        type: "reaction",
        relatedPostId: post._id,
        relatedUserId: isCompanyReaction ? undefined : accountId,
        "metadata.companyId": isCompanyReaction ? accountId : undefined,
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
          userId: notificationUserId,
          type: "reaction",
          title: "Nova reação",
          message: isCompanyReaction
            ? `Uma empresa ${reactionLabels[reactionType]} seu post`
            : `Alguém ${reactionLabels[reactionType]} seu post`,
          link: `/feed`,
          relatedPostId: post._id,
          relatedUserId: isCompanyReaction ? undefined : accountId,
          metadata: {
            companyId: isCompanyReaction ? accountId : undefined,
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
    console.error("Erro ao reagir ao post:", error);
    return NextResponse.json(
      { error: "Erro ao reagir ao post" },
      { status: 500 }
    );
  }
}

