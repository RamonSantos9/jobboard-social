import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";
import Profile from "@/models/Profile";
import Job from "@/models/Job";
import { calculateJobMatchScore } from "@/lib/jobRecommendation";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching posts...");
    await connectDB();

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

    // Buscar perfis separadamente para evitar problemas de populate aninhado
    const postsWithProfiles = await Promise.all(
      posts.map(async (post) => {
        const profile = await Profile.findOne({ userId: post.authorId._id })
          .select("firstName lastName photoUrl headline")
          .lean();
        
        return {
          ...post.toObject(),
          authorId: {
            ...post.authorId.toObject(),
            profile: profile || null
          }
        };
      })
    );

    const total = await Post.countDocuments();

    // Se usuário está logado, adicionar vagas recomendadas
    let recommendedJobs: any[] = [];
    const session = await getServerSession(authOptions);
    
    if (session) {
      try {
        // Buscar perfil do usuário
        const userProfile = await Profile.findOne({ userId: session.user.id }).lean();

        if (userProfile) {
          // Buscar algumas vagas ativas
          const jobs = await Job.find({ status: "active" })
            .populate("companyId", "name logoUrl")
            .lean()
            .limit(5);

          // Calcular scores e adicionar tipo para diferenciação
          recommendedJobs = jobs.map((job) => {
            const score = calculateJobMatchScore(userProfile, job);
            return {
              ...job,
              type: "job", // Marcar como vaga
              matchScore: score.total,
              matchBreakdown: score.breakdown,
            };
          });

          // Ordenar por score
          recommendedJobs.sort((a, b) => b.matchScore - a.matchScore);
        }
      } catch (error) {
        console.error("Error fetching recommended jobs:", error);
      }
    }

    // Misturar posts e vagas (alternando)
    const mixedFeed: any[] = [];
    const postsArray = postsWithProfiles.map((post) => ({ ...post, type: "post" }));
    
    let postIndex = 0;
    let jobIndex = 0;
    
    // Intercalar posts e vagas (a cada 3 posts, adicionar 1 vaga)
    while (postIndex < postsArray.length || jobIndex < recommendedJobs.length) {
      // Adicionar até 3 posts
      for (let i = 0; i < 3 && postIndex < postsArray.length; i++) {
        mixedFeed.push(postsArray[postIndex]);
        postIndex++;
      }
      
      // Adicionar 1 vaga
      if (jobIndex < recommendedJobs.length) {
        mixedFeed.push(recommendedJobs[jobIndex]);
        jobIndex++;
      }
      
      // Se não há mais vagas, adicionar todos os posts restantes
      if (jobIndex >= recommendedJobs.length) {
        while (postIndex < postsArray.length) {
          mixedFeed.push(postsArray[postIndex]);
          postIndex++;
        }
        break;
      }
    }

    return NextResponse.json({
      posts: mixedFeed,
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
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, mediaUrl, mediaType, mediaUrls, hashtags } = body;

    console.log("Creating post with data:", {
      content,
      mediaUrl,
      mediaType,
      mediaUrls,
      hashtags,
    });

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Conteúdo é obrigatório" },
        { status: 400 }
      );
    }

    await connectDB();

    const post = new Post({
      authorId: session.user.id,
      content,
      mediaUrl,
      mediaType,
      mediaUrls,
      hashtags: hashtags || [],
    });

    await post.save();

    // Buscar o post com dados do autor
    const populatedPost = await Post.findById(post._id).populate(
      "authorId",
      "email name"
    );

    // Buscar perfil separadamente
    const profile = await Profile.findOne({ userId: populatedPost.authorId._id })
      .select("firstName lastName photoUrl headline")
      .lean();

    const postWithProfile = {
      ...populatedPost.toObject(),
      authorId: {
        ...populatedPost.authorId.toObject(),
        profile: profile || null
      }
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
