"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import LinkedInIcon from "./LinkedInIcon";
import ReactionMenu from "./ReactionMenu";
import type { ReactionType } from "@/models/Post";

interface ReactionButtonProps {
  postId: string;
  currentReaction?: ReactionType | null;
  reactionsCount?: number;
  onReaction: (postId: string, reactionType: ReactionType | null) => void;
}

const reactionLabels: Record<"like" | "love" | "celebrate", string> = {
  like: "Curtir",
  love: "Amei",
  celebrate: "Parabéns",
};

const reactionColors: Record<"like" | "love" | "celebrate", string> = {
  like: "#2563eb", // azul
  love: "#dc2626", // vermelho
  celebrate: "#16a34a", // verde
};

export default function ReactionButton({
  postId,
  currentReaction,
  reactionsCount = 0,
  onReaction,
}: ReactionButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);
  const clickedRef = useRef(false);

  const handleClick = (e: React.MouseEvent) => {
    // Não usar preventDefault para não bloquear eventos necessários
    e.stopPropagation();

    // Cancelar timeout de hover se existir
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }

    // Marcar como clicked para evitar que o menu apareça
    clickedRef.current = true;
    setTimeout(() => {
      clickedRef.current = false;
    }, 300);

    // Fechar menu se estiver aberto
    if (showMenu) {
      setShowMenu(false);
    }

    // Executar ação imediatamente
    if (currentReaction) {
      // Se já tem reação, remover
      onReaction(postId, null);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    } else {
      // Se não tem reação, adicionar "like" por padrão
      onReaction(postId, "like");
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleMouseEnter = () => {
    // Só mostrar menu se não houve click recente e após delay menor
    if (!clickedRef.current) {
      hoverTimer.current = setTimeout(() => {
        if (!clickedRef.current) {
          setShowMenu(true);
        }
      }, 250);
    }
  };

  const handleMouseLeave = () => {
    // Cancelar timeout de hover
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }

    // Usar timeout moderado para permitir transição suave para o menu
    closeTimer.current = setTimeout(() => {
      setShowMenu(false);
    }, 300);
  };

  const cancelCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleReactionSelect = (reactionType: ReactionType) => {
    onReaction(postId, reactionType);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    setShowMenu(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
      }
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  const displayLabel = currentReaction
    ? reactionLabels[currentReaction as "like" | "love" | "celebrate"]
    : "Curtir";

  const getReactionIcon = () => {
    if (!currentReaction) {
      // Estado inicial: usar ícone neutro do sprite
      return (
        <LinkedInIcon
          id="thumbs-up-outline-small"
          size={12}
          className="text-black md:!w-4 md:!h-4"
        />
      );
    }

    // Estado com reação: usar SVG específico
    switch (currentReaction) {
      case "like":
        return (
          <Image
            src="/images/icons/like.svg"
            alt="Curtir"
            width={12}
            height={12}
            className="md:w-5 md:h-5"
          />
        );
      case "love":
        return (
          <Image
            src="/images/icons/amei.svg"
            alt="Amei"
            width={12}
            height={12}
            className="md:w-5 md:h-5"
          />
        );
      case "celebrate":
        return (
          <Image
            src="/images/icons/parabens.svg"
            alt="Parabéns"
            width={12}
            height={12}
            className="md:w-5 md:h-5"
          />
        );
      default:
        return (
          <LinkedInIcon
            id="thumbs-up-outline-small"
            size={12}
            className="text-black md:!w-4 md:!h-4"
          />
        );
    }
  };

  const textColor = currentReaction
    ? reactionColors[currentReaction as "like" | "love" | "celebrate"]
    : "text-black";

  return (
    <div className={`relative ${showMenu ? "z-10" : ""}`}>
      <motion.button
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`flex items-center justify-center gap-1 md:gap-2 text-[10px] md:text-xs font-medium px-2 py-1.5 md:px-4 md:py-2 flex-1 relative ${textColor} hover:${textColor}`}
        style={{
          color: currentReaction
            ? reactionColors[currentReaction as "like" | "love" | "celebrate"]
            : undefined,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={
          isAnimating
            ? {
                scale: [1, 1.1, 1],
                opacity: [1, 0.8, 1],
              }
            : {}
        }
        transition={{ duration: 0.3 }}
      >
        {getReactionIcon()}
        <span>{displayLabel}</span>
      </motion.button>

      {/* Área invisível para facilitar transição do mouse entre botão e menu */}
      {showMenu && (
        <div
          className="absolute bottom-full left-0 w-full h-2"
          onMouseEnter={cancelCloseTimer}
          onMouseLeave={() => {
            closeTimer.current = setTimeout(() => {
              setShowMenu(false);
            }, 300);
          }}
        />
      )}

      {showMenu && (
        <ReactionMenu
          onSelect={handleReactionSelect}
          onClose={() => setShowMenu(false)}
          onMouseEnterMenu={cancelCloseTimer}
          currentReaction={currentReaction || undefined}
        />
      )}
    </div>
  );
}
