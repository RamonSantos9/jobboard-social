"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  currentImage?: string;
  label?: string;
  maxSize?: number; // em MB
  aspectRatio?: "square" | "banner";
}

export default function ImageUpload({
  onUploadComplete,
  currentImage,
  label = "Foto de Perfil",
  maxSize = 5,
  aspectRatio = "square",
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Erro", {
        description: "Por favor, selecione uma imagem válida",
      });
      return;
    }

    // Validar tamanho
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error("Erro", {
        description: `A imagem deve ter no máximo ${maxSize}MB`,
      });
      return;
    }

    // Preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload para Cloudinary
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "jobboard_social");

      const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudinaryCloudName) {
        throw new Error("Cloudinary não configurado");
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Falha no upload");
      }

      const data = await response.json();
      onUploadComplete(data.secure_url);
      toast.success("Sucesso", {
        description: "Imagem enviada com sucesso!",
      });
    } catch (error) {
      toast.error("Erro", {
        description: "Erro ao enviar imagem",
      });
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="flex items-center gap-4">
        {/* Preview */}
        <div
          className={`relative ${
            aspectRatio === "square"
              ? "w-24 h-24 rounded-full"
              : "w-48 h-24 rounded-lg"
          } bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden`}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {!uploading && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </>
          ) : (
            <ImageIcon className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading
              ? "Enviando..."
              : preview
              ? "Trocar Imagem"
              : "Enviar Imagem"}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG ou GIF. Máx {maxSize}MB
          </p>
        </div>
      </div>
    </div>
  );
}



