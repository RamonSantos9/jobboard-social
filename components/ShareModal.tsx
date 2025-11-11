"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LinkedInIcon from "./LinkedInIcon";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    _id: string;
    content?: string;
    authorId?: {
      _id: string;
      name: string;
      profile?: {
        firstName: string;
        lastName: string;
        photoUrl?: string;
      };
    };
    companyId?: {
      _id: string;
      name: string;
      logoUrl?: string;
    };
  };
}

export default function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);

  const handleShareAsNewPost = () => {
    router.push(`/feed?share=${post._id}`);
    onClose();
  };

  const handleSendMessage = () => {
    toast.info("Funcionalidade de mensagem em desenvolvimento");
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      const link = `${window.location.origin}/posts/${post._id}`;
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado para a área de transferência!");
      onClose();
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  const handleExternalShare = async () => {
    try {
      const link = `${window.location.origin}/posts/${post._id}`;
      const text = post.content
        ? `${post.content.substring(0, 100)}...`
        : "Confira este post";

      if (navigator.share) {
        await navigator.share({
          title: "Compartilhar post",
          text: text,
          url: link,
        });
        onClose();
      } else {
        // Fallback para copiar link
        await handleCopyLink();
      }
    } catch (error) {
      // Usuário cancelou ou erro
      if ((error as Error).name !== "AbortError") {
        toast.error("Erro ao compartilhar");
      }
    }
  };

  const authorName = post.companyId
    ? post.companyId.name
    : post.authorId?.profile
      ? `${post.authorId.profile.firstName} ${post.authorId.profile.lastName}`
      : post.authorId?.name || "Usuário";

  const authorAvatar = post.companyId
    ? post.companyId.logoUrl
    : post.authorId?.profile?.photoUrl;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Compartilhar publicação</DialogTitle>
              </DialogHeader>

              {/* Preview do post */}
              <div className="border border-gray-200 rounded-lg p-3 mb-4 bg-gray-50">
                <div className="flex gap-2 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={authorAvatar || "/placeholder/userplaceholder.svg"}
                      alt={authorName}
                    />
                    <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                      {authorName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {authorName}
                    </p>
                  </div>
                </div>
                {post.content && (
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {post.content}
                  </p>
                )}
              </div>

              {/* Opções de compartilhamento */}
              <div className="space-y-2">
                <Button
                  onClick={handleShareAsNewPost}
                  className="w-full justify-start gap-3 h-auto py-3"
                  variant="outline"
                >
                  <LinkedInIcon id="compose-small" size={20} />
                  <div className="flex-1 text-left">
                    <div className="font-medium">Compartilhar em nova publicação</div>
                    <div className="text-xs text-gray-500">
                      Compartilhar com seus comentários
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={handleSendMessage}
                  className="w-full justify-start gap-3 h-auto py-3"
                  variant="outline"
                >
                  <LinkedInIcon id="send-privately-small" size={20} />
                  <div className="flex-1 text-left">
                    <div className="font-medium">Enviar via mensagem</div>
                    <div className="text-xs text-gray-500">
                      Enviar para seus contatos
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={handleCopyLink}
                  className="w-full justify-start gap-3 h-auto py-3"
                  variant="outline"
                >
                  <LinkedInIcon id="link-medium" size={20} />
                  <div className="flex-1 text-left">
                    <div className="font-medium">Copiar link</div>
                    <div className="text-xs text-gray-500">
                      Copiar link da publicação
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={handleExternalShare}
                  className="w-full justify-start gap-3 h-auto py-3"
                  variant="outline"
                >
                  <LinkedInIcon id="repost-small" size={20} />
                  <div className="flex-1 text-left">
                    <div className="font-medium">Compartilhar externamente</div>
                    <div className="text-xs text-gray-500">
                      Compartilhar em outras plataformas
                    </div>
                  </div>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AnimatePresence>
  );
}

