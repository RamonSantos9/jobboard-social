import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import Profile from "@/models/Profile";
import Company from "@/models/Company";
import Notification from "@/models/Notification";
import type { ReactionType } from "@/models/Post";
import { extractMentions, getUserDisplayName } from "@/lib/extractMentions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    // Buscar apenas comentários principais (sem parentCommentId)
    const comments = await Comment.find({ postId: id, parentCommentId: null })
      .populate("authorId", "name email")
      .populate({
        path: "authorId",
        populate: {
          path: "profile",
          model: "Profile",
          select: "firstName lastName photoUrl connections slug",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filtrar comentários válidos (com authorId)
    const validComments = comments.filter(
      (comment: any) => comment && comment._id && comment.authorId && comment.authorId._id
    );

    // Buscar respostas para cada comentário
    const commentsWithReplies = await Promise.all(
      validComments.map(async (comment: any) => {
        if (!comment.authorId || !comment.authorId._id) {
          return null;
        }

        // Buscar respostas
        // Mongoose converte automaticamente strings para ObjectId na query
        const replies = await Comment.find({ 
          parentCommentId: comment._id,
          postId: id // Garantir que a resposta pertence ao mesmo post
        })
          .populate("authorId", "name email")
          .populate({
            path: "authorId",
            populate: {
              path: "profile",
              model: "Profile",
              select: "firstName lastName photoUrl connections slug",
            },
          })
          .sort({ createdAt: 1 })
          .lean();
        
        console.log(`Comentário ${comment._id}: Buscando respostas com parentCommentId=${comment._id}, encontradas ${replies.length} resposta(s)`);

        // Buscar perfil do autor para seguidores
        const profile = await Profile.findOne({
          userId: comment.authorId._id,
        })
          .select("connections")
          .lean();

        // Verificar se é empresa
        const company = await Company.findOne({
          userId: comment.authorId._id,
        })
          .select("followersCount")
          .lean();

        // Calcular contagem de reações
        const reactionsCount = {
          like: 0,
          celebrate: 0,
          support: 0,
          interesting: 0,
          funny: 0,
          love: 0,
        };

        if (comment.reactions && Array.isArray(comment.reactions)) {
          comment.reactions.forEach((r: any) => {
            if (reactionsCount[r.type as ReactionType] !== undefined) {
              reactionsCount[r.type as ReactionType]++;
            }
          });
        }

        // Encontrar reação do usuário atual
        const currentReaction =
          userId && comment.reactions
            ? comment.reactions.find(
                (r: any) => r.userId.toString() === userId.toString()
              )?.type || null
            : null;

        // Processar respostas (filtrar valores null/undefined)
        const validReplies = replies.filter(
          (reply: any) =>
            reply &&
            reply._id &&
            reply.authorId &&
            reply.authorId._id
        );

        const processedReplies = await Promise.all(
          validReplies.map(async (reply: any) => {
            if (!reply.authorId || !reply.authorId._id) {
              return null;
            }

            const replyProfile = await Profile.findOne({
              userId: reply.authorId._id,
            })
              .select("connections")
              .lean();

            const replyCompany = await Company.findOne({
              userId: reply.authorId._id,
            })
              .select("followersCount")
              .lean();

            const replyReactionsCount = {
              like: 0,
              celebrate: 0,
              support: 0,
              interesting: 0,
              funny: 0,
              love: 0,
            };

            if (reply.reactions && Array.isArray(reply.reactions)) {
              reply.reactions.forEach((r: any) => {
                if (replyReactionsCount[r.type as ReactionType] !== undefined) {
                  replyReactionsCount[r.type as ReactionType]++;
                }
              });
            }

            const replyCurrentReaction =
              userId && reply.reactions
                ? reply.reactions.find(
                    (r: any) => r.userId.toString() === userId.toString()
                  )?.type || null
                : null;

            return {
              ...reply,
              reactionsCount: replyReactionsCount,
              currentReaction: replyCurrentReaction,
              followersCount:
                replyCompany?.followersCount ||
                replyProfile?.connections?.length ||
                0,
            };
          })
        );

        // Filtrar valores null do resultado
        const filteredReplies = processedReplies.filter(
          (reply) => reply !== null
        );
        
        // Debug: log quando há respostas
        if (filteredReplies.length > 0) {
          console.log(`Comentário ${comment._id}: retornando ${filteredReplies.length} resposta(s) processada(s)`);
        }

        return {
          ...comment,
          reactionsCount,
          currentReaction,
          followersCount:
            company?.followersCount || profile?.connections?.length || 0,
          replies: filteredReplies,
        };
      })
    );

    // Filtrar comentários null do resultado
    const filteredComments = commentsWithReplies.filter(
      (comment) => comment !== null
    );

    return NextResponse.json({ comments: filteredComments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar comentários" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { content, parentCommentId } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Conteúdo do comentário é obrigatório" },
        { status: 400 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Verificar se o post existe
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    // Se for uma resposta, verificar se o comentário pai existe
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return NextResponse.json(
          { error: "Comentário pai não encontrado" },
          { status: 404 }
        );
      }
    }

    // Criar comentário
    // Converter parentCommentId para ObjectId se fornecido
    let parentId = null;
    if (parentCommentId) {
      try {
        parentId = typeof parentCommentId === 'string' 
          ? new mongoose.Types.ObjectId(parentCommentId)
          : parentCommentId;
      } catch (error) {
        console.error("Erro ao converter parentCommentId para ObjectId:", error);
        return NextResponse.json(
          { error: "ID do comentário pai inválido" },
          { status: 400 }
        );
      }
    }
    
    const comment = new Comment({
      postId: id,
      authorId: session.user.id,
      content: content.trim(),
      parentCommentId: parentId,
    });

    await comment.save();
    console.log(`Comentário criado: ID=${comment._id}, parentCommentId=${parentId}, postId=${id}, content="${content.trim().substring(0, 50)}..."`);

    // Se for uma resposta, atualizar o array de replies do comentário pai
    // NOTA: Isso é opcional, pois buscamos respostas por parentCommentId na query GET
    if (parentId) {
      try {
        await Comment.findByIdAndUpdate(parentId, {
          $addToSet: { replies: comment._id },
        });
        console.log(`Array de replies atualizado para comentário pai: ${parentId}`);
      } catch (error) {
        console.error("Erro ao atualizar array de replies do comentário pai:", error);
        // Não falhar a criação da resposta se isso der erro
      }
    }

    // Atualizar contador de comentários do post (apenas para comentários principais)
    if (!parentId) {
      await Post.findByIdAndUpdate(id, {
        $inc: { commentsCount: 1 },
      });
    }

    // Se for uma resposta, buscar e retornar dados completos da reply
    if (parentId) {
      // Buscar reply com dados completos
      const reply = await Comment.findById(comment._id)
        .populate("authorId", "name email")
        .populate({
          path: "authorId",
          populate: {
            path: "profile",
            model: "Profile",
            select: "firstName lastName photoUrl connections slug",
          },
        })
        .lean();

      if (!reply || !reply.authorId || !reply.authorId._id) {
        return NextResponse.json(
          { error: "Erro ao buscar resposta criada" },
          { status: 500 }
        );
      }

      // Buscar perfil e empresa do autor
      const replyProfile = await Profile.findOne({
        userId: reply.authorId._id,
      })
        .select("connections")
        .lean();

      const replyCompany = await Company.findOne({
        userId: reply.authorId._id,
      })
        .select("followersCount")
        .lean();

      // Calcular contagem de reações
      const replyReactionsCount = {
        like: 0,
        celebrate: 0,
        support: 0,
        interesting: 0,
        funny: 0,
        love: 0,
      };

      if (reply.reactions && Array.isArray(reply.reactions)) {
        reply.reactions.forEach((r: any) => {
          if (replyReactionsCount[r.type as ReactionType] !== undefined) {
            replyReactionsCount[r.type as ReactionType]++;
          }
        });
      }

      // Encontrar reação do usuário atual
      const replyCurrentReaction =
        reply.reactions && session.user.id
          ? reply.reactions.find(
              (r: any) => r.userId.toString() === session.user.id
            )?.type || null
          : null;

      // Montar resposta completa
      const replyData = {
        ...reply,
        reactionsCount: replyReactionsCount,
        currentReaction: replyCurrentReaction,
        followersCount:
          replyCompany?.followersCount ||
          replyProfile?.connections?.length ||
          0,
        replies: [],
      };

      // Notificações
      const authorName = await getUserDisplayName(
        new mongoose.Types.ObjectId(session.user.id)
      );

      // 1. Notificar dono do post (se não for o próprio autor)
      if (post.authorId.toString() !== session.user.id) {
        const existingNotification = await Notification.findOne({
          userId: post.authorId,
          type: "comment",
          relatedPostId: post._id,
          relatedUserId: session.user.id,
          relatedCommentId: comment._id,
          read: false,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });

        if (!existingNotification) {
          await Notification.create({
            userId: post.authorId,
            type: "comment",
            title: "Novo comentário",
            message: `${authorName} comentou no seu post`,
            link: `/feed`,
            relatedPostId: post._id,
            relatedUserId: session.user.id,
            relatedCommentId: comment._id,
          });
        }
      }

      // 2. Notificar usuários mencionados no comentário
      const mentionedUserIds = await extractMentions(content.trim());
      for (const mentionedUserId of mentionedUserIds) {
        if (mentionedUserId.toString() === session.user.id) continue;
        if (mentionedUserId.toString() === post.authorId.toString()) continue;

        const existingNotification = await Notification.findOne({
          userId: mentionedUserId,
          type: "comment",
          relatedCommentId: comment._id,
          relatedUserId: session.user.id,
          read: false,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });

        if (!existingNotification) {
          await Notification.create({
            userId: mentionedUserId,
            type: "comment",
            title: "Você foi mencionado",
            message: `${authorName} mencionou você em um comentário`,
            link: `/feed`,
            relatedPostId: post._id,
            relatedUserId: session.user.id,
            relatedCommentId: comment._id,
          });
        }
      }

      return NextResponse.json(
        { message: "Resposta criada com sucesso", reply: replyData },
        { status: 201 }
      );
    }

    // Buscar comentário com dados do autor (para comentários principais)
    const populatedComment = await Comment.findById(comment._id).populate(
      "authorId",
      "name email"
    );

    // Notificações
    const authorName = await getUserDisplayName(
      new mongoose.Types.ObjectId(session.user.id)
    );

    // 1. Notificar dono do post (se não for o próprio autor)
    if (post.authorId.toString() !== session.user.id) {
      // Verificar se já existe notificação recente
      const existingNotification = await Notification.findOne({
        userId: post.authorId,
        type: "comment",
        relatedPostId: post._id,
        relatedUserId: session.user.id,
        read: false,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      if (!existingNotification) {
        await Notification.create({
          userId: post.authorId,
          type: "comment",
          title: "Novo comentário",
          message: `${authorName} comentou no seu post`,
          link: `/feed`,
          relatedPostId: post._id,
          relatedUserId: session.user.id,
          relatedCommentId: comment._id,
        });
      }
    }

    // 2. Notificar usuários mencionados no comentário
    const mentionedUserIds = await extractMentions(content.trim());
    for (const mentionedUserId of mentionedUserIds) {
      // Não notificar o próprio autor do comentário
      if (mentionedUserId.toString() === session.user.id) continue;
      // Não notificar o autor do post (já foi notificado acima)
      if (mentionedUserId.toString() === post.authorId.toString()) continue;

      // Verificar se já existe notificação recente
      const existingNotification = await Notification.findOne({
        userId: mentionedUserId,
        type: "comment",
        relatedCommentId: comment._id,
        relatedUserId: session.user.id,
        read: false,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      if (!existingNotification) {
        await Notification.create({
          userId: mentionedUserId,
          type: "comment",
          title: "Você foi mencionado",
          message: `${authorName} mencionou você em um comentário`,
          link: `/feed`,
          relatedPostId: post._id,
          relatedUserId: session.user.id,
          relatedCommentId: comment._id,
        });
      }
    }

    return NextResponse.json(
      { message: "Comentário criado com sucesso", comment: populatedComment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create comment error:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      {
        error: "Erro ao criar comentário",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
