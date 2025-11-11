"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import LinkedInIcon from "./LinkedInIcon";
import PostDropdownMenu from "./PostDropdownMenu";
import CommentSection from "./CommentSection";
import ReactionButton from "./ReactionButton";
import ShareModal from "./ShareModal";
import SendMessagePopup from "./SendMessagePopup";
import MediaExpansionModal from "./MediaExpansionModal";
import PostDetailModal from "./PostDetailModal";
import MediaGridLayout from "./MediaGridLayout";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Check } from "lucide-react";
import type { ReactionType } from "@/models/Post";

interface PostCardProps {
  post: {
    _id: string;
    content?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    mediaUrls?: string[]; // Para múltiplas imagens
    likes?: string[];
    reactions?: Array<{
      userId?: string;
      companyId?: string;
      type: ReactionType;
      user?: {
        _id: string;
        name: string;
        email: string;
        profile?: {
          firstName: string;
          lastName: string;
          photoUrl?: string;
          followersCount?: number;
        };
      };
      company?: {
        _id: string;
        name: string;
        logoUrl?: string;
      };
      isFollowing?: boolean;
      followersCount?: number;
    }>;
    reactionsCount?: {
      like: number;
      celebrate: number;
      support: number;
      interesting: number;
      funny: number;
      love: number;
    };
    currentReaction?: ReactionType | null;
    commentsCount?: number;
    sharesCount?: number;
    createdAt: string;
    authorId?: {
      _id: string;
      email: string;
      name: string;
      profile?: {
        firstName: string;
        lastName: string;
        photoUrl?: string;
        headline?: string;
        slug?: string;
      };
    };
    companyId?: {
      _id: string;
      name: string;
      logoUrl?: string;
      followers?: number;
    };
    isHighlighted?: boolean;
    isSuggestion?: boolean;
  };
  onReaction?: (postId: string, reactionType: ReactionType | null) => void;
  onLike?: (postId: string) => void; // Mantido para compatibilidade
  onDelete?: (postId: string) => void;
}

export default function PostCard({
  post,
  onReaction,
  onLike,
  onDelete,
}: PostCardProps) {
  const { data: session } = useSession();
  const [showFullText, setShowFullText] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(
    post.currentReaction || null
  );
  const [reactionsCount, setReactionsCount] = useState(
    post.reactionsCount || {
      like: 0,
      celebrate: 0,
      support: 0,
      interesting: 0,
      funny: 0,
      love: 0,
    }
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showPostDetailModal, setShowPostDetailModal] = useState(false);
  const [mediaModalIndex, setMediaModalIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Agora";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const handleReaction = async (
    postId: string,
    reactionType: ReactionType | null
  ) => {
    try {
      const response = await fetch(`/api/posts/${postId}/reaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reactionType }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentReaction(data.currentReaction);
        setReactionsCount(data.reactionsCount);

        // Chamar callback opcional se fornecido
        if (onReaction) {
          onReaction(postId, reactionType);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Erro ao reagir ao post");
      }
    } catch (error) {
      console.error("Erro ao reagir ao post:", error);
      toast.error("Erro ao reagir ao post");
    }
  };

  const handleLike = async () => {
    if (onLike) {
      onLike(post._id);
    }
  };

  const isCompanyPost = !!post.companyId;
  const authorName = isCompanyPost
    ? post.companyId?.name || "Empresa"
    : post.authorId?.profile?.firstName && post.authorId?.profile?.lastName
    ? `${post.authorId.profile.firstName} ${post.authorId.profile.lastName}`
    : post.authorId?.name || "Usuário";

  const authorSubtitle = isCompanyPost
    ? `${post.companyId?.followers || 0} seguidores`
    : post.authorId?.profile?.headline || "";

  const authorAvatar = isCompanyPost
    ? post.companyId?.logoUrl
    : post.authorId?.profile?.photoUrl;

  // Verificar se o usuário atual é o dono do post
  const isOwner = session?.user
    ? isCompanyPost
      ? session.user.companyId === post.companyId?._id
      : session.user.id === post.authorId?._id
    : false;

  const [isHighlighted, setIsHighlighted] = useState(
    post.isHighlighted || false
  );

  const handleHighlightChange = (postId: string, highlighted: boolean) => {
    if (postId === post._id) {
      setIsHighlighted(highlighted);
    }
  };

  // Buscar status de seguindo ao carregar
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!session?.user || isOwner) return;

      try {
        const authorId = isCompanyPost
          ? post.companyId?._id
          : post.authorId?._id;
        if (!authorId) return;

        const type = isCompanyPost ? "company" : "user";
        const response = await fetch(
          `/api/follow/check/${authorId}?type=${type}`
        );
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing || false);
        }
      } catch (error) {
        console.error("Erro ao verificar status de seguindo:", error);
      }
    };

    checkFollowStatus();
  }, [
    session,
    isOwner,
    isCompanyPost,
    post.companyId?._id,
    post.authorId?._id,
  ]);

  // Função para seguir/deixar de seguir
  const handleFollowToggle = async () => {
    if (!session?.user || isOwner || isLoadingFollow) return;

    const authorId = isCompanyPost ? post.companyId?._id : post.authorId?._id;
    if (!authorId) return;

    setIsLoadingFollow(true);
    try {
      const response = await fetch(`/api/follow/${authorId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: isCompanyPost ? "company" : "user",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing || false);
        toast.success(
          data.isFollowing ? "Agora você está seguindo" : "Deixou de seguir"
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Erro ao seguir/deixar de seguir");
      }
    } catch (error) {
      console.error("Erro ao seguir/deixar de seguir:", error);
      toast.error("Erro ao seguir/deixar de seguir");
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const MAX_TEXT_LENGTH = 300;
  const shouldTruncate = post.content && post.content.length > MAX_TEXT_LENGTH;
  const displayText =
    shouldTruncate && !showFullText && post.content
      ? post.content.substring(0, MAX_TEXT_LENGTH) + "..."
      : post.content || "";

  // Encontrar a reação mais relevante de quem o usuário segue
  const followingReaction = useMemo(() => {
    if (!post.reactions || post.reactions.length === 0) return null;

    // Filtrar reações de quem o usuário segue
    const followingReactions = post.reactions.filter(
      (reaction) => reaction.isFollowing === true
    );

    // Se não houver reações de quem segue, retornar null
    if (followingReactions.length === 0) return null;

    // Retornar a primeira (já ordenada por relevância no backend - mais seguidores primeiro)
    return followingReactions[0];
  }, [post.reactions]);

  // Determinar se é uma reação (usuário segue o autor) ou sugestão (não segue o autor)
  const isReactionNotification = useMemo(() => {
    // Se há reação de quem segue E o usuário segue o autor, é uma notificação de reação
    return followingReaction && isFollowing;
  }, [followingReaction, isFollowing]);

  const isSuggestionNotification = useMemo(() => {
    // É sugestão se:
    // 1. Há reação de quem o usuário segue
    // 2. O usuário NÃO segue o autor do post
    // 3. O usuário não é o dono do post
    return followingReaction && !isFollowing && !isOwner && session?.user;
  }, [followingReaction, isFollowing, isOwner, session]);

  // Labels de reação
  const reactionLabels: Record<ReactionType, string> = {
    like: "gostou disso",
    love: "adorou isso",
    celebrate: "parabenizou isso",
    support: "apoiou isso",
    interesting: "achou interessante",
    funny: "achou engraçado",
  };

  // Extrair dados do followingReaction para exibição
  const reactionDisplayData = useMemo(() => {
    if (!followingReaction) return null;

    const displayName = followingReaction.user
      ? `${followingReaction.user.profile?.firstName || ""} ${
          followingReaction.user.profile?.lastName || ""
        }`.trim() || followingReaction.user.name
      : followingReaction.company?.name || "";

    const avatarUrl =
      followingReaction.user?.profile?.photoUrl ||
      followingReaction.company?.logoUrl;

    const reactionLabel = reactionLabels[followingReaction.type] || "reagiu";

    const avatarFallback = followingReaction.user
      ? `${followingReaction.user.profile?.firstName?.[0] || ""}${
          followingReaction.user.profile?.lastName?.[0] || ""
        }`.trim() || followingReaction.user.name[0].toUpperCase()
      : followingReaction.company?.name[0].toUpperCase() || "";

    return {
      displayName,
      avatarUrl,
      reactionLabel,
      avatarFallback,
    };
  }, [followingReaction]);

  // Determinar se deve mostrar "Sugestão" no frontend
  // Fallback para garantir que sugestões apareçam mesmo se a API não retornar a flag corretamente
  const shouldShowSuggestion = useMemo(() => {
    // Se não há sessão, não mostrar sugestões
    if (!session?.user) return false;

    // Se é o dono do post, não mostrar sugestão
    if (isOwner) return false;

    // Se já tem flag da API indicando que é sugestão, usar ela
    if (post.isSuggestion === true) return true;

    // Fallback: se não segue o autor, é sugestão
    // Nota: isFollowing começa como false e só é atualizado após a verificação da API
    // Se após a verificação ainda for false, significa que não está seguindo
    if (!isFollowing) {
      // Só mostrar se não é o dono (já verificado acima)
      return true;
    }

    return false;
  }, [post.isSuggestion, isFollowing, isOwner, session]);

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="p-4 pb-3">
        {/* Linha de Reação/Sugestão */}
        {(isReactionNotification ||
          isSuggestionNotification ||
          (shouldShowSuggestion && !reactionDisplayData)) && (
          <div className="flex items-center gap-2 mb-1">
            {/* Conteúdo: Avatar + Nome + Texto da reação */}
            {reactionDisplayData ? (
              <>
                {/* Avatar */}
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarImage
                    src={
                      reactionDisplayData.avatarUrl ||
                      "/placeholder/userplaceholder.svg"
                    }
                    alt={reactionDisplayData.displayName}
                  />
                  <AvatarFallback className="bg-gray-200 text-black text-xs">
                    {reactionDisplayData.avatarFallback}
                  </AvatarFallback>
                </Avatar>
                {/* Nome + Texto da reação */}
                <span className="text-xs text-black flex items-center gap-1 min-w-0">
                  <span className="font-semibold truncate">
                    {reactionDisplayData.displayName}
                  </span>
                  <span className="whitespace-nowrap shrink-0">
                    {reactionDisplayData.reactionLabel}
                  </span>
                </span>
              </>
            ) : (
              <span className="text-xs text-black whitespace-nowrap">
                Sugestão
              </span>
            )}
          </div>
        )}

        {/* Separator - apenas se houver notificação */}
        {(isReactionNotification ||
          isSuggestionNotification ||
          (shouldShowSuggestion && !reactionDisplayData)) && (
          <div className="border-b border-gray-200 mb-4"></div>
        )}

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {!isCompanyPost && post.authorId?.profile?.slug ? (
              <Link href={`/jobboard/${post.authorId.profile.slug}`}>
                <Avatar className="w-12 h-12 shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                  <AvatarImage
                    src={authorAvatar || "/placeholder/userplaceholder.svg"}
                    alt={authorName}
                  />
                  <AvatarFallback className="text-black text-xs">
                    {post.authorId?.profile?.firstName?.[0] || ""}
                    {post.authorId?.profile?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Avatar className="w-12 h-12 shrink-0">
                {isCompanyPost && !post.companyId?.logoUrl ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <LinkedInIcon id="company-accent-4" size={48} />
                  </div>
                ) : (
                  <>
                    <AvatarImage
                      src={authorAvatar || "/placeholder/userplaceholder.svg"}
                      alt={authorName}
                    />
                    <AvatarFallback className="text-black text-xs">
                      {isCompanyPost
                        ? post.companyId?.name?.substring(0, 2).toUpperCase() ||
                          "EM"
                        : post.authorId?.profile?.firstName?.[0] || ""}
                      {!isCompanyPost && post.authorId?.profile?.lastName?.[0]}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
            )}

            <div className="flex-1 min-w-0">
              {!isCompanyPost && post.authorId?.profile?.slug ? (
                <Link href={`/jobboard/${post.authorId.profile.slug}`}>
                  <h4 className="font-semibold text-sm text-black leading-tight mb-0.5 truncate cursor-pointer hover:underline">
                    {authorName}
                  </h4>
                </Link>
              ) : (
                <h4 className="font-semibold text-sm text-black leading-tight mb-0.5 truncate">
                  {authorName}
                </h4>
              )}
              <p className="text-xs text-black leading-tight mb-0.5 truncate">
                {authorSubtitle}
              </p>
              <p className="text-xs text-black leading-tight flex items-center gap-1">
                {formatTimeAgo(post.createdAt)} •{" "}
                <LinkedInIcon
                  id="globe-small"
                  size={16}
                  className="text-black"
                />
              </p>
            </div>
          </div>

          {/* Botão Seguir e Dropdown Menu - Lado Direito */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Botão Seguir */}
            {!isOwner && session?.user && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFollowToggle}
                disabled={isLoadingFollow}
                className={`h-7 px-3 text-xs font-medium ${
                  isFollowing
                    ? "text-black bg-white border-0"
                    : "text-[#0077b5] bg-white border-[#0077b5] hover:bg-[#0077b5]/5"
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-3 h-3 mr-1.5" />
                    Seguindo
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1.5" />
                    Seguir
                  </>
                )}
              </Button>
            )}

            {/* Dropdown Menu - 3 pontos */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="text-black hover:text-black p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Mais opções"
              >
                <LinkedInIcon id="overflow-web-ios-medium" size={24} />
              </button>
              {showDropdown && (
                <PostDropdownMenu
                  postId={post._id}
                  isOwner={isOwner}
                  postAuthorId={post.authorId?._id || ""}
                  postAuthorName={authorName}
                  isCompanyPost={isCompanyPost}
                  companyName={post.companyId?.name}
                  companyId={post.companyId?._id}
                  isHighlighted={isHighlighted}
                  onClose={() => setShowDropdown(false)}
                  onDelete={onDelete}
                  onHighlightChange={handleHighlightChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {post.content && (
          <div className="mb-3">
            <p className="text-sm text-black leading-relaxed whitespace-pre-line">
              {displayText}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setShowFullText(!showFullText)}
                className="text-xs text-black hover:text-black font-medium mt-1"
              >
                {showFullText ? "Ver menos" : "Ver mais"}
              </button>
            )}
          </div>
        )}

        {/* Media */}
        {post.mediaUrls && post.mediaUrls.length > 0 ? (
          <MediaGridLayout
            mediaUrls={post.mediaUrls}
            mediaType={post.mediaType}
            onImageClick={(index) => {
              setMediaModalIndex(index);
              setShowPostDetailModal(true);
            }}
          />
        ) : post.mediaUrl ? (
          // Vídeo único ou imagem única (fallback)
          <div
            className="mb-3 rounded-lg overflow-hidden border bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center"
            onClick={() => {
              setMediaModalIndex(0);
              setShowPostDetailModal(true);
            }}
          >
            {post.mediaType === "image" ? (
              <img
                src={post.mediaUrl}
                alt="Post media"
                className="w-full object-contain max-h-[500px]"
              />
            ) : (
              <video
                src={post.mediaUrl}
                controls
                className="w-full object-contain max-h-[500px]"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            )}
          </div>
        ) : null}

        {/* Engagement Stats */}
        <div className="flex justify-between items-center text-xs text-gray-500 pb-3">
          <div className="flex items-center gap-2">
            {(() => {
              const activeReactions = [
                { type: "like" as const, count: reactionsCount.like },
                { type: "love" as const, count: reactionsCount.love },
                { type: "celebrate" as const, count: reactionsCount.celebrate },
              ].filter((r) => r.count > 0);

              const totalReactions = activeReactions.reduce(
                (sum, r) => sum + r.count,
                0
              );

              if (totalReactions === 0) return null;

              return (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-4">
                    {activeReactions.map((reaction, index) => {
                      const iconMap = {
                        like: "/images/icons/like.svg",
                        love: "/images/icons/amei.svg",
                        celebrate: "/images/icons/parabens.svg",
                      };
                      const bgColorMap = {
                        like: "#378fe9",
                        love: "#df704d",
                        celebrate: "#6dae4f",
                      };

                      return (
                        <div
                          key={reaction.type}
                          className="w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: bgColorMap[reaction.type] }}
                        >
                          <img
                            src={iconMap[reaction.type]}
                            alt={reaction.type}
                            className="w-5 h-5"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-black font-medium">
                    {totalReactions}
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="text-black flex items-center gap-2">
            <span className="hover:underline cursor-pointer hover:text-black">
              {post.commentsCount || 0} comentários
            </span>
          </div>
        </div>

        {/* Separator */}
        <div className="border-b mb-2"></div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center text-black ">
          <ReactionButton
            postId={post._id}
            currentReaction={currentReaction}
            reactionsCount={Object.values(reactionsCount).reduce(
              (a, b) => a + b,
              0
            )}
            onReaction={handleReaction}
          />
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center justify-center gap-1 md:gap-2 text-[10px] md:text-xs font-medium rounded-md transition-colors duration-150 hover:bg-gray-100 px-2 py-1.5 md:px-4 md:py-2 flex-1 text-black hover:text-black"
          >
            <LinkedInIcon
              id="comment-small"
              size={12}
              className="md:!w-4 md:!h-4"
            />
            <span>Comentar</span>
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-center gap-1 md:gap-2 text-[10px] md:text-xs font-medium rounded-md transition-colors duration-150 hover:bg-gray-100 px-2 py-1.5 md:px-4 md:py-2 flex-1 text-black hover:text-black"
          >
            <LinkedInIcon
              id="repost-small"
              size={12}
              className="md:!w-4 md:!h-4"
            />
            <span>Compartilhar</span>
          </button>
          <button
            onClick={() => setShowSendMessage(true)}
            className="flex items-center justify-center gap-1 md:gap-2 text-[10px] md:text-xs font-medium rounded-md transition-colors duration-150 hover:bg-gray-100 px-2 py-1.5 md:px-4 md:py-2 flex-1 text-black hover:text-black"
          >
            <LinkedInIcon
              id="send-privately-small"
              size={12}
              className="md:!w-4 md:!h-4"
            />
            <span>Enviar</span>
          </button>
        </div>

        {/* Comment Section */}
        <CommentSection postId={post._id} isExpanded={showComments} />
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
      />

      {/* Send Message Popup */}
      <SendMessagePopup
        isOpen={showSendMessage}
        onClose={() => setShowSendMessage(false)}
        post={post}
      />

      {/* Post Detail Modal */}
      <PostDetailModal
        isOpen={showPostDetailModal}
        onClose={() => setShowPostDetailModal(false)}
        post={{
          ...post,
          currentReaction: currentReaction,
          reactionsCount: reactionsCount,
        }}
        initialMediaIndex={mediaModalIndex}
        onReaction={handleReaction}
        onDelete={onDelete}
      />
    </div>
  );
}
