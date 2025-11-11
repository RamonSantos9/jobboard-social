"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import LinkedInIcon from "./LinkedInIcon";
import ReactionButton from "./ReactionButton";
import type { ReactionType } from "@/models/Post";

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  authorId: {
    _id: string;
    name: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      photoUrl?: string;
      slug?: string;
    };
  };
  reactionsCount?: {
    like: number;
    celebrate: number;
    support: number;
    interesting: number;
    funny: number;
    love: number;
  };
  currentReaction?: ReactionType | null;
  followersCount?: number;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onReplyAdded?: () => void;
  onReplyClick?: (commentId: string, authorName: string) => void;
  isReply?: boolean;
  replyingTo?: { commentId: string; authorName: string } | null;
  onCancelReply?: () => void;
  forceShowReplies?: boolean;
}

const REPLIES_LIMIT = 5;

export default function CommentItem({
  comment,
  postId,
  onReplyAdded,
  onReplyClick,
  isReply = false,
  replyingTo,
  onCancelReply,
  forceShowReplies = false,
}: CommentItemProps) {
  const { data: session } = useSession();
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [localReplies, setLocalReplies] = useState<Comment[]>(() => {
    if (comment.replies && Array.isArray(comment.replies)) {
      return comment.replies.filter((reply) => reply && reply._id);
    }
    return [];
  });
  
  // Calcular se deve mostrar respostas inicialmente
  // Se forceShowReplies é true, SEMPRE inicializar como true (mesmo que não haja respostas ainda)
  // OU se há respostas e está sendo respondido
  const hasRepliesInitially = comment.replies && Array.isArray(comment.replies) && comment.replies.filter((r) => r && r._id).length > 0;
  const shouldShowInitially = forceShowReplies || (hasRepliesInitially && replyingTo?.commentId === comment._id);
  const [showReplies, setShowReplies] = useState(() => {
    // Se forceShowReplies é true, sempre inicializar como true
    if (forceShowReplies) {
      return true;
    }
    // Caso contrário, usar a lógica normal
    return shouldShowInitially;
  });
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(
    comment.currentReaction || null
  );
  const [reactionsCount, setReactionsCount] = useState(
    comment.reactionsCount || {
      like: 0,
      celebrate: 0,
      support: 0,
      interesting: 0,
      funny: 0,
      love: 0,
    }
  );
  const isReplyingToThis = replyingTo?.commentId === comment._id;
  
  // Ref para armazenar os IDs das respostas anteriores (para detectar novas respostas)
  const getInitialReplyIds = (): Set<string> => {
    if (comment.replies && Array.isArray(comment.replies)) {
      return new Set(
        comment.replies
          .filter((reply) => reply && reply._id)
          .map((reply) => reply._id)
      );
    }
    return new Set();
  };
  const previousReplyIdsRef = useRef<Set<string>>(getInitialReplyIds());

  // Atualizar localReplies quando comment.replies mudar
  useEffect(() => {
    if (comment.replies) {
      const filtered = comment.replies.filter((reply) => reply && reply._id);
      setLocalReplies(filtered);
    } else {
      setLocalReplies([]);
    }
  }, [comment.replies]);

  // Efeito CRÍTICO: sempre que forceShowReplies for true, FORÇAR showReplies para true
  // Isso garante que as respostas sejam exibidas mesmo após recarregar os comentários
  useEffect(() => {
    if (forceShowReplies) {
      setShowReplies(true);
    }
  }, [forceShowReplies]);
  
  // Efeito: quando comment.replies muda e há respostas, garantir que showReplies seja true se forceShowReplies for true
  useEffect(() => {
    if (forceShowReplies && comment.replies && comment.replies.length > 0) {
      setShowReplies(true);
    }
  }, [forceShowReplies, comment.replies]);

  // Efeito: mostrar respostas quando está sendo respondido
  useEffect(() => {
    if (isReplyingToThis && localReplies.length > 0) {
      setShowReplies(true);
    }
  }, [isReplyingToThis, localReplies.length]);

  // Efeito: atualizar ref de IDs quando comentários mudarem
  useEffect(() => {
    if (comment.replies) {
      const filtered = comment.replies.filter((reply) => reply && reply._id);
      const currentIds = new Set(filtered.map((reply) => reply._id));
      previousReplyIdsRef.current = currentIds;
    } else {
      previousReplyIdsRef.current = new Set();
    }
  }, [comment.replies]);

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

  const authorName = () => {
    if (comment.authorId.profile) {
      return `${comment.authorId.profile.firstName} ${comment.authorId.profile.lastName}`;
    }
    return comment.authorId.name || "Usuário";
  };

  const authorAvatar = () => {
    return comment.authorId.profile?.photoUrl;
  };

  // Função para renderizar conteúdo com menções
  const renderContentWithMentions = (content: string) => {
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      const mentionName = match[1];
      parts.push(
        <Link
          key={`mention-${match.index}`}
          href={`/jobboard/${mentionName.toLowerCase()}`}
          className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
        >
          @{mentionName}
        </Link>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleReaction = async (
    commentId: string,
    reactionType: ReactionType | null
  ) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/reaction`, {
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
      } else {
        toast.error("Erro ao reagir ao comentário");
      }
    } catch (error) {
      console.error("Erro ao reagir ao comentário:", error);
      toast.error("Erro ao reagir ao comentário");
    }
  };

  const handleReplyClick = () => {
    if (onReplyClick) {
      onReplyClick(comment._id, authorName());
    }
  };

  // Filtrar respostas válidas - SEMPRE usar comment.replies primeiro (dados mais atualizados)
  // Se comment.replies não estiver disponível, usar localReplies como fallback
  const repliesToDisplay = comment.replies && Array.isArray(comment.replies)
    ? comment.replies.filter((reply) => reply && reply._id)
    : (localReplies && Array.isArray(localReplies) 
        ? localReplies.filter((reply) => reply && reply._id)
        : []);
  const validReplies = repliesToDisplay;
  const totalReplies = validReplies.length;

  // Determinar quais respostas mostrar
  const displayedReplies = showAllReplies
    ? validReplies
    : validReplies.slice(0, REPLIES_LIMIT);

  const hasMoreReplies = totalReplies > REPLIES_LIMIT;

  const authorAvatarUrl = authorAvatar();
  const authorNameStr = authorName();
  const authorSlug = comment.authorId.profile?.slug;
  const authorInitials = authorNameStr
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div
      className={`${isReply ? "mt-3 relative pl-8" : ""} ${
        isReplyingToThis
          ? "bg-blue-50 border-l-4 border-blue-500 pl-3 -ml-4 rounded-r transition-colors duration-200"
          : ""
      }`}
    >
      {/* Linha vertical apenas para respostas */}
      {isReply && (
        <div className="absolute -left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage
            src={authorAvatarUrl || "/placeholder/userplaceholder.svg"}
            alt={authorNameStr}
          />
          <AvatarFallback className="bg-black text-white text-xs">
            {authorInitials}
          </AvatarFallback>
        </Avatar>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Header: Nome, Seguidores, Timestamp, Menu */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {authorSlug ? (
                  <Link href={`/jobboard/${authorSlug}`}>
                    <h4 className="font-semibold text-sm text-blue-600 hover:underline leading-tight truncate cursor-pointer">
                      {authorNameStr}
                    </h4>
                  </Link>
                ) : (
                  <h4 className="font-semibold text-sm text-black leading-tight truncate">
                    {authorNameStr}
                  </h4>
                )}
              </div>
              {comment.followersCount !== undefined && (
                <p className="text-xs text-black leading-tight">
                  {formatFollowers(comment.followersCount)} seguidores
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-black">
                {formatTimeAgo(comment.createdAt)}
              </span>
              <button
                className="text-black hover:text-black p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Mais opções"
              >
                <LinkedInIcon id="overflow-web-ios-medium" size={16} />
              </button>
            </div>
          </div>

          {/* Conteúdo do comentário */}
          <p className="text-sm text-black leading-relaxed whitespace-pre-line mb-2">
            {renderContentWithMentions(comment.content)}
          </p>

          {/* Engagement Stats - Reações */}
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

            if (totalReactions > 0) {
              return (
                <div className="flex items-center gap-2 mb-2">
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
                  <span className="text-black font-normal text-xs">
                    {totalReactions}
                  </span>
                </div>
              );
            }
            return null;
          })()}

          {/* Botões de ação: Gostei e Responder */}
          <div className="flex items-center gap-1 mt-2">
            <ReactionButton
              postId={comment._id}
              currentReaction={currentReaction}
              reactionsCount={Object.values(reactionsCount).reduce(
                (a, b) => a + b,
                0
              )}
              onReaction={(commentId, reactionType) => {
                handleReaction(commentId, reactionType);
              }}
            />
            <div className="h-4 w-px bg-gray-300"></div>
            <button
              onClick={handleReplyClick}
              className="text-xs text-black hover:text-black font-medium"
              aria-label={`Responder a ${authorNameStr}`}
            >
              Responder
            </button>
          </div>

          {/* Respostas aninhadas */}
          {!isReply && (totalReplies > 0 || forceShowReplies) && (
            <>
              {/* Separador com contador de respostas - só mostrar se houver respostas */}
              {totalReplies > 0 && (
                <div className="mt-3 mb-2">
                  <button
                    onClick={() => {
                      setShowReplies(!showReplies);
                      if (!showReplies) {
                        setShowAllReplies(false);
                      }
                    }}
                    className="text-xs text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1 w-full"
                    aria-label={`${showReplies ? "Ocultar" : "Ver"} ${totalReplies} ${totalReplies === 1 ? "resposta" : "respostas"}`}
                  >
                    <span className="h-px bg-gray-300 flex-1"></span>
                    <span className="px-2 whitespace-nowrap">
                      {showReplies ? "Ocultar" : "Ver"} {totalReplies}{" "}
                      {totalReplies === 1 ? "resposta" : "respostas"}
                    </span>
                    <span className="h-px bg-gray-300 flex-1"></span>
                  </button>
                </div>
              )}

              {/* Container de respostas - mostrar se showReplies é true E há respostas */}
              {showReplies && totalReplies > 0 && (
                <div className="mt-2">
                  <div className="space-y-3">
                    {displayedReplies.map((reply) => (
                      <CommentItem
                        key={reply._id}
                        comment={reply}
                        postId={postId}
                        onReplyAdded={onReplyAdded}
                        onReplyClick={onReplyClick}
                        isReply={true}
                        replyingTo={replyingTo}
                        onCancelReply={onCancelReply}
                      />
                    ))}
                  </div>

                  {/* Botão Ver mais/Ver menos */}
                  {hasMoreReplies && (
                    <div className="mt-2">
                      <button
                        onClick={() => setShowAllReplies(!showAllReplies)}
                        className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                        aria-label={showAllReplies ? "Ver menos respostas" : `Ver mais ${totalReplies - REPLIES_LIMIT} respostas`}
                      >
                        {showAllReplies
                          ? "Ver menos"
                          : `Ver mais ${totalReplies - REPLIES_LIMIT} ${
                              totalReplies - REPLIES_LIMIT === 1
                                ? "resposta"
                                : "respostas"
                            }`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Respostas aninhadas para replies */}
          {isReply && totalReplies > 0 && (
            <>
              <div className="mt-2">
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                  aria-label={`${showReplies ? "Ocultar" : "Ver"} ${totalReplies} ${totalReplies === 1 ? "resposta" : "respostas"}`}
                >
                  {showReplies
                    ? `Ocultar ${totalReplies} ${
                        totalReplies === 1 ? "resposta" : "respostas"
                      }`
                    : `Ver ${totalReplies} ${
                        totalReplies === 1 ? "resposta" : "respostas"
                      }`}
                </button>
              </div>

              {showReplies && (
                <div className="mt-3">
                  <div className="space-y-3">
                    {displayedReplies.map((reply) => (
                      <CommentItem
                        key={reply._id}
                        comment={reply}
                        postId={postId}
                        onReplyAdded={onReplyAdded}
                        onReplyClick={onReplyClick}
                        isReply={true}
                        replyingTo={replyingTo}
                        onCancelReply={onCancelReply}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
