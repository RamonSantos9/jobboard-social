import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Profile, { IProfile } from "@/models/Profile";
import Vacancy, { IVacancy } from "@/models/Vacancy";
import Post, { IPost } from "@/models/Post";
import UserInteraction from "@/models/UserInteraction";
import SavedJob from "@/models/SavedJob";
import Company, { ICompany } from "@/models/Company";
import Connection from "@/models/Connection";
import User from "@/models/User";
import Comment from "@/models/Comment";
import {
  calculateJobFeedScore,
  calculatePostFeedScore,
  applyDiversity,
  UserInteractionHistory,
} from "@/lib/feedRecommendation";

interface FeedItem {
  _id: string;
  type: "job" | "post";
  score: number;
  data: any;
  authorId?: any;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Buscar perfil do usuário
    const profile = (await Profile.findOne({ userId })
      .select(
        "skills experience location sector preferredLocation currentTitle currentCompany headline"
      )
      .lean()) as Partial<IProfile> | null;

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    // Buscar histórico de interações (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const interactions = await UserInteraction.find({
      userId,
      timestamp: { $gte: thirtyDaysAgo },
    }).lean();

    // Buscar vagas salvas
    const savedJobs = await SavedJob.find({ userId }).select("jobId").lean();
    const savedJobIds = savedJobs.map((sj) => sj.jobId.toString());

    // Buscar empresas visitadas (via interações)
    const companyViews = new Set<string>();
    const jobViews = interactions.filter(
      (i) => i.itemType === "job" && i.interactionType === "view"
    );
    for (const interaction of jobViews) {
      try {
        const job = await Vacancy.findById(interaction.itemId)
          .select("companyId")
          .lean();
        if (job && (job as any).companyId) {
          companyViews.add((job as any).companyId.toString());
        }
      } catch (error) {
        // Ignorar erros
      }
    }

    // Buscar vagas aplicadas
    const Application = (await import("@/models/Application")).default;
    const applications = await Application.find({ candidateId: userId })
      .select("jobId")
      .lean();
    const appliedJobIds = new Set(
      applications.map((app) => app.jobId.toString())
    );

    // Buscar vagas publicadas
    const jobs = await Vacancy.find({
      status: "published",
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: new Date() } },
      ],
    })
      .populate("companyId", "name logoUrl location")
      .sort({ createdAt: -1 })
      .limit(100) // Buscar mais para calcular scores
      .lean();

    // Buscar posts recentes
    const posts = await Post.find({})
      .populate("authorId", "name email")
      .sort({ createdAt: -1 })
      .limit(100) // Buscar mais para calcular scores
      .lean();

    // Buscar conexões (seguindo)
    const following = await Connection.find({
      followerId: userId,
      status: "accepted",
    })
      .select("followingId type")
      .lean();

    const followingUserIds = following
      .filter((f) => f.type === "user")
      .map((f) => f.followingId.toString());
    const followingCompanyIds = following
      .filter((f) => f.type === "company")
      .map((f) => f.followingId.toString());

    // Calcular scores para vagas
    const jobItems: FeedItem[] = await Promise.all(
      jobs.map(async (job: any) => {
        const jobId = String(job._id);
        const companyId =
          job.companyId?._id?.toString() || job.companyId?.toString();

        // Histórico de interações para esta vaga
        const jobInteractions = interactions.filter(
          (i) => i.itemId.toString() === jobId && i.itemType === "job"
        );

        const interactionHistory: UserInteractionHistory = {
          views: jobInteractions.filter((i) => i.interactionType === "view")
            .length,
          saves: savedJobIds.includes(jobId) ? 1 : 0,
          applies: appliedJobIds.has(jobId) ? 1 : 0,
          companyViews: companyViews.has(companyId || "") ? 1 : 0,
          totalDuration: jobInteractions
            .filter((i) => i.interactionType === "view")
            .reduce((sum, i) => sum + (i.duration || 0), 0),
          liked: false,
          commented: false,
          shared: false,
        };

        const scoreResult = calculateJobFeedScore(
          profile,
          job as Partial<IVacancy>,
          interactionHistory,
          job.createdAt || new Date()
        );

        return {
          _id: jobId,
          type: "job" as const,
          score: scoreResult.total,
          data: {
            ...job,
            matchScore: scoreResult.total,
            scoreBreakdown: scoreResult.breakdown,
          },
        };
      })
    );

    // Calcular scores para posts
    const postItems: FeedItem[] = await Promise.all(
      posts.map(async (post: any) => {
        const postId = String(post._id);
        const authorId =
          post.authorId?._id?.toString() || post.authorId?.toString();
        const isFollowingAuthor = followingUserIds.includes(authorId || "");

        // Verificar se post é de empresa seguida
        let isFollowingCompany = false;
        if ((post as any).companyId) {
          const companyId = (post as any).companyId.toString();
          isFollowingCompany = followingCompanyIds.includes(companyId);
        }

        // Histórico de interações para este post
        const postInteractions = interactions.filter(
          (i) => i.itemId.toString() === postId && i.itemType === "post"
        );

        const interactionHistory: UserInteractionHistory = {
          views: postInteractions.filter((i) => i.interactionType === "view")
            .length,
          saves: 0,
          applies: 0,
          companyViews: 0,
          totalDuration: postInteractions
            .filter((i) => i.interactionType === "view")
            .reduce((sum, i) => sum + (i.duration || 0), 0),
          liked: postInteractions.some((i) => i.interactionType === "like"),
          commented: postInteractions.some(
            (i) => i.interactionType === "comment"
          ),
          shared: postInteractions.some((i) => i.interactionType === "share"),
        };

        // Contar reações, comentários e shares
        const reactionsCount = (post as any).reactions?.length || 0;
        const commentsCount = await Comment.countDocuments({
          postId: new mongoose.Types.ObjectId(postId),
        });
        const sharesCount = (post as any).sharesCount || 0;

        const scoreResult = calculatePostFeedScore(
          post as Partial<IPost>,
          interactionHistory,
          isFollowingAuthor || isFollowingCompany,
          post.createdAt || new Date(),
          reactionsCount,
          commentsCount,
          sharesCount,
          profile
        );

        return {
          _id: postId,
          type: "post" as const,
          score: scoreResult.total,
          data: post,
          authorId: (post as any).authorId,
        };
      })
    );

    // Combinar e ordenar por score
    const allItems: FeedItem[] = [...jobItems, ...postItems].sort(
      (a, b) => b.score - a.score
    );

    // Aplicar diversificação
    const diversified = applyDiversity(allItems);

    // Paginar
    const paginated = diversified.slice(skip, skip + limit);

    // Formatar resposta similar à API de posts
    const formattedItems = await Promise.all(
      paginated.map(async (item) => {
        if (item.type === "job") {
          const job = item.data;
          return {
            _id: String(job._id),
            type: "job",
            title: job.title,
            description: job.description,
            location: job.location,
            remote: job.remote,
            jobType: job.type,
            level: job.level,
            category: job.category,
            salaryRange: job.salaryRange,
            companyId: job.companyId,
            skills: job.skills || [],
            benefits: job.benefits || [],
            matchScore: item.score,
            createdAt: job.createdAt,
          };
        } else {
          // Post - precisa buscar dados completos como na API de posts
          const post = await Post.findById(item._id)
            .populate("authorId", "email name")
            .lean();

          if (!post) return null;

          // Buscar perfil do autor
          const authorProfile = (await Profile.findOne({
            userId: (post as any).authorId?._id,
          })
            .select("firstName lastName photoUrl headline slug location")
            .lean()) as Partial<IProfile> | null;

          // Verificar se está seguindo
          const isFollowingAuthor = followingUserIds.includes(
            (post as any).authorId?._id?.toString()
          );

          // Contar reações
          const reactionsCount = {
            like: 0,
            celebrate: 0,
            support: 0,
            interesting: 0,
            funny: 0,
            love: 0,
          };

          if ((post as any).reactions) {
            (post as any).reactions.forEach((r: any) => {
              if (
                reactionsCount[r.type as keyof typeof reactionsCount] !==
                undefined
              ) {
                reactionsCount[r.type as keyof typeof reactionsCount]++;
              }
            });
          }

          const commentsCount = await Comment.countDocuments({
            postId: (post as any)._id,
          });
          const sharesCount = (post as any).sharesCount || 0;

          // Verificar reação atual do usuário
          let currentReaction = null;
          if ((post as any).reactions) {
            const userReaction = (post as any).reactions.find(
              (r: any) => r.userId?.toString() === userId.toString()
            );
            currentReaction = userReaction?.type || null;
          }

          return {
            _id: (post as any)._id,
            type: "post",
            content: (post as any).content,
            mediaUrl: (post as any).mediaUrl,
            mediaUrls: (post as any).mediaUrls,
            mediaType: (post as any).mediaType,
            authorId: {
              _id: (post as any).authorId?._id,
              name: (post as any).authorId?.name,
              email: (post as any).authorId?.email,
              profile: authorProfile
                ? {
                    firstName: authorProfile.firstName,
                    lastName: authorProfile.lastName,
                    photoUrl: authorProfile.photoUrl,
                    headline: authorProfile.headline,
                    slug: authorProfile.slug,
                    location: authorProfile.location,
                  }
                : null,
            },
            reactionsCount,
            currentReaction,
            commentsCount,
            sharesCount,
            isSuggestion:
              !isFollowingAuthor &&
              (post as any).authorId?._id?.toString() !== userId.toString(),
            createdAt: (post as any).createdAt,
          };
        }
      })
    );

    const validItems = formattedItems.filter((item) => item !== null);

    return NextResponse.json({
      items: validItems,
      pagination: {
        page,
        limit,
        total: diversified.length,
        hasMore: skip + limit < diversified.length,
      },
    });
  } catch (error: any) {
    console.error("Erro ao buscar feed recomendado:", error);
    return NextResponse.json(
      { error: "Erro ao buscar feed recomendado", details: error.message },
      { status: 500 }
    );
  }
}
