"use client";

import { useState, useRef, useEffect } from "react";
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
import { X, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";

interface PhotoEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
}

export default function PhotoEditModal({
  open,
  onOpenChange,
  imageUrl,
  onSave,
}: PhotoEditModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [saveConfirmDialogOpen, setSaveConfirmDialogOpen] = useState(false);

  useEffect(() => {
    if (open && imageUrl) {
      // Resetar estados quando abrir
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setBrightness(100);
      setContrast(100);
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageRef.current = img;
        drawImage();
      };
      img.src = imageUrl;
    }
  }, [open, imageUrl]);

  useEffect(() => {
    if (open && imageRef.current) {
      drawImage();
    }
  }, [scale, position, rotation, brightness, contrast, open]);

  const drawImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Tamanho do canvas (quadrado para foto de perfil)
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    // Limpar canvas
    ctx.clearRect(0, 0, size, size);

    // Criar máscara circular
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Aplicar filtros
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Calcular dimensões da imagem
    const img = imageRef.current;
    const imgAspect = img.width / img.height;
    const canvasAspect = 1; // Quadrado

    let drawWidth = size * scale;
    let drawHeight = size * scale;

    if (imgAspect > canvasAspect) {
      drawHeight = drawWidth / imgAspect;
    } else {
      drawWidth = drawHeight * imgAspect;
    }

    // Calcular posição central
    const centerX = size / 2 + position.x;
    const centerY = size / 2 + position.y;

    // Salvar contexto
    ctx.save();

    // Rotacionar
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // Desenhar imagem
    ctx.drawImage(
      img,
      centerX - drawWidth / 2,
      centerY - drawHeight / 2,
      drawWidth,
      drawHeight
    );

    // Restaurar contexto
    ctx.restore();

    // Desenhar borda circular
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const canvasSize = 300;
      const scaleX = canvasSize / rect.width;
      const scaleY = canvasSize / rect.height;
      setDragStart({
        x: (e.clientX - rect.left) * scaleX - position.x,
        y: (e.clientY - rect.top) * scaleY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const canvasSize = 300;
      const scaleX = canvasSize / rect.width;
      const scaleY = canvasSize / rect.height;
      setPosition({
        x: (e.clientX - rect.left) * scaleX - dragStart.x,
        y: (e.clientY - rect.top) * scaleY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveClick = () => {
    setSaveConfirmDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaveConfirmDialogOpen(false);
    setSaving(true);
    try {
      // Criar um novo canvas para exportar a imagem circular
      const exportCanvas = document.createElement("canvas");
      const size = 300;
      exportCanvas.width = size;
      exportCanvas.height = size;
      const ctx = exportCanvas.getContext("2d");
      
      if (!ctx) {
        throw new Error("Erro ao criar contexto do canvas");
      }

      // Criar máscara circular
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      // Copiar conteúdo do canvas original (redimensionado)
      ctx.drawImage(canvas, 0, 0, size, size);

      // Converter para blob
      exportCanvas.toBlob(
        async (blob) => {
          if (!blob) {
            throw new Error("Erro ao processar imagem");
          }

          // Criar FormData e fazer upload
          const formData = new FormData();
          formData.append("file", blob, "profile-photo.jpg");
          formData.append("type", "image");

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Erro ao fazer upload");
          }

          onSave(data.url);
          onOpenChange(false);
          toast.success("Sucesso", {
            description: "Foto editada e salva com sucesso!",
          });
        },
        "image/png",
        0.95
      );
    } catch (error: any) {
      toast.error("Erro", {
        description: error.message || "Erro ao salvar foto editada",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setBrightness(100);
    setContrast(100);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-black">
              Editar foto
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-500 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <Separator className="bg-black/10" />

        <div className="space-y-6 mt-6">
          {/* Canvas de Edição */}
          <div className="flex justify-center bg-gray-100 rounded-full p-4">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="rounded-full cursor-move"
                style={{ width: "300px", height: "300px" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              {/* Overlay circular para indicar área de crop */}
              <div className="absolute inset-0 pointer-events-none rounded-full border-2 border-dashed border-gray-400" />
            </div>
          </div>

          {/* Controles de Zoom */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-black mb-2 block">
                Zoom
              </label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                  className="border-black text-black"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale(Math.min(3, scale + 0.1))}
                  className="border-black text-black"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 w-16 text-right">
                  {Math.round(scale * 100)}%
                </span>
              </div>
            </div>

            {/* Controle de Rotação */}
            <div>
              <label className="text-sm font-medium text-black mb-2 block">
                Rotação
              </label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation((prev) => (prev - 90) % 360)}
                  className="border-black text-black"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="90"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-16 text-right">
                  {rotation}°
                </span>
              </div>
            </div>

            {/* Controle de Brilho */}
            <div>
              <label className="text-sm font-medium text-black mb-2 block">
                Brilho
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>{brightness}%</span>
                <span>200%</span>
              </div>
            </div>

            {/* Controle de Contraste */}
            <div>
              <label className="text-sm font-medium text-black mb-2 block">
                Contraste
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>{contrast}%</span>
                <span>200%</span>
              </div>
            </div>
          </div>

          <Separator className="bg-black/10" />

          {/* Botões de Ação */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-black text-black"
            >
              Redefinir
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-black text-black"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveClick}
                disabled={saving}
                className="bg-black hover:bg-black/80 text-white"
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      </Dialog>

      {/* Alert Dialog - Confirmação de Salvamento */}
      <AlertDialog
        open={saveConfirmDialogOpen}
        onOpenChange={setSaveConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja salvar as alterações na sua foto de
              perfil? Esta ação irá substituir sua foto atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

