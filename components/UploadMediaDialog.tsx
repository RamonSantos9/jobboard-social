"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { uploadImage, validateImageFile } from "@/lib/cloudinary";
import { Image, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface UploadMediaDialogProps {
  onUploadComplete: (url: string) => void;
  children: React.ReactNode;
}

export default function UploadMediaDialog({
  onUploadComplete,
  children,
}: UploadMediaDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      toast.error("Arquivo inválido. Use JPG, PNG, GIF ou WebP (máx. 10MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadImage(file);

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        onUploadComplete(result.secure_url);
        setOpen(false);
        setPreview(null);
        setProgress(0);
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        toast.success("Imagem enviada com sucesso!");
      }, 500);
    } catch (error) {
      setUploading(false);
      setProgress(0);
      toast.error("Erro ao enviar imagem");
      console.error("Upload error:", error);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setOpen(false);
      setPreview(null);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Foto</DialogTitle>
          <DialogDescription>
            Escolha uma imagem para compartilhar no seu post.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Clique para enviar</span> ou
                  arraste e solte
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF ou WebP (máx. 10MB)
                </p>
              </div>
              <input
                id="image-upload"
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
          </div>

          {preview && (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setPreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enviando...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!preview || uploading}>
            {uploading ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
