"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Smile, Image as ImageIcon, Send, X } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import CommentItem from "./CommentItem";
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

interface CommentSectionProps {
  postId: string;
  isExpanded?: boolean;
  onAddComment?: (comment: string) => void;
  onAddEmoji?: () => void;
  onAddImage?: () => void;
}

export default function CommentSection({
  postId,
  isExpanded = false,
  onAddComment,
  onAddEmoji,
  onAddImage,
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [comment, setComment] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    authorName: string;
  } | null>(null);
  // Rastrear quais comentários devem ter respostas visíveis
  const [commentsWithVisibleReplies, setCommentsWithVisibleReplies] = useState<
    Set<string>
  >(new Set());
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const replyFieldRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const newCommentRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea de comentário
  useEffect(() => {
    const textarea = commentTextareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [comment]);

  // Auto-resize textarea de resposta
  useEffect(() => {
    const textarea = replyTextareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  }, [replyContent]);

  // Quando replyingTo é definido, preencher menção e focar no campo
  useEffect(() => {
    if (replyingTo && replyTextareaRef.current) {
      setReplyContent(`@${replyingTo.authorName} `);
      // Scroll até o campo de resposta após um pequeno delay para garantir que está renderizado
      setTimeout(() => {
        replyFieldRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
        setTimeout(() => {
          replyTextareaRef.current?.focus();
          const length = replyTextareaRef.current?.value.length || 0;
          replyTextareaRef.current?.setSelectionRange(length, length);
        }, 100);
      }, 150);
    } else if (!replyingTo) {
      setReplyContent("");
    }
  }, [replyingTo]);

  useEffect(() => {
    if (isExpanded) {
      fetchComments();
    }
  }, [isExpanded, postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      const data = await response.json();

      if (response.ok) {
        const newComments = data.comments || [];
        console.log(
          `Comentários carregados: ${newComments.length} comentário(s)`
        );

        // Log para debug: verificar respostas de cada comentário
        newComments.forEach((comment: Comment) => {
          if (comment.replies && comment.replies.length > 0) {
            console.log(
              `Comentário ${comment._id}: ${comment.replies.length} resposta(s) encontrada(s)`
            );
          }
        });

        setComments(newComments);

        // Manter comentários com respostas marcados para exibir respostas
        // IMPORTANTE: Preservar TODOS os IDs que estavam no Set antes
        // Isso garante que após recarregar, os comentários que tinham respostas visíveis continuem visíveis
        setCommentsWithVisibleReplies((prev) => {
          const newSet = new Set<string>();
          // Preservar todos os IDs que estavam marcados antes (se o comentário ainda existe)
          prev.forEach((commentId) => {
            const commentExists = newComments.some(
              (c: Comment) => c._id === commentId
            );
            if (commentExists) {
              newSet.add(commentId);
              console.log(
                `Preservando comentário ${commentId} no Set de comentários com respostas visíveis`
              );
            }
          });
          console.log(
            `Set atualizado: ${
              Array.from(newSet).length
            } comentário(s) com respostas visíveis`
          );
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Scroll para novo comentário após adicionar
  useEffect(() => {
    if (newCommentRef.current && comments.length > 0) {
      setTimeout(() => {
        newCommentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [comments.length]);

  const handleAddEmoji = () => {
    toast.info("Funcionalidade de emoji em desenvolvimento");
    onAddEmoji?.();
  };

  const handleAddImage = () => {
    toast.info("Funcionalidade de imagem em desenvolvimento");
    onAddImage?.();
  };

  const handleReplyClick = (commentId: string, authorName: string) => {
    setReplyingTo({ commentId, authorName });
    // Marcar o comentário para exibir respostas quando o usuário clicar em "Responder"
    setCommentsWithVisibleReplies((prev) => new Set(prev).add(commentId));
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && !isSubmitting) {
      setIsSubmitting(true);
      const commentContent = comment;

      try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: commentContent }),
        });

        const data = await response.json();

        if (response.ok) {
          setComment("");
          onAddComment?.(commentContent);
          toast.success("Comentário adicionado com sucesso!");
          
          // Registrar interação de comentário
          if (session?.user) {
            fetch("/api/interactions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                itemType: "post",
                itemId: postId,
                interactionType: "comment",
              }),
            }).catch(() => {});
          }
          
          await fetchComments();
          setTimeout(() => {
            commentsEndRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }, 200);
        } else {
          toast.error(data.error || "Erro ao adicionar comentário");
        }
      } catch (error) {
        console.error("Error adding comment:", error);
        toast.error("Erro ao adicionar comentário");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim() && !isSubmittingReply && replyingTo) {
      setIsSubmittingReply(true);

      try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: replyContent,
            parentCommentId: replyingTo.commentId,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          const repliedCommentId = replyingTo.commentId;
          setReplyContent("");

          // Marcar o comentário para exibir respostas ANTES de recarregar
          // Isso garante que quando os componentes forem recriados, forceShowReplies será true
          setCommentsWithVisibleReplies((prev) => {
            const newSet = new Set(prev);
            newSet.add(repliedCommentId);
            return newSet;
          });

          // Pequeno delay para garantir que o backend processou
          await new Promise((resolve) => setTimeout(resolve, 800));

          // Recarregar comentários para mostrar a nova resposta
          // O Set já está atualizado, então os componentes recriados terão forceShowReplies=true
          await fetchComments();

          // Manter replyingTo temporariamente para garantir que as respostas sejam mostradas
          // Será limpo após um pequeno delay, mas manteremos o comentário marcado para exibir respostas
          setTimeout(() => {
            setReplyingTo(null);
            toast.success("Resposta adicionada com sucesso!");
          }, 100);

          // Scroll até o final dos comentários após atualizar
          setTimeout(() => {
            commentsEndRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }, 200);
        } else {
          toast.error(data.error || "Erro ao adicionar resposta");
        }
      } catch (error) {
        console.error("Error adding reply:", error);
        toast.error("Erro ao adicionar resposta");
      } finally {
        setIsSubmittingReply(false);
      }
    }
  };

  if (!isExpanded) {
    return null;
  }

  const authorAvatar = undefined;
  const authorInitials = session?.user?.name?.[0]?.toUpperCase() || "U";

  return (
    <div className="relative pt-3 border-t border-gray-200">
      {/* Campo de comentário principal - Oculto quando replyingTo está ativo */}
      {!replyingTo && (
        <form
          onSubmit={handleSubmit}
          className="flex items-start gap-2 mb-3"
          aria-label="Adicionar comentário"
        >
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage
              src={authorAvatar || "/placeholder/userplaceholder.svg"}
            />
            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
              {authorInitials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="relative">
              <textarea
                ref={commentTextareaRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  isSubmitting
                    ? "Enviando comentário..."
                    : "Adicionar comentário..."
                }
                disabled={isSubmitting}
                rows={1}
                className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm resize-none overflow-hidden min-h-[36px] max-h-[120px] leading-[20px]"
                aria-label="Campo de comentário"
                style={{ paddingTop: "8px", paddingBottom: "8px" }}
              />

              <div className="absolute right-2 inset-y-0 flex items-center gap-1.5 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAddEmoji}
                    className="flex items-center justify-center w-6 h-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    aria-label="Adicionar emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="flex items-center justify-center w-6 h-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    aria-label="Adicionar imagem"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  <button
                    type="submit"
                    disabled={!comment.trim() || isSubmitting}
                    className="flex items-center justify-center px-3 h-8 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Publicar comentário"
                  >
                    {isSubmitting ? "Enviando..." : "Publicar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Lista de comentários existentes */}
      {loading ? (
        <div className="py-4 text-center" role="status" aria-live="polite">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-500">
            Carregando comentários...
          </p>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment, index) => (
            <div
              key={comment._id}
              ref={index === comments.length - 1 ? newCommentRef : undefined}
            >
              <CommentItem
                comment={comment}
                postId={postId}
                onReplyAdded={fetchComments}
                onReplyClick={handleReplyClick}
                replyingTo={replyingTo}
                onCancelReply={handleCancelReply}
                forceShowReplies={commentsWithVisibleReplies.has(comment._id)}
              />
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-sm text-gray-500">Seja o primeiro a comentar!</p>
        </div>
      )}

      {/* Campo de resposta fixo na parte inferior */}
      {replyingTo && (
        <div
          ref={replyFieldRef}
          className="sticky bottom-0 bg-white border-t border-gray-200 pt-3 pb-3 mt-3 -mx-4 px-4 z-10"
        >
          <form
            onSubmit={handleReplySubmit}
            className="flex items-start gap-2"
            aria-label={`Responder a ${replyingTo.authorName}`}
          >
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage
                src={authorAvatar || "/placeholder/userplaceholder.svg"}
              />
              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                {authorInitials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="relative">
                <textarea
                  ref={replyTextareaRef}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Respondendo a ${replyingTo.authorName}...`}
                  disabled={isSubmittingReply}
                  rows={1}
                  className="w-full px-3 py-2 pr-24 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm resize-none overflow-hidden min-h-[36px] max-h-[100px] leading-[20px]"
                  aria-label="Campo de resposta"
                  style={{ paddingTop: "8px", paddingBottom: "8px" }}
                />

                <div className="absolute right-2 inset-y-0 flex items-center gap-1.5 pointer-events-none">
                  <div className="pointer-events-auto flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCancelReply}
                      className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Cancelar resposta"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <button
                      type="submit"
                      disabled={!replyContent.trim() || isSubmittingReply}
                      className="flex items-center justify-center px-3 h-8 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Enviar resposta"
                    >
                      {isSubmittingReply ? "Enviando..." : "Responder"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
