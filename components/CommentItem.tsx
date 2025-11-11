"use client";

import { useState, useEffect } from "react";
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
}

const REPLIES_LIMIT = 5;

export default function CommentItem({
  comment,
  postId,
  onReplyAdded,
  onReplyClick,
  isReply = false,
}: CommentItemProps) {
  const { data: session } = useSession();
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [showReplies, setShowReplies] = useState(false); // Estado para controlar visibilidade de respostas
  const [localReplies, setLocalReplies] = useState<Comment[]>(() => {
    // Inicializar com respostas válidas filtradas
    if (comment.replies && Array.isArray(comment.replies)) {
      return comment.replies.filter((reply) => reply && reply._id);
    }
    return [];
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

  // Atualizar localReplies quando comment.replies mudar
  useEffect(() => {
    if (comment.replies) {
      const filtered = comment.replies.filter((reply) => reply && reply._id);
      setLocalReplies(filtered);
    } else {
      setLocalReplies([]);
    }
  }, [comment.replies, comment._id]);

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
      // Adicionar texto antes da menção
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Adicionar link da menção
      const mentionName = match[1];
      parts.push(
        <Link
          key={`mention-${match.index}`}
          href={`/jobboard/${mentionName.toLowerCase()}`}
          className="text-blue-600 hover:underline"
        >
          @{mentionName}
        </Link>
      );

      lastIndex = match.index + match[0].length;
    }

    // Adicionar texto restante
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

  // Filtrar respostas válidas
  const validReplies = localReplies.filter((reply) => reply && reply._id);
  const totalReplies = validReplies.length;

  // Determinar quais respostas mostrar
  const displayedReplies = showAllReplies
    ? validReplies
    : validReplies.slice(0, REPLIES_LIMIT);

  const hasMoreReplies = totalReplies > REPLIES_LIMIT;

  return (
    <div className={isReply ? "mt-3 relative pl-8" : ""}>
      {/* Linha vertical apenas para respostas - mesma posição para todos os níveis */}
      {isReply && (
        <div className="absolute -left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
      )}
      {/* Todos os comentários secundários/terceirizados usam mesma indentação fixa */}
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage
            src={authorAvatar() || "/placeholder/userplaceholder.svg"}
            alt={authorName()}
          />
          <AvatarFallback className="bg-black text-white text-xs">
            {authorName()
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2)}
          </AvatarFallback>
        </Avatar>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 overflow-visible">
          {/* Header: Nome, Seguidores, Timestamp, Menu */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-black leading-tight truncate">
                  {authorName()}
                </h4>
              </div>
              {comment.followersCount !== undefined && (
                <p className="text-xs text-black leading-tight">
                  {formatFollowers(comment.followersCount)} seguidores
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
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
            <div className="h-4 w-px bg-black"></div>
            <button
              onClick={handleReplyClick}
              className="text-xs text-black hover:text-black font-medium"
            >
              Responder
            </button>
          </div>

          {/* Respostas aninhadas */}
          {!isReply && totalReplies > 0 && (
            <>
              {/* Separador com contador de respostas */}
              <div className="mt-3 mb-2">
                <button
                  onClick={() => {
                    setShowReplies(!showReplies);
                    if (!showReplies) {
                      setShowAllReplies(false); // Resetar para mostrar apenas 5 inicialmente
                    }
                  }}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1 w-full"
                >
                  <span className="h-px bg-gray-300 flex-1"></span>
                  <span className="px-2 whitespace-nowrap">
                    Ver todos os comentários {totalReplies}{" "}
                    {totalReplies === 1 ? "resposta" : "respostas"}
                  </span>
                  <span className="h-px bg-gray-300 flex-1"></span>
                </button>
              </div>

              {/* Container de respostas - só mostra se showReplies for true */}
              {showReplies && (
                <div className="mt-2">
                  {/* Lista de respostas - todas com mesma indentação fixa (pl-8 já aplicado no wrapper principal) */}
                  <div className="space-y-3">
                    {displayedReplies.map((reply) => (
                      <CommentItem
                        key={reply._id}
                        comment={reply}
                        postId={postId}
                        onReplyAdded={onReplyAdded}
                        isReply={true}
                      />
                    ))}
                  </div>

                  {/* Botão Ver mais/Ver menos */}
                  {hasMoreReplies && (
                    <div className="mt-2">
                      <button
                        onClick={() => setShowAllReplies(!showAllReplies)}
                        className="text-xs text-gray-600 hover:text-gray-800 font-medium"
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

          {/* Respostas aninhadas para replies - SEM indentação adicional para evitar escada */}
          {isReply && totalReplies > 0 && (
            <>
              {/* Botão para mostrar respostas */}
              <div className="mt-2">
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium"
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

              {/* Container de respostas - SEM pl-8 adicional para manter mesmo eixo (já estamos dentro de uma resposta) */}
              {showReplies && (
                <div className="mt-3">
                  <div className="space-y-3">
                    {displayedReplies.map((reply) => (
                      <CommentItem
                        key={reply._id}
                        comment={reply}
                        postId={postId}
                        onReplyAdded={onReplyAdded}
                        isReply={true}
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
