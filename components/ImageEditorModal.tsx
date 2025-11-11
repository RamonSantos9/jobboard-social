"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Plus, Copy, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  onImagesChange: (images: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ImageEditorModal({
  isOpen,
  onClose,
  images,
  onImagesChange,
  onNext,
  onBack,
}: ImageEditorModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Reset selected index when modal opens or images change
  useEffect(() => {
    if (isOpen && images.length > 0) {
      setSelectedIndex(0);
    }
  }, [isOpen, images.length]);

  const handleDuplicate = () => {
    if (images.length === 0) return;
    const newImages = [...images];
    newImages.splice(selectedIndex + 1, 0, images[selectedIndex]);
    onImagesChange(newImages);
    setSelectedIndex(selectedIndex + 1);
  };

  const handleRemove = (index: number) => {
    if (images.length <= 1) {
      // Se só tem uma imagem, não permite remover
      return;
    }
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    if (selectedIndex >= newImages.length) {
      setSelectedIndex(newImages.length - 1);
    } else if (selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newImages = [...images];
      const [draggedImage] = newImages.splice(draggedIndex, 1);
      newImages.splice(dragOverIndex, 0, draggedImage);
      onImagesChange(newImages);
      
      // Ajustar índice selecionado
      if (selectedIndex === draggedIndex) {
        setSelectedIndex(dragOverIndex);
      } else if (selectedIndex === dragOverIndex) {
        setSelectedIndex(draggedIndex);
      } else if (draggedIndex < selectedIndex && dragOverIndex >= selectedIndex) {
        setSelectedIndex(selectedIndex - 1);
      } else if (draggedIndex > selectedIndex && dragOverIndex <= selectedIndex) {
        setSelectedIndex(selectedIndex + 1);
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[selectedIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[80vw] w-[80vw] max-h-[80vh] h-[80vh] p-0 bg-white border border-gray-200 gap-0 overflow-hidden focus:outline-none shadow-lg rounded-lg [&>button]:hidden flex flex-col"
      >
        <DialogTitle className="sr-only">Editor de Imagens</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-black">Editor</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Left Panel - Main Image (60%) */}
          <div className="flex-1 flex overflow-hidden">
            <div className="w-3/5 bg-gray-50 flex items-center justify-center relative p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  <img
                    src={currentImage}
                    alt={`Imagem ${selectedIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                        aria-label="Imagem anterior"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                        aria-label="Próxima imagem"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
                      {selectedIndex + 1} de {images.length}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Panel - Thumbnails and Controls (40%) */}
            <div className="w-2/5 bg-white border-l border-gray-200 flex flex-col">
              {/* Thumbnails Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleThumbnailClick(index)}
                      className={`
                        relative group cursor-move rounded-lg overflow-hidden border-2 transition-all
                        ${selectedIndex === index
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300"
                        }
                        ${draggedIndex === index ? "opacity-50" : ""}
                        ${dragOverIndex === index ? "border-blue-400" : ""}
                      `}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      
                      {/* Remove Button */}
                      {images.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(index);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remover imagem"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Selected Indicator */}
                      {selectedIndex === index && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-blue-500 text-white text-xs font-medium">
                          {index + 1}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 p-4 space-y-2 flex-shrink-0">
                <Button
                  onClick={handleDuplicate}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={images.length === 0}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar imagem selecionada
                </Button>
                <Button
                  onClick={handleDuplicate}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={images.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar mais imagens
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            >
              Voltar
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              disabled={images.length === 0}
            >
              Avançar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

