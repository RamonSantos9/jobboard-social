"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Smile, Image as ImageIcon } from "lucide-react";
import { useToast } from "./ToastProvider";

interface CommentSectionProps {
  postId: string;
  onAddComment?: (comment: string) => void;
  onAddEmoji?: () => void;
  onAddImage?: () => void;
}

export default function CommentSection({
  postId,
  onAddComment,
  onAddEmoji,
  onAddImage,
}: CommentSectionProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAddEmoji = () => {
    // Implementar funcionalidade de adicionar emoji
    toast({
      type: "info",
      message: "Funcionalidade de emoji em desenvolvimento",
    });
    onAddEmoji?.();
  };

  const handleAddImage = () => {
    // Implementar funcionalidade de adicionar imagem
    toast({
      type: "info",
      message: "Funcionalidade de imagem em desenvolvimento",
    });
    onAddImage?.();
  };

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
          toast({
            type: "success",
            message: "Comentário adicionado com sucesso!",
          });
        } else {
          toast({
            type: "error",
            message: data.error || "Erro ao adicionar comentário",
          });
        }
      } catch (error) {
        console.error("Error adding comment:", error);
        toast({
          type: "error",
          message: "Erro ao adicionar comentário",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="pt-1">
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src="/placeholder-avatar.svg" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>

        <div className="flex-1 relative">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              isSubmitting ? "Enviando comentário..." : "Adicionar comentário"
            }
            disabled={isSubmitting}
            className="w-full px-3 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddEmoji}
              className="w-6 h-6 p-0 text-gray-500 hover:text-gray-700"
            >
              <Smile className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddImage}
              className="w-6 h-6 p-0 text-gray-500 hover:text-gray-700"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
