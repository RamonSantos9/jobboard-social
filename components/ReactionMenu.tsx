"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { ReactionType } from "@/models/Post";

interface ReactionMenuProps {
  onSelect: (reactionType: ReactionType) => void;
  onClose: () => void;
  onMouseEnterMenu?: () => void;
  currentReaction?: ReactionType | null;
}

const reactions: Array<{
  type: "like" | "love" | "celebrate";
  label: string;
  iconPath: string;
  color: string;
  bgColor: string;
}> = [
  {
    type: "like",
    label: "Curtir",
    iconPath: "/images/icons/like.svg",
    color: "#2563eb",
    bgColor: "#378fe9",
  },
  {
    type: "love",
    label: "Amei",
    iconPath: "/images/icons/amei.svg",
    color: "#dc2626",
    bgColor: "#df704d",
  },
  {
    type: "celebrate",
    label: "Parabéns",
    iconPath: "/images/icons/parabens.svg",
    color: "#16a34a",
    bgColor: "#6dae4f",
  },
];

export default function ReactionMenu({
  onSelect,
  onClose,
  onMouseEnterMenu,
  currentReaction,
}: ReactionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, [onClose]);

  const handleReactionClick = (reactionType: ReactionType) => {
    onSelect(reactionType);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: 15, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute bottom-full left-0 mb-1 bg-white rounded-full border border-black/16 px-2 py-2 flex items-center z-[100]"
        onMouseEnter={() => {
          // Cancelar timer de fechamento quando mouse entra no menu
          if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
          }
          // Notificar o botão para cancelar seu timer também
          if (onMouseEnterMenu) {
            onMouseEnterMenu();
          }
        }}
        onMouseLeave={() => {
          // Delay moderado para permitir que o usuário mova o mouse de volta para o botão
          closeTimer.current = setTimeout(() => {
            onClose();
          }, 300);
        }}
      >
        {reactions.map((reaction, index) => (
          <motion.button
            key={reaction.type}
            onClick={() => handleReactionClick(reaction.type)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`relative  rounded-full transition-all p-1 duration-200 ${
              currentReaction === reaction.type ? "bg-white" : "hover:bg-white"
            }`}
            whileHover={{ scale: 1.2, y: -5 }}
            whileTap={{ scale: 0.9 }}
          >
            <div
              className="w-8 h-8 flex items-center justify-center"
              style={{
                filter:
                  hoveredIndex === index || currentReaction === reaction.type
                    ? "none"
                    : "grayscale(0.3)",
              }}
            >
              <Image
                src={reaction.iconPath}
                alt={reaction.label}
                width={32}
                height={32}
              />
            </div>
            {hoveredIndex === index && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
              >
                {reaction.label}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </motion.div>
            )}
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
