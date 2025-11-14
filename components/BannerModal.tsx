"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Separator } from "./ui/separator";
import LinkedInIcon from "./LinkedInIcon";

interface BannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBannerUrl?: string;
  onBannerUpdate: (bannerUrl: string) => void;
}

// Imagens pré-definidas para seleção (usando Unsplash com alta qualidade)
// Tamanho recomendado: 300x84, mas usando 1200x336 para melhor qualidade
const predefinedBanners = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=336&fit=crop&q=90&auto=format",
    alt: "Praia com ondas",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=336&fit=crop&q=90&auto=format",
    alt: "Casa moderna sobre água",
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=336&fit=crop&q=90&auto=format",
    alt: "Campo de flores",
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=336&fit=crop&q=90&auto=format",
    alt: "Pôr do sol no litoral",
  },
  {
    id: "5",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=336&fit=crop&q=90&auto=format",
    alt: "Paisagem de montanhas",
  },
];

export default function BannerModal({
  open,
  onOpenChange,
  currentBannerUrl,
  onBannerUpdate,
}: BannerModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      setSelectedImage(data.url);
      toast.success("Sucesso", {
        description: "Imagem carregada com sucesso!",
      });
    } catch (error: any) {
      toast.error("Erro", {
        description: error.message || "Erro ao fazer upload da imagem",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const bannerUrl = selectedImage || currentBannerUrl;
    if (!bannerUrl) {
      toast.error("Erro", {
        description: "Por favor, selecione ou carregue uma imagem",
      });
      return;
    }

    try {
      const response = await fetch("/api/profile/banner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bannerUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar banner");
      }

      onBannerUpdate(bannerUrl);
      onOpenChange(false);
      setSelectedImage(null);
      toast.success("Sucesso", {
        description: "Banner atualizado com sucesso!",
      });
    } catch (error: any) {
      toast.error("Erro", {
        description: error.message || "Erro ao salvar banner",
      });
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedImage(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-left">
            Adicionar imagem de capa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Seção Carregar foto */}
          <div className="space-y-3">
            <p className="text-sm text-black">
              Destaque sua personalidade, seus interesses, seu trabalho ou
              momentos em equipe
            </p>
            <Button
              onClick={handleUploadClick}
              disabled={uploading}
              className="flex items-center justify-center rounded-full bg-white border border-black text-black"
              variant="outline"
            >
              <LinkedInIcon id="camera-medium" size={16} className="mr-2" />
              {uploading ? "Carregando..." : "Carregar foto"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <Separator className="my-4" />

          {/* Seção Selecionar imagem */}
          <div className="space-y-3">
            <p className="text-xs text-black">Fornecida por Lummi.ai</p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {predefinedBanners.map((banner) => {
                const isSelected =
                  selectedImage === banner.url ||
                  (!selectedImage &&
                    currentBannerUrl === banner.url &&
                    predefinedBanners.some((b) => b.url === currentBannerUrl));

                const handleSelect = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedImage(banner.url);
                };

                return (
                  <div
                    key={banner.id}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition-colors ${
                      isSelected
                        ? "border-black"
                        : "border-transparent hover:border-black/50"
                    }`}
                    onClick={handleSelect}
                  >
                    <input
                      type="radio"
                      name="banner"
                      value={banner.id}
                      checked={isSelected}
                      onChange={() => setSelectedImage(banner.url)}
                      onClick={handleSelect}
                      className="w-4 h-4 text-black focus:ring-2 focus:ring-black cursor-pointer shrink-0"
                    />
                    <img
                      src={banner.url}
                      alt={banner.alt}
                      className="w-[300px] h-[84px] object-cover rounded border border-black/50 cursor-pointer"
                      onClick={handleSelect}
                      loading="lazy"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview da imagem selecionada (se for upload) */}
          {selectedImage &&
            !predefinedBanners.some((b) => b.url === selectedImage) && (
              <div className="space-y-2">
                <p className="text-xs text-black">Imagem selecionada:</p>
                <div className="relative">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-full h-[200px] object-cover rounded"
                  />
                </div>
              </div>
            )}

          {/* Rodapé informativo */}
          <p className="text-xs text-black">
            Uma imagem de capa pode ajudar você a se destacar.{" "}
            <a
              href="#"
              className="text-black hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // Aqui você pode adicionar um link para mais informações
              }}
            >
              Saiba mais
            </a>
          </p>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button
            onClick={handleSave}
            className="bg-black hover:bg-black/80 text-white px-6"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
