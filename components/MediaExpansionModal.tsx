"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaExpansionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl?: string;
  mediaUrls?: string[];
  mediaType?: "image" | "video";
  initialIndex?: number;
}

export default function MediaExpansionModal({
  isOpen,
  onClose,
  mediaUrl,
  mediaUrls,
  mediaType = "image",
  initialIndex = 0,
}: MediaExpansionModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Determinar quais URLs usar
  const allMediaUrls = mediaUrls && mediaUrls.length > 0 ? mediaUrls : mediaUrl ? [mediaUrl] : [];
  const currentMediaUrl = allMediaUrls[currentIndex];
  const hasMultiple = allMediaUrls.length > 1;
  const isVideo = mediaType === "video";

  // Reset index quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsPlaying(false);
      setIsMuted(false);
      setShowControls(true);
    }
  }, [isOpen, initialIndex]);

  // Auto-hide controls para vídeo
  useEffect(() => {
    if (isVideo && isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isVideo, isPlaying, showControls]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allMediaUrls.length - 1));
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < allMediaUrls.length - 1 ? prev + 1 : 0));
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      setShowControls(true);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      setShowControls(true);
    }
  };

  const handleVideoClick = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      if (hasMultiple) handlePrevious();
    } else if (e.key === "ArrowRight") {
      if (hasMultiple) handleNext();
    } else if (e.key === "Escape") {
      onClose();
    } else if (e.key === " " && isVideo) {
      e.preventDefault();
      handlePlayPause();
    }
  };

  if (!currentMediaUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 bg-transparent border-0 gap-0 overflow-hidden focus:outline-none shadow-none rounded-none [&>button]:hidden"
        onKeyDown={handleKeyDown}
        onPointerMove={() => {
          if (isVideo) {
            setShowControls(true);
            if (controlsTimeoutRef.current) {
              clearTimeout(controlsTimeoutRef.current);
            }
          }
        }}
      >
        {/* DialogTitle para acessibilidade - escondido visualmente */}
        <DialogTitle className="sr-only">
          {isVideo ? "Visualizador de vídeo" : "Visualizador de imagem"}
        </DialogTitle>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          aria-label="Fechar"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Navigation Arrows - Multiple Images */}
        {hasMultiple && !isVideo && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Media Container */}
        <div className="relative w-full h-full flex items-center justify-center p-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full flex items-center justify-center bg-transparent"
            >
              {isVideo ? (
                <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={currentMediaUrl}
                    className="max-w-full max-h-full object-contain"
                    onClick={handleVideoClick}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => {
                      setIsPlaying(false);
                      if (hasMultiple) {
                        handleNext();
                      }
                    }}
                    muted={isMuted}
                    playsInline
                    controls={false}
                  />

                  {/* Video Controls */}
                  <AnimatePresence>
                    {showControls && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
                      >
                        <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto">
                          <Button
                            onClick={handlePlayPause}
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                          >
                            {isPlaying ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5" />
                            )}
                          </Button>

                          <Button
                            onClick={handleMuteToggle}
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                          >
                            {isMuted ? (
                              <VolumeX className="w-5 h-5" />
                            ) : (
                              <Volume2 className="w-5 h-5" />
                            )}
                          </Button>

                          {hasMultiple && (
                            <>
                              <Button
                                onClick={handlePrevious}
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/20"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </Button>
                              <span className="text-white text-sm">
                                {currentIndex + 1} / {allMediaUrls.length}
                              </span>
                              <Button
                                onClick={handleNext}
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/20"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center bg-transparent">
                  <img
                    src={currentMediaUrl}
                    alt={`Media ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                  {hasMultiple && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
                      {currentIndex + 1} / {allMediaUrls.length}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
