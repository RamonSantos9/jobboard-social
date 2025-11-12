import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Post, { IPost } from "@/models/Post";
import Comment from "@/models/Comment";
import Profile, { IProfile } from "@/models/Profile";
import User from "@/models/User";
import Company, { ICompany } from "@/models/Company";
import Connection from "@/models/Connection";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    const post = (await Post.findById(id)
      .populate("authorId", "email name")
      .lean()) as unknown as (Partial<IPost> & {
      _id: mongoose.Types.ObjectId;
      authorId: {
        _id: mongoose.Types.ObjectId;
        email?: string;
        name?: string;
      };
      reactions?: Array<{
        userId?: mongoose.Types.ObjectId;
        companyId?: mongoose.Types.ObjectId;
        type: string;
      }>;
      likes?: mongoose.Types.ObjectId[];
      sharesCount?: number;
      mediaUrl?: string;
      mediaType?: "image" | "video";
      mediaUrls?: string[];
    }) | null;

    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    // Buscar perfil do autor
    const profile = (await Profile.findOne({ userId: post.authorId._id })
      .select("firstName lastName photoUrl headline slug")
      .lean()) as unknown as Partial<Pick<IProfile, "firstName" | "lastName" | "photoUrl" | "headline" | "slug">> | null;

    // Verificar se o usuário atual está seguindo o autor
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

    // Calcular contagem de reações
    const reactionsCount = {
      like: 0,
      celebrate: 0,
      support: 0,
      interesting: 0,
      funny: 0,
      love: 0,
    };

    const reactionsWithData = [];
    if (post.reactions && Array.isArray(post.reactions)) {
      for (const reaction of post.reactions) {
        if (reactionsCount[reaction.type as keyof typeof reactionsCount] !== undefined) {
          reactionsCount[reaction.type as keyof typeof reactionsCount]++;
        }

        let reactionData: any = { type: reaction.type };

        if (reaction.userId) {
          const user = (await User.findById(reaction.userId).select("name email").lean()) as unknown as Partial<{ _id: mongoose.Types.ObjectId; name?: string; email?: string }> | null;
          const userProfile = (await Profile.findOne({ userId: reaction.userId })
            .select("firstName lastName photoUrl slug followersCount")
            .lean()) as unknown as Partial<Pick<IProfile, "firstName" | "lastName" | "photoUrl" | "slug">> & { followersCount?: number } | null;

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
          const company = (await Company.findById(reaction.companyId)
            .select("name logoUrl followersCount")
            .lean()) as unknown as Partial<Pick<ICompany, "name" | "logoUrl" | "followersCount">> & { _id?: mongoose.Types.ObjectId } | null;

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
      }

      reactionsWithData.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
    }

    // Encontrar reação do usuário atual
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

    const isPostAuthor = userId && post.authorId._id.toString() === userId.toString();
    const isSuggestion = userId && !isFollowingAuthor && !isPostAuthor;

    const likes = post.likes || [];
    const isLiked = userId ? likes.some((likeId: mongoose.Types.ObjectId) => likeId.toString() === userId.toString()) : false;
    const commentsCount = await Comment.countDocuments({ postId: post._id });
    const sharesCount = post.sharesCount || 0;

    return NextResponse.json({
      post: {
        ...post,
        mediaUrl: post.mediaUrl || null,
        mediaType: post.mediaType || null,
        mediaUrls: post.mediaUrls || null,
        authorId: {
          ...post.authorId,
          profile: profile || null,
        },
        reactions: reactionsWithData,
        reactionsCount,
        currentReaction,
        commentsCount,
        sharesCount,
        likes,
        isLiked,
        isSuggestion: isSuggestion || false,
      },
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Erro ao buscar post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await connectDB();

    const { id } = await params;
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é o autor do post
    if (post.authorId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para deletar este post" },
        { status: 403 }
      );
    }

    // Deletar comentários relacionados
    await Comment.deleteMany({ postId: id });

    // Deletar o post
    await Post.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Post deletado com sucesso",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Error details:", errorMessage);
    return NextResponse.json(
      {
        error: "Erro ao deletar post",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
