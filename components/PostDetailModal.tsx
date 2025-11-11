"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import Image from "next/image";
import LinkedInIcon from "./LinkedInIcon";
import ReactionButton from "./ReactionButton";
import CommentSection from "./CommentSection";
import ShareModal from "./ShareModal";
import SendMessagePopup from "./SendMessagePopup";
import PostDropdownMenu from "./PostDropdownMenu";
import ReactionNotification from "./ReactionNotification";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import type { ReactionType } from "@/models/Post";

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    _id: string;
    content?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    mediaUrls?: string[];
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
        };
      };
      company?: {
        _id: string;
        name: string;
        logoUrl?: string;
      };
      isFollowing?: boolean;
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
  };
  initialMediaIndex?: number;
  onReaction?: (postId: string, reactionType: ReactionType | null) => void;
  onDelete?: (postId: string) => void;
}

export default function PostDetailModal({
  isOpen,
  onClose,
  post,
  initialMediaIndex = 0,
  onReaction,
  onDelete,
}: PostDetailModalProps) {
  const { data: session } = useSession();
  const [currentIndex, setCurrentIndex] = useState(initialMediaIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
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
  const [showComments, setShowComments] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(
    post.isHighlighted || false
  );
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Determinar quais URLs usar
  const allMediaUrls =
    post.mediaUrls && post.mediaUrls.length > 0
      ? post.mediaUrls
      : post.mediaUrl
      ? [post.mediaUrl]
      : [];
  const currentMediaUrl = allMediaUrls[currentIndex];
  const hasMultiple = allMediaUrls.length > 1;
  const isVideo = post.mediaType === "video";

  // Reset index quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialMediaIndex);
      setIsPlaying(false);
      setIsMuted(false);
      setShowControls(true);
    }
  }, [isOpen, initialMediaIndex]);

  // Sincronizar reações quando post prop mudar
  useEffect(() => {
    if (post.currentReaction !== undefined) {
      setCurrentReaction(post.currentReaction);
    }
    if (post.reactionsCount) {
      setReactionsCount(post.reactionsCount);
    }
  }, [post.currentReaction, post.reactionsCount]);

  // Polling para atualizar post quando modal estiver aberto
  useEffect(() => {
    if (!isOpen) return;

    const fetchPostData = async () => {
      try {
        const response = await fetch(`/api/posts/${post._id}`);
        const data = await response.json();

        if (response.ok && data.post) {
          // Atualizar apenas reações e comentários
          if (data.post.currentReaction !== undefined) {
            setCurrentReaction(data.post.currentReaction);
          }
          if (data.post.reactionsCount) {
            setReactionsCount(data.post.reactionsCount);
          }

          // Chamar callback para atualizar no componente pai
          if (onReaction) {
            // Isso vai atualizar o post no MainFeed
            onReaction(post._id, data.post.currentReaction || null);
          }
        }
      } catch (error) {
        console.error("Error fetching post data:", error);
      }
    };

    // Buscar imediatamente quando abrir
    fetchPostData();

    // Polling a cada 5 segundos quando o modal estiver aberto
    const interval = setInterval(() => {
      fetchPostData();
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, post._id, onReaction]);

  // Auto-hide controls para vídeo
  useEffect(() => {
    if (isVideo && isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isVideo, isPlaying, showControls]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allMediaUrls.length - 1));
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < allMediaUrls.length - 1 ? prev + 1 : 0));
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      setShowControls(true);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      setShowControls(true);
    }
  };

  const handleVideoClick = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      if (hasMultiple) handlePrevious();
    } else if (e.key === "ArrowRight") {
      if (hasMultiple) handleNext();
    } else if (e.key === "Escape") {
      onClose();
    } else if (e.key === " " && isVideo) {
      e.preventDefault();
      handlePlayPause();
    }
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

        // Atualizar post prop para sincronizar com PostCard
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
    isOpen,
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-7xl w-[95vw] max-h-[85vh] h-[85vh] md:h-[90vh] md:max-h-[90vh] p-0 bg-white border border-gray-200 gap-0 overflow-hidden focus:outline-none shadow-lg rounded-lg [&>button]:hidden flex flex-col"
          onKeyDown={handleKeyDown}
        >
          <DialogTitle className="sr-only">Detalhes do post</DialogTitle>

          {/* Notificação - Reação ou Sugestão */}
          {isReactionNotification && followingReaction && (
            <ReactionNotification
              reaction={followingReaction}
              notificationType="reaction"
            />
          )}
          {isSuggestionNotification && followingReaction && (
            <ReactionNotification
              reaction={followingReaction}
              notificationType="suggestion"
            />
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Main Content - Flex Column on Mobile, Flex Row on Desktop */}
          <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
            {/* Left Side - Media - Full width on mobile, 50% on desktop */}
            {allMediaUrls.length > 0 ? (
              <div className="w-full md:w-1/2 h-[35vh] md:h-full flex items-center justify-center relative overflow-hidden shrink-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    {isVideo ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <video
                          ref={videoRef}
                          src={currentMediaUrl}
                          className="max-w-full max-h-full object-contain"
                          onClick={handleVideoClick}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          onEnded={() => {
                            setIsPlaying(false);
                            if (hasMultiple) {
                              handleNext();
                            }
                          }}
                          muted={isMuted}
                          playsInline
                          controls={false}
                        />

                        {/* Video Controls */}
                        <AnimatePresence>
                          {showControls && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
                            >
                              <div className="flex items-center justify-center gap-4">
                                <Button
                                  onClick={handlePlayPause}
                                  variant="ghost"
                                  size="icon"
                                  className="text-white hover:bg-white/20"
                                >
                                  {isPlaying ? (
                                    <Pause className="w-5 h-5" />
                                  ) : (
                                    <Play className="w-5 h-5" />
                                  )}
                                </Button>

                                <Button
                                  onClick={handleMuteToggle}
                                  variant="ghost"
                                  size="icon"
                                  className="text-white hover:bg-white/20"
                                >
                                  {isMuted ? (
                                    <VolumeX className="w-5 h-5" />
                                  ) : (
                                    <Volume2 className="w-5 h-5" />
                                  )}
                                </Button>

                                {hasMultiple && (
                                  <>
                                    <Button
                                      onClick={handlePrevious}
                                      variant="ghost"
                                      size="icon"
                                      className="text-white hover:bg-white/20"
                                    >
                                      <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                    <span className="text-white text-sm">
                                      {currentIndex + 1} / {allMediaUrls.length}
                                    </span>
                                    <Button
                                      onClick={handleNext}
                                      variant="ghost"
                                      size="icon"
                                      className="text-white hover:bg-white/20"
                                    >
                                      <ChevronRight className="w-5 h-5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <>
                        <img
                          src={currentMediaUrl}
                          alt={`Media ${currentIndex + 1}`}
                          className="max-w-full max-h-full object-contain"
                        />
                        {/* Navigation Arrows - Images */}
                        {hasMultiple && (
                          <>
                            <button
                              onClick={handlePrevious}
                              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                              aria-label="Imagem anterior"
                            >
                              <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                              onClick={handleNext}
                              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                              aria-label="Próxima imagem"
                            >
                              <ChevronRight className="w-6 h-6" />
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
                              {currentIndex + 1} / {allMediaUrls.length}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : null}

            {/* Right Side - Content - Full width on mobile, 50% on desktop if media exists */}
            <div
              className={`${
                allMediaUrls.length > 0 ? "w-full md:w-1/2" : "w-full"
              } flex flex-col bg-white flex-1 min-h-0 overflow-hidden`}
            >
              {/* Header - Author Info */}
              <div className="p-4 border-b border-gray-200 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {!isCompanyPost && post.authorId?.profile?.slug ? (
                      <Link href={`/jobboard/${post.authorId.profile.slug}`}>
                        <Avatar className="w-12 h-12 shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                          <AvatarImage
                            src={
                              authorAvatar || "/placeholder/userplaceholder.svg"
                            }
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
                              src={
                                authorAvatar ||
                                "/placeholder/userplaceholder.svg"
                              }
                              alt={authorName}
                            />
                            <AvatarFallback className="text-black text-xs">
                              {isCompanyPost
                                ? post.companyId?.name
                                    ?.substring(0, 2)
                                    .toUpperCase() || "EM"
                                : post.authorId?.profile?.firstName?.[0] || ""}
                              {!isCompanyPost &&
                                post.authorId?.profile?.lastName?.[0]}
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
                      {authorSubtitle && (
                        <p className="text-xs text-black leading-tight mb-0.5 truncate">
                          {authorSubtitle}
                        </p>
                      )}
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
                            ? "text-gray-600 bg-white border-gray-300 hover:bg-gray-50"
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

                    {/* Dropdown Menu */}
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

              {/* Content - Scrollable Area */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {/* Post Content */}
                  <div className="px-4 py-4 border-b border-gray-200">
                    {post.content && (
                      <div>
                        <p className="text-sm text-black leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Reaction Icons with Counts - Above Action Buttons */}
                  {(() => {
                    const activeReactions = [
                      { type: "like" as const, count: reactionsCount.like },
                      { type: "love" as const, count: reactionsCount.love },
                      {
                        type: "celebrate" as const,
                        count: reactionsCount.celebrate,
                      },
                    ].filter((r) => r.count > 0);

                    const totalReactions = activeReactions.reduce(
                      (sum, r) => sum + r.count,
                      0
                    );

                    if (totalReactions === 0) return null;

                    return (
                      <div className="px-4 pt-3 pb-2">
                        <div className="flex items-center gap-2">
                          {/* Ícones de reação sobrepostos */}
                          <div className="flex items-center -space-x-2">
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
                                  key={`reaction-${reaction.type}`}
                                  className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-white relative"
                                  style={{
                                    backgroundColor: bgColorMap[reaction.type],
                                    zIndex: activeReactions.length - index,
                                  }}
                                >
                                  <img
                                    src={iconMap[reaction.type]}
                                    alt={reaction.type}
                                    className="w-3 h-3"
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {/* Contagem total */}
                          <span className="text-black font-normal text-xs ml-1">
                            {totalReactions}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Comments Section */}
                  {showComments && (
                    <div className="px-4 py-4">
                      <CommentSection postId={post._id} isExpanded={true} />
                    </div>
                  )}
                </div>

                {/* Action Buttons - Fixed at Bottom */}
                <div className="flex justify-between items-center text-black border-t border-gray-200 px-4 py-4 shrink-0 bg-white">
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
                    className="flex items-center justify-center gap-1 md:gap-2 text-[13px] md:text-xs font-medium rounded-md transition-colors duration-150 hover:bg-gray-100 px-2 py-1.5 md:px-4 md:py-2 flex-1 text-black hover:text-black"
                  >
                    <LinkedInIcon
                      id="comment-small"
                      size={13}
                      className="md:!w-4 md:!h-4"
                    />
                    <span>Comentar</span>
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center justify-center gap-1 md:gap-2 text-[13px] md:text-xs font-medium rounded-md transition-colors duration-150 hover:bg-gray-100 px-2 py-1.5 md:px-4 md:py-2 flex-1 text-black hover:text-black"
                  >
                    <LinkedInIcon
                      id="repost-small"
                      size={13}
                      className="md:!w-4 md:!h-4"
                    />
                    <span>Compartilhar</span>
                  </button>
                  <button
                    onClick={() => setShowSendMessage(true)}
                    className="flex items-center justify-center gap-1 md:gap-2 text-[13px] md:text-xs font-medium rounded-md transition-colors duration-150 hover:bg-gray-100 px-2 py-1.5 md:px-4 md:py-2 flex-1 text-black hover:text-black"
                  >
                    <LinkedInIcon
                      id="send-privately-small"
                      size={13}
                      className="md:!w-4 md:!h-4"
                    />
                    <span>Enviar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
}
