import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import Profile from "@/models/Profile";
import User from "@/models/User";
import Vacancy from "@/models/Vacancy";
import Company from "@/models/Company";
import Comment from "@/models/Comment";
import Notification from "@/models/Notification";
import Connection from "@/models/Connection";
import { calculateJobMatchScore } from "@/lib/jobRecommendation";
import { extractMentions, getUserDisplayName } from "@/lib/extractMentions";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching posts...");
    await connectDB();

    // Garantir que os modelos estão registrados
    if (!mongoose.models.Company) {
      await import("@/models/Company");
    }
    if (!mongoose.models.Vacancy) {
      await import("@/models/Vacancy");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    console.log("Searching for posts...");
    const posts = await Post.find()
      .populate("authorId", "email name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log("Found posts:", posts.length);

    // Obter sessão do usuário
    const session = await auth();
    const userId = session?.user?.id;

        // Buscar perfis separadamente para evitar problemas de populate aninhado
    const postsWithProfiles = await Promise.all(
      posts.map(async (post) => {
        const profile = await Profile.findOne({ userId: post.authorId._id })
          .select("firstName lastName photoUrl headline slug")
          .lean();

        // Verificar se o usuário atual está seguindo o autor do post
        let isFollowingAuthor = false;
        if (userId) {
          const authorConnection = await Connection.findOne({
            followerId: userId,
            followingId: post.authorId._id,
            type: "user",
            status: "accepted",
          }).lean();
          isFollowingAuthor = !!authorConnection;
        }

        // Verificar se o post é de uma empresa e se o usuário está seguindo a empresa
        // Nota: posts podem ter companyId se forem relacionados a uma vaga (job post)
        // ou se o autor do post tiver uma empresa associada
        let isFollowingCompany = false;
        const postCompanyId = (post as any).companyId;
        if (userId && postCompanyId) {
          const companyConnection = await Connection.findOne({
            followerId: userId,
            followingId: postCompanyId,
            type: "company",
            status: "accepted",
          }).lean();
          isFollowingCompany = !!companyConnection;
        }
        
        // Também verificar se o autor do post tem uma empresa e se o usuário está seguindo essa empresa
        if (userId && !isFollowingCompany) {
          const authorUser = await User.findById(post.authorId._id).select("companyId").lean();
          if (authorUser?.companyId) {
            const authorCompanyConnection = await Connection.findOne({
              followerId: userId,
              followingId: authorUser.companyId,
              type: "company",
              status: "accepted",
            }).lean();
            isFollowingCompany = !!authorCompanyConnection;
          }
        }

        // Calcular contagem de reações por tipo
        const reactionsCount = {
          like: 0,
          celebrate: 0,
          support: 0,
          interesting: 0,
          funny: 0,
          love: 0,
        };

        // Buscar dados dos usuários e empresas que reagiram
        const reactionsWithData = [];
        if (post.reactions && Array.isArray(post.reactions)) {
          for (const reaction of post.reactions) {
            if (reactionsCount[reaction.type as keyof typeof reactionsCount] !== undefined) {
              reactionsCount[reaction.type as keyof typeof reactionsCount]++;
            }

            try {
              let reactionData: any = {
                type: reaction.type,
              };

              // Buscar dados do usuário ou empresa
              if (reaction.userId) {
                const user = await User.findById(reaction.userId).select("name email").lean();
                const userProfile = await Profile.findOne({ userId: reaction.userId })
                  .select("firstName lastName photoUrl slug followersCount")
                  .lean();

                // Verificar se o usuário atual segue quem reagiu
                let isFollowing = false;
                if (userId) {
                  const connection = await Connection.findOne({
                    followerId: userId,
                    followingId: reaction.userId,
                    type: "user",
                    status: "accepted",
                  }).lean();
                  isFollowing = !!connection;
                }

                reactionData.userId = reaction.userId;
                reactionData.user = {
                  _id: user?._id,
                  name: user?.name || "",
                  email: user?.email || "",
                  profile: userProfile
                    ? {
                        firstName: userProfile.firstName,
                        lastName: userProfile.lastName,
                        photoUrl: userProfile.photoUrl,
                        slug: userProfile.slug,
                        followersCount: userProfile.followersCount || 0,
                      }
                    : null,
                };
                reactionData.isFollowing = isFollowing;
                reactionData.followersCount = userProfile?.followersCount || 0;
              } else if (reaction.companyId) {
                const company = await Company.findById(reaction.companyId)
                  .select("name logoUrl followersCount")
                  .lean();

                // Verificar se o usuário atual segue a empresa que reagiu
                let isFollowing = false;
                if (userId) {
                  const connection = await Connection.findOne({
                    followerId: userId,
                    followingId: reaction.companyId,
                    type: "company",
                    status: "accepted",
                  }).lean();
                  isFollowing = !!connection;
                }

                reactionData.companyId = reaction.companyId;
                reactionData.company = {
                  _id: company?._id,
                  name: company?.name || "",
                  logoUrl: company?.logoUrl || null,
                };
                reactionData.isFollowing = isFollowing;
                reactionData.followersCount = company?.followersCount || 0;
              }

              reactionsWithData.push(reactionData);
            } catch (error) {
              console.error(`Erro ao buscar dados da reação:`, error);
              // Continuar mesmo se houver erro
            }
          }

          // Ordenar reações por relevância (followersCount) - maior primeiro
          reactionsWithData.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
        }

        // Encontrar reação do usuário atual (pode ser como usuário ou empresa)
        let currentReaction = null;
        if (userId && post.reactions) {
          const accountType = (session?.user as any)?.accountType || "user";
          const companyId = session?.user?.companyId;
          const isCompanyAccount = accountType === "company" && companyId === userId;

          if (isCompanyAccount) {
            currentReaction = post.reactions.find(
              (r: any) => r.companyId && r.companyId.toString() === userId.toString()
            )?.type || null;
          } else {
            currentReaction = post.reactions.find(
              (r: any) => r.userId && r.userId.toString() === userId.toString()
            )?.type || null;
          }
        }

        // Determinar se o post é uma sugestão
        // É sugestão se:
        // 1. O usuário NÃO está seguindo o autor do post (nem como usuário nem como empresa)
        // 2. O usuário não é o autor do post
        // 3. Usuário está logado
        // Nota: Não depende de reações de quem o usuário segue - qualquer post de quem não segue é sugestão
        const isPostAuthor = userId && post.authorId._id.toString() === userId.toString();
        const isSuggestion = userId && 
          !isFollowingAuthor && 
          !isFollowingCompany &&
          !isPostAuthor;

        // Manter compatibilidade com likes antigos
        const likes = post.likes || [];
        const isLiked = userId ? likes.includes(userId) : false;

        // Contar comentários reais do banco
        const commentsCount = await Comment.countDocuments({ postId: post._id });

        // Usar sharesCount do post ou 0 se não existir
        const sharesCount = post.sharesCount || 0;

        const postObject = post.toObject();

        return {
          ...postObject,
          mediaUrl: postObject.mediaUrl || null,
          mediaType: postObject.mediaType || null,
          mediaUrls: postObject.mediaUrls || null, // Garantir que mediaUrls é retornado
          authorId: {
            ...post.authorId.toObject(),
            profile: profile || null,
          },
          reactions: reactionsWithData, // Reações com dados de usuários e empresas
          reactionsCount,
          currentReaction,
          commentsCount, // Contagem real de comentários
          sharesCount, // Contagem real de compartilhamentos
          likes: likes, // Mantido para compatibilidade
          isLiked, // Mantido para compatibilidade
          isHighlighted: postObject.isHighlighted || false,
          highlightedBy: postObject.highlightedBy || null,
          isSuggestion: isSuggestion || false, // Flag para indicar se é uma sugestão
        };
      })
    );

    const total = await Post.countDocuments();

    // Se usuário está logado, adicionar vagas recomendadas
    const userProfile = session
      ? await Profile.findOne({ userId: session.user.id }).lean()
      : null;

    const vacanciesRaw = await Vacancy.find({ status: "published" })
      .populate("companyId", "name logoUrl location")
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(10)
      .lean();

    const vacancies = vacanciesRaw.map((vacancy) => {
      const match = userProfile
        ? calculateJobMatchScore(userProfile, vacancy)
        : null;

      return {
        _id: vacancy._id,
        type: "job",
        title: vacancy.title,
        description: vacancy.description,
        location: vacancy.location,
        remote: vacancy.remote,
        jobType: vacancy.type,
        level: vacancy.level,
        category: vacancy.category,
        salaryRange: vacancy.salaryRange,
        companyId: vacancy.companyId,
        skills: vacancy.skills,
        benefits: vacancy.benefits,
        requirements: vacancy.requirements,
        status: vacancy.status,
        createdAt:
          (vacancy.publishedAt || vacancy.createdAt)?.toISOString?.() ??
          new Date().toISOString(),
        publishedAt: vacancy.publishedAt?.toISOString?.() ?? null,
        matchScore: match?.total,
        matchBreakdown: match?.breakdown,
      };
    });

    // Combinar posts e vagas e ordenar por data (mais recente primeiro)
    const mixedFeed: any[] = [
      ...postsWithProfiles.map((post) => ({
        ...post,
        type: "post",
        sortDate: new Date(post.createdAt).getTime(),
      })),
      ...vacancies.map((vacancy) => ({
        ...vacancy,
        type: "job",
        // Usar publishedAt se disponível, senão usar createdAt
        sortDate: new Date(
          vacancy.publishedAt || vacancy.createdAt || new Date()
        ).getTime(),
      })),
    ];

    // Ordenar por data (mais recente primeiro)
    mixedFeed.sort((a, b) => b.sortDate - a.sortDate);

    // Remover campo sortDate antes de retornar
    const finalFeed = mixedFeed.map(({ sortDate, ...item }) => item);

    return NextResponse.json({
      posts: finalFeed,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Posts fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { content, mediaUrl, mediaType, mediaUrls, hashtags } = body;

    console.log("Creating post with data:", {
      content,
      mediaUrl,
      mediaType,
      mediaUrls,
      hashtags,
      userId: session.user.id,
    });

    // Validar que há conteúdo ou mídia
    const hasContent = content && content.trim().length > 0;
    const hasMedia = mediaUrl || (mediaUrls && mediaUrls.length > 0);

    if (!hasContent && !hasMedia) {
      return NextResponse.json(
        { error: "Conteúdo ou mídia é obrigatório" },
        { status: 400 }
      );
    }

    await connectDB();

    // Normalizar dados de mídia
    // Se há múltiplas imagens, garantir que mediaUrl também está preenchido (primeira imagem)
    if (mediaUrls && Array.isArray(mediaUrls) && mediaUrls.length > 0) {
      if (!mediaUrl) {
        mediaUrl = mediaUrls[0];
      }
      if (!mediaType) {
        mediaType = "image";
      }
      // Remover duplicatas e valores nulos
      mediaUrls = mediaUrls.filter((url: string) => url && url.trim().length > 0);
    }

    // Limpar mediaUrls se estiver vazio ou não definido
    if (!mediaUrls || mediaUrls.length === 0) {
      mediaUrls = undefined;
    }

    // Limpar valores vazios
    if (!mediaUrl || mediaUrl.trim().length === 0) {
      mediaUrl = undefined;
    }

    console.log("Post data after normalization:", {
      content: content?.trim() || "",
      mediaUrl,
      mediaType,
      mediaUrls,
      hashtags: hashtags || [],
    });

    const postData: any = {
      authorId: session.user.id,
      content: content?.trim() || "",
      hashtags: hashtags || [],
      commentsCount: 0,
      sharesCount: 0,
    };

    // Adicionar campos de mídia apenas se existirem
    if (mediaUrl) {
      postData.mediaUrl = mediaUrl;
    }
    if (mediaType) {
      postData.mediaType = mediaType;
    }
    if (mediaUrls && mediaUrls.length > 0) {
      postData.mediaUrls = mediaUrls;
    }

    console.log("Saving post to database:", JSON.stringify(postData, null, 2));

    let savedPost;
    try {
      const post = new Post(postData);
      savedPost = await post.save();
      
      console.log("Post saved successfully:", {
        id: savedPost._id,
        content: savedPost.content,
        mediaUrl: savedPost.mediaUrl,
        mediaType: savedPost.mediaType,
        mediaUrls: savedPost.mediaUrls,
        authorId: savedPost.authorId,
      });

      // Verificar se o post foi salvo corretamente
      const verifyPost = await Post.findById(savedPost._id);
      if (!verifyPost) {
        console.error("Post não foi encontrado após salvar!");
        return NextResponse.json(
          { error: "Erro ao verificar post salvo" },
          { status: 500 }
        );
      }

      console.log("Post verified in database:", {
        id: verifyPost._id,
        content: verifyPost.content,
        mediaUrl: verifyPost.mediaUrl,
        mediaType: verifyPost.mediaType,
        mediaUrls: verifyPost.mediaUrls,
      });
    } catch (saveError: any) {
      console.error("Error saving post to database:", saveError);
      console.error("Validation errors:", saveError.errors);
      console.error("Post data that failed:", postData);
      return NextResponse.json(
        {
          error: "Erro ao salvar post no banco de dados",
          details: saveError.message,
          validationErrors: saveError.errors,
        },
        { status: 500 }
      );
    }

    if (!savedPost) {
      return NextResponse.json(
        { error: "Erro: Post não foi salvo" },
        { status: 500 }
      );
    }

    // Extrair menções do conteúdo e atualizar o post
    if (content) {
      const mentionedUserIds = await extractMentions(content);
      if (mentionedUserIds.length > 0) {
        savedPost.mentions = mentionedUserIds;
        await savedPost.save();
      }

      // Notificar usuários mencionados
      const authorName = await getUserDisplayName(
        new mongoose.Types.ObjectId(session.user.id)
      );

      for (const mentionedUserId of mentionedUserIds) {
        // Não notificar o próprio autor
        if (mentionedUserId.toString() === session.user.id) continue;

        // Verificar se já existe notificação recente
        const existingNotification = await Notification.findOne({
          userId: mentionedUserId,
          type: "comment", // Usar "comment" mesmo para menções em posts
          relatedPostId: savedPost._id,
          relatedUserId: session.user.id,
          read: false,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });

        if (!existingNotification) {
          await Notification.create({
            userId: mentionedUserId,
            type: "comment", // Usar "comment" mesmo para menções
            title: "Você foi mencionado",
            message: `${authorName} mencionou você em uma publicação`,
            link: `/feed`,
            relatedPostId: savedPost._id,
            relatedUserId: session.user.id,
          });
        }
      }
    }

    // Buscar o post com dados do autor
    const populatedPost = await Post.findById(savedPost._id).populate(
      "authorId",
      "email name"
    );

    // Buscar perfil separadamente
    const profile = await Profile.findOne({
      userId: populatedPost.authorId._id,
    })
      .select("firstName lastName photoUrl headline slug")
      .lean();

    const postWithProfile = {
      ...populatedPost.toObject(),
      authorId: {
        ...populatedPost.authorId.toObject(),
        profile: profile || null,
      },
    };

    return NextResponse.json(
      { message: "Post criado com sucesso", post: postWithProfile },
      { status: 201 }
    );
  } catch (error) {
    console.error("Post creation error:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      {
        error: "Erro ao criar post",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
