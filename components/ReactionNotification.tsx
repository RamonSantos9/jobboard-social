"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import type { ReactionType } from "@/models/Post";

interface ReactionNotificationProps {
  reaction: {
    type: ReactionType;
    user?: {
      _id: string;
      name: string;
      profile?: {
        firstName: string;
        lastName: string;
        photoUrl?: string;
      };
    };
    company?: {
      _id: string;
      name: string;
      logoUrl?: string;
    };
  };
  notificationType?: "reaction" | "suggestion";
}

const reactionLabels: Record<ReactionType, string> = {
  like: "gostou disso",
  love: "adorou isso",
  celebrate: "parabenizou isso",
  support: "apoiou isso",
  interesting: "achou interessante",
  funny: "achou engraçado",
};

const reactionIcons: Record<ReactionType, string> = {
  like: "/images/icons/like.svg",
  love: "/images/icons/amei.svg",
  celebrate: "/images/icons/parabens.svg",
  support: "/images/icons/like.svg", // Usar like como fallback
  interesting: "/images/icons/like.svg", // Usar like como fallback
  funny: "/images/icons/like.svg", // Usar like como fallback
};

export default function ReactionNotification({ 
  reaction, 
  notificationType = "reaction" 
}: ReactionNotificationProps) {
  const { type, user, company } = reaction;
  const isSuggestion = notificationType === "suggestion";

  const displayName = user
    ? `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || user.name
    : company?.name || "";

  const avatarUrl = user?.profile?.photoUrl || company?.logoUrl;
  const avatarFallback = user
    ? `${user.profile?.firstName?.[0] || ""}${user.profile?.lastName?.[0] || ""}`.trim() ||
      user.name[0].toUpperCase()
    : company?.name[0].toUpperCase() || "";

  const reactionLabel = reactionLabels[type] || "reagiu";
  const reactionIcon = reactionIcons[type];

  // Estilo diferente para sugestões
  const containerClassName = isSuggestion
    ? "px-4 py-2.5 border-b border-gray-200 bg-blue-50/50 flex items-center gap-2.5"
    : "px-4 py-2.5 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2.5";

  return (
    <div className={containerClassName}>
      <div className="relative">
        <Avatar className="w-8 h-8">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        {reactionIcon && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-gray-200">
            <Image
              src={reactionIcon}
              alt={type}
              width={12}
              height={12}
              className="w-3 h-3"
            />
          </div>
        )}
      </div>
      <span className="text-sm text-gray-700 flex-1">
        <span className="font-semibold">{displayName}</span> {reactionLabel}
        {isSuggestion && (
          <span className="text-blue-600 font-medium ml-1">• Sugestão para você</span>
        )}
      </span>
    </div>
  );
}

