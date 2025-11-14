"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import LinkedInIcon from "@/components/LinkedInIcon";
import PhotoEditModal from "@/components/PhotoEditModal";
import { toast } from "sonner";

interface ProfilePhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPhotoUrl?: string;
  onPhotoUpdate: (photoUrl: string) => void;
  onPhotoDelete?: () => void;
}

export default function ProfilePhotoModal({
  open,
  onOpenChange,
  currentPhotoUrl,
  onPhotoUpdate,
  onPhotoDelete,
}: ProfilePhotoModalProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Erro", {
        description: "Por favor, selecione um arquivo de imagem",
      });
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Erro", {
        description: "A imagem deve ter no máximo 10MB",
      });
      return;
    }

    // Criar URL local da imagem e abrir modal de edição diretamente
    const imageUrl = URL.createObjectURL(file);
    setPendingImageFile(file);
    setPendingImageUrl(imageUrl);
    setEditModalOpen(true);

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!onPhotoDelete) return;

    try {
      onPhotoDelete();
      toast.success("Sucesso", {
        description: "Foto excluída com sucesso!",
      });
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro", {
        description: error.message || "Erro ao excluir foto",
      });
    }
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
  };

  const photoUrl = currentPhotoUrl || "/placeholder/userplaceholder.svg";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white border-black/50">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-black">
              Foto do perfil
            </DialogTitle>
          </div>
        </DialogHeader>
        <Separator className="bg-black/10" />
        <div className="space-y-6 mt-6">
          {/* Foto Circular */}
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={photoUrl}
                alt="Foto do perfil"
                className="w-64 h-64 rounded-full object-cover border-4 border-black/10"
              />
            </div>
          </div>

          <Separator className="bg-black/10" />

          {/* Botões de Ação - Lado a lado */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex justify-between gap-4">
              <Button
                onClick={() => {
                  setEditModalOpen(true);
                }}
                variant="ghost"
                className="flex flex-col items-center gap-2 text-black p-4"
              >
                <LinkedInIcon
                  id="edit-medium"
                  size={24}
                  className="text-black"
                />
                <span className="text-sm">Editar</span>
              </Button>

              <Button
                onClick={handleUploadClick}
                variant="ghost"
                className="flex flex-col items-center gap-2 text-black p-4"
              >
                <LinkedInIcon
                  id="camera-medium"
                  size={24}
                  className="text-black"
                />
                <span className="text-sm">Atualizar foto</span>
              </Button>
            </div>
            <Button
              onClick={handleDeleteClick}
              variant="ghost"
              className="flex flex-col items-center gap-2 text-black p-4"
              disabled={!currentPhotoUrl}
            >
              <LinkedInIcon
                id="trash-medium"
                size={24}
                className="text-black"
              />
              <span className="text-sm">Excluir</span>
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </DialogContent>

      {/* Modal de Edição de Foto */}
      <PhotoEditModal
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          // Limpar URL do objeto quando fechar sem salvar
          if (!open && pendingImageUrl) {
            URL.revokeObjectURL(pendingImageUrl);
            setPendingImageUrl(null);
            setPendingImageFile(null);
          }
        }}
        imageUrl={
          pendingImageUrl ||
          currentPhotoUrl ||
          "/placeholder/userplaceholder.svg"
        }
        onSave={(editedImageUrl) => {
          onPhotoUpdate(editedImageUrl);
          setEditModalOpen(false);
          // Limpar arquivo pendente e URL
          if (pendingImageUrl) {
            URL.revokeObjectURL(pendingImageUrl);
            setPendingImageUrl(null);
            setPendingImageFile(null);
          }
        }}
      />

      {/* Alert Dialog - Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir foto de perfil</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir sua foto de perfil? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
