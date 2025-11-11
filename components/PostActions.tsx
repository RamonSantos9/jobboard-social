"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  Send,
  MoreHorizontal,
  Star,
  Bookmark,
  Link,
  Edit,
  Trash2,
  MessageSquare,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface PostActionsProps {
  postId: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSend?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRemoveFromHighlights?: () => void;
  onSave?: () => void;
  onCopyLink?: () => void;
  onWhoCanComment?: () => void;
  onWhoCanSee?: () => void;
}

export default function PostActions({
  postId,
  likes,
  comments,
  shares,
  isLiked = false,
  onLike,
  onComment,
  onShare,
  onSend,
  onEdit,
  onDelete,
  onRemoveFromHighlights,
  onSave,
  onCopyLink,
  onWhoCanComment,
  onWhoCanSee,
}: PostActionsProps) {

  const handleLike = () => {
    onLike?.();
  };

  const handleShare = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Post compartilhado com sucesso!");
      } else {
        toast.error(data.error || "Erro ao compartilhar post");
      }
    } catch (error) {
      console.error("Error sharing post:", error);
      toast.error("Erro ao compartilhar post");
    }
    onShare?.();
  };

  const handleSave = async () => {
    try {
      // Implementar funcionalidade de salvar post
      toast.success("Post salvo com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar post");
    }
    onSave?.();
  };

  const handleRemoveFromHighlights = async () => {
    try {
      // Implementar funcionalidade de remover dos destaques
      toast.success("Post removido dos destaques!");
    } catch (error) {
      toast.error("Erro ao remover dos destaques");
    }
    onRemoveFromHighlights?.();
  };

  const handleEdit = () => {
    // Implementar funcionalidade de editar post
    toast.info("Funcionalidade de edição em desenvolvimento");
    onEdit?.();
  };

  const handleWhoCanComment = () => {
    // Implementar funcionalidade de quem pode comentar
    toast.info("Funcionalidade de privacidade em desenvolvimento");
    onWhoCanComment?.();
  };

  const handleWhoCanSee = () => {
    // Implementar funcionalidade de quem pode ver
    toast.info("Funcionalidade de privacidade em desenvolvimento");
    onWhoCanSee?.();
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(postUrl);
    toast.success("Link copiado para a área de transferência!");
    onCopyLink?.();
  };

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex items-center space-x-2 ${
              isLiked ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Gostei</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onComment}
            className="flex items-center space-x-2 text-gray-600"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comentar</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="flex items-center space-x-2 text-gray-600"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartilhar</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSend}
            className="flex items-center space-x-2 text-gray-600"
          >
            <Send className="w-4 h-4" />
            <span>Enviar</span>
          </Button>
        </div>

        {/* Three Dots Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-gray-600">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleRemoveFromHighlights}>
              <Star className="w-4 h-4 mr-2" />
              <div>
                <div className="font-medium">Remover dos destaques</div>
                <div className="text-xs text-gray-500">
                  Sua publicação original não será excluída
                </div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleSave}>
              <Bookmark className="w-4 h-4 mr-2" />
              Salvar
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleCopyLink}>
              <Link className="w-4 h-4 mr-2" />
              Copiar link da publicação
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar publicação
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir publicação
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleWhoCanComment}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Quem pode comentar esta publicação?
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleWhoCanSee}>
              <Eye className="w-4 h-4 mr-2" />
              Quem pode ver esta publicação?
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{likes} curtidas</span>
          <span>{comments} comentários</span>
          <span>{shares} compartilhamentos</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>125 impressões</span>
          <Button variant="link" size="sm" className="text-blue-600 p-0 h-auto">
            Visualizar análise
          </Button>
        </div>
      </div>
    </div>
  );
}
