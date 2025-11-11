"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import LinkedInIcon from "./LinkedInIcon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PostDropdownMenuProps {
  postId: string;
  isOwner: boolean;
  postAuthorId: string;
  postAuthorName: string;
  isCompanyPost: boolean;
  companyName?: string;
  companyId?: string;
  isHighlighted?: boolean;
  onClose: () => void;
  onDelete?: (postId: string) => void;
  onHighlightChange?: (postId: string, isHighlighted: boolean) => void;
}

export default function PostDropdownMenu({
  postId,
  isOwner,
  postAuthorId,
  postAuthorName,
  isCompanyPost,
  companyName,
  companyId,
  isHighlighted = false,
  onClose,
  onDelete,
  onHighlightChange,
}: PostDropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [onClose]);

  const handleSave = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const response = await fetch(`/api/posts/${postId}/save`, {
          method: "POST",
        });
        if (response.ok) {
          toast.success("Post salvo com sucesso");
        } else {
          toast.error("Erro ao salvar post");
        }
      } catch (error) {
        console.error("Erro ao salvar post:", error);
        toast.error("Erro ao salvar post");
      }
      onClose();
    },
    [postId, onClose]
  );

  const handleCopyLink = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const url = `${window.location.origin}/feed/post/${postId}`;
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
        onClose();
      } catch (error) {
        console.error("Erro ao copiar link:", error);
        toast.error("Erro ao copiar link");
      }
    },
    [postId, onClose]
  );

  const handleEmbed = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const embedCode = `<iframe src="${window.location.origin}/feed/post/${postId}" width="600" height="400" frameborder="0"></iframe>`;
      navigator.clipboard.writeText(embedCode).then(() => {
        toast.success("Código de incorporação copiado!");
      }).catch(() => {
        toast.error("Erro ao copiar código");
      });
      onClose();
    },
    [postId, onClose]
  );

  const handleHide = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const response = await fetch(`/api/posts/${postId}/hide`, {
          method: "POST",
        });
        if (response.ok) {
          toast.success("Post oculto do feed");
        } else {
          toast.error("Erro ao ocultar post");
        }
      } catch (error) {
        console.error("Erro ao ocultar post:", error);
        toast.error("Erro ao ocultar post");
      }
      onClose();
    },
    [postId, onClose]
  );

  const handleWhyAd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      window.open(
        "https://www.linkedin.com/help/jobboard/answer/a523141/pt-br",
        "_blank"
      );
      onClose();
    },
    [onClose]
  );

  const handleReport = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowReportDialog(true);
    },
    []
  );

  const handleReportConfirm = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "inappropriate",
          description: "Post denunciado pelo usuário",
        }),
      });
      if (response.ok) {
        toast.success("Post denunciado com sucesso. Nossa equipe irá revisar.");
      } else {
        toast.error("Erro ao denunciar post");
      }
    } catch (error) {
      console.error("Erro ao denunciar post:", error);
      toast.error("Erro ao denunciar post");
    }
    setShowReportDialog(false);
    onClose();
  }, [postId, onClose]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (onDelete) {
      onDelete(postId);
      setShowDeleteDialog(false);
      onClose();
    }
  }, [onDelete, postId, onClose]);

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toast.info("Funcionalidade de edição em desenvolvimento");
      onClose();
    },
    [onClose]
  );

  const handleHighlight = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const response = await fetch(`/api/posts/${postId}/highlight`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            highlight: !isHighlighted,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          if (onHighlightChange) {
            onHighlightChange(postId, data.isHighlighted);
          }
          toast.success(
            data.isHighlighted
              ? "Post destacado com sucesso"
              : "Destaque removido com sucesso"
          );
        } else {
          toast.error("Erro ao alterar destaque do post");
        }
      } catch (error) {
        console.error("Erro ao destacar post:", error);
        toast.error("Erro ao destacar post");
      }
      onClose();
    },
    [postId, isHighlighted, onHighlightChange, onClose]
  );

  const handleWhoCanComment = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      window.open(
        "https://www.linkedin.com/help/jobboard/answer/a523141/pt-br",
        "_blank"
      );
      onClose();
    },
    [onClose]
  );

  const handleWhoCanSee = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      window.open(
        "https://www.linkedin.com/help/jobboard/answer/a523141/pt-br",
        "_blank"
      );
      onClose();
    },
    [onClose]
  );

  const handleUnfollow = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const targetId = isCompanyPost ? companyId : postAuthorId;
        const type = isCompanyPost ? "company" : "user";
        
        if (!targetId) {
          toast.error("Erro ao identificar o alvo para deixar de seguir");
          return;
        }

        const response = await fetch(`/api/follow/${targetId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type }),
        });

        if (response.ok) {
          const data = await response.json();
          toast.success(
            data.isFollowing
              ? `Seguindo ${isCompanyPost ? companyName : postAuthorName}`
              : `Deixou de seguir ${isCompanyPost ? companyName : postAuthorName}`
          );
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || "Erro ao deixar de seguir");
        }
      } catch (error) {
        console.error("Erro ao deixar de seguir:", error);
        toast.error("Erro ao deixar de seguir");
      }
      onClose();
    },
    [isCompanyPost, companyId, postAuthorId, companyName, postAuthorName, onClose]
  );

  // Menu do dono do post
  if (isOwner) {
    return (
      <>
        <div
          ref={menuRef}
          className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[280px] max-w-[320px] py-1"
        >
          {isHighlighted && (
            <button
              onClick={handleHighlight}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
            >
              <LinkedInIcon
                id="star-fill-medium"
                size={20}
                className="text-yellow-500"
                fill="#eab308"
              />
              <span className="whitespace-nowrap">Remover dos destaques</span>
            </button>
          )}
          <button
            onClick={handleSave}
            type="button"
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
          >
            <LinkedInIcon
              id="bookmark-outline-medium"
              size={20}
              className="text-black"
              fill="black"
            />
            <span className="whitespace-nowrap">Salvar publicação</span>
          </button>
          <button
            onClick={handleCopyLink}
            type="button"
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
          >
            <LinkedInIcon
              id="link-medium"
              size={20}
              className="text-black"
              fill="black"
            />
            <span className="whitespace-nowrap">Copiar link da publicação</span>
          </button>
          <button
            onClick={handleEdit}
            type="button"
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
          >
            <LinkedInIcon
              id="edit-small"
              size={20}
              className="text-black"
              fill="black"
            />
            <span className="whitespace-nowrap">Editar publicação</span>
          </button>
          <button
            onClick={handleWhoCanComment}
            type="button"
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
          >
            <LinkedInIcon
              id="comment-medium"
              size={20}
              className="text-black"
              fill="black"
            />
            <span className="whitespace-nowrap">
              Quem pode comentar esta publicação?
            </span>
          </button>
          <button
            onClick={handleWhoCanSee}
            type="button"
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
          >
            <LinkedInIcon
              id="eye-medium"
              size={20}
              className="text-black"
              fill="black"
            />
            <span className="whitespace-nowrap">
              Quem pode ver esta publicação?
            </span>
          </button>
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left border-t border-gray-200 mt-1"
            >
              <LinkedInIcon
                id="clear-medium"
                size={20}
                className="text-red-600"
                fill="#dc2626"
              />
              <span className="whitespace-nowrap">Excluir publicação</span>
            </button>
          )}
        </div>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir publicação</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir esta publicação? Esta ação não pode
                ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Menu para outros usuários
  return (
    <>
      <div
        ref={menuRef}
        className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[280px] max-w-[320px] py-1"
      >
        <button
          onClick={handleSave}
          type="button"
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
        >
          <LinkedInIcon
            id="bookmark-outline-medium"
            size={20}
            className="text-black"
            fill="black"
          />
          <span className="whitespace-nowrap">Salvar publicação</span>
        </button>
        <button
          onClick={handleCopyLink}
          type="button"
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
        >
          <LinkedInIcon
            id="link-medium"
            size={20}
            className="text-black"
            fill="black"
          />
          <span className="whitespace-nowrap">Copiar link da publicação</span>
        </button>
        <button
          onClick={handleEmbed}
          type="button"
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
        >
          <LinkedInIcon
            id="embed-medium"
            size={20}
            className="text-black"
            fill="black"
          />
          <span className="whitespace-nowrap">Incorporar publicação</span>
        </button>
        <button
          onClick={handleHide}
          type="button"
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
        >
          <LinkedInIcon
            id="visibility-off-medium"
            size={20}
            className="text-black"
            fill="black"
          />
          <span className="whitespace-nowrap">Ocultar publicação</span>
        </button>
        <button
          onClick={handleWhyAd}
          type="button"
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
        >
          <LinkedInIcon
            id="report-medium"
            size={20}
            className="text-black"
            fill="black"
          />
          <span className="whitespace-nowrap">
            Por que estou vendo este anúncio?
          </span>
        </button>
        <button
          onClick={handleUnfollow}
          type="button"
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
        >
          <LinkedInIcon
            id="clear-medium"
            size={20}
            className="text-black"
            fill="black"
          />
          <span className="whitespace-nowrap">
            Parar de seguir {isCompanyPost ? companyName : postAuthorName}
          </span>
        </button>
        <button
          onClick={handleReport}
          type="button"
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left border-t border-gray-200 mt-1"
        >
          <LinkedInIcon
            id="report-medium"
            size={20}
            className="text-black"
            fill="black"
          />
          <span className="whitespace-nowrap">Denunciar publicação</span>
        </button>
      </div>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denunciar publicação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja denunciar esta publicação? Nossa equipe irá
              revisar o conteúdo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReportDialog(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReportConfirm}>
              Denunciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
