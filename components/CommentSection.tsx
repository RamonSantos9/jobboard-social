"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Smile, Image as ImageIcon } from "lucide-react";
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
  const replyInputRef = useRef<HTMLInputElement>(null);

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
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

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
    // Preencher automaticamente com menção
    setReplyContent(`@${authorName} `);
  };

  // Focar no campo de resposta quando aparecer
  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus();
      // Colocar cursor no final do texto
      const length = replyInputRef.current.value.length;
      replyInputRef.current.setSelectionRange(length, length);
    }
  }, [replyingTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && !isSubmitting) {
      setIsSubmitting(true);

      try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: comment }),
        });

        const data = await response.json();

        if (response.ok) {
          setComment("");
          onAddComment?.(comment);
          toast.success("Comentário adicionado com sucesso!");
          // Recarregar comentários
          fetchComments();
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
          setReplyContent("");
          setReplyingTo(null);
          toast.success("Resposta adicionada com sucesso!");
          // Recarregar comentários
          fetchComments();
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

  return (
    <div className="pt-3">
      {/* Campo de comentário principal - Entre botões de ações e lista de comentários */}
      <form onSubmit={handleSubmit} className="flex items-start gap-2 mb-4">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src="/placeholder/userplaceholder.svg" />
          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 relative">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              isSubmitting
                ? "Enviando comentário..."
                : "Adicionar comentário..."
            }
            disabled={isSubmitting}
            className="w-full px-3 py-2 pr-24 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddEmoji}
              className="w-6 h-6 p-0 text-gray-500 hover:text-gray-700 flex items-center justify-center"
            >
              <Smile className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleAddImage}
              className="w-6 h-6 p-0 text-gray-500 hover:text-gray-700 flex items-center justify-center"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={!comment.trim() || isSubmitting}
              className="px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publicar
            </button>
          </div>
        </div>
      </form>

      {/* Lista de comentários existentes */}
      {loading ? (
        <div className="py-4 text-center text-sm text-gray-500">
          Carregando comentários...
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postId={postId}
              onReplyAdded={fetchComments}
              onReplyClick={handleReplyClick}
            />
          ))}
        </div>
      ) : null}

      {/* Campo de resposta - Só aparece quando replyingTo não é null */}
      {replyingTo && (
        <form
          onSubmit={handleReplySubmit}
          className="flex items-start gap-2 mt-3"
        >
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src="/placeholder/userplaceholder.svg" />
            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 relative">
            <input
              ref={replyInputRef}
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={
                isSubmittingReply
                  ? "Enviando resposta..."
                  : `Responder a ${replyingTo.authorName}...`
              }
              disabled={isSubmittingReply}
              className="w-full px-3 py-2 pr-24 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            />

            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddEmoji}
                className="w-6 h-6 p-0 text-gray-500 hover:text-gray-700 flex items-center justify-center"
              >
                <Smile className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleAddImage}
                className="w-6 h-6 p-0 text-gray-500 hover:text-gray-700 flex items-center justify-center"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!replyContent.trim() || isSubmittingReply}
                className="px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Responder
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
