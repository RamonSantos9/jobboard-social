"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CreatePostModal from "./CreatePostModal";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import LinkedInIcon from "@/components/LinkedInIcon";
import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreatePostBox({
  onPostCreated,
}: {
  onPostCreated?: () => void;
}) {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"image" | "video" | null>(
    null
  );
  const [userProfile, setUserProfile] = useState<{
    photoUrl?: string;
    firstName?: string;
    lastName?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar perfil
  const fetchProfile = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setUserProfile({
            photoUrl: data.profile.photoUrl,
            firstName: data.profile.firstName,
            lastName: data.profile.lastName,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Buscar perfil do usuário
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Listener para atualizar foto quando o usuário mudar a foto de perfil
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchProfile();
    };

    // Escutar evento customizado de atualização de perfil
    window.addEventListener("profilePhotoUpdated", handleProfileUpdate);

    // Também escutar quando a janela recebe foco (caso o usuário tenha mudado a foto em outra aba)
    window.addEventListener("focus", handleProfileUpdate);

    return () => {
      window.removeEventListener("profilePhotoUpdated", handleProfileUpdate);
      window.removeEventListener("focus", handleProfileUpdate);
    };
  }, [fetchProfile]);

  // Resetar modalAction quando o modal fechar
  useEffect(() => {
    if (!isModalOpen) {
      setModalAction(null);
    }
  }, [isModalOpen]);

  // Skeleton Component
  if (loading) {
    return (
      <Card className="border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <Skeleton className="flex-1 h-12 rounded-full" />
        </div>
        <div className="flex items-center justify-around mt-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border rounded-lg p-4">
        {/* Linha superior - avatar + botão */}
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage
              src={userProfile?.photoUrl || "/placeholder/userplaceholder.svg"}
            />
            <AvatarFallback>
              {userProfile?.firstName?.[0] || ""}
              {userProfile?.lastName?.[0] || ""}
              {!userProfile?.firstName && !userProfile?.lastName
                ? session?.user?.name?.[0] || "U"
                : ""}
            </AvatarFallback>
          </Avatar>

          <CreatePostModal
            onPostCreated={onPostCreated}
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            initialAction={modalAction}
          >
            <Button className="flex-1 justify-start border border-black/40 rounded-full px-4 py-6 text-xs bg-white text-black hover:bg-white">
              Comece uma publicação
            </Button>
          </CreatePostModal>
        </div>

        {/* Linha inferior - ações */}
        <div className="flex items-center justify-around">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-black hover:text-green-600 hover:bg-green-100"
            onClick={() => {
              setModalAction("video");
              setIsModalOpen(true);
            }}
          >
            <LinkedInIcon
              id="video-medium"
              size={24}
              className="text-green-600"
            />
            <span className="text-sm font-medium">Vídeo</span>
          </Button>

          <Button
            variant="ghost"
            className="flex items-center gap-2 text-black hover:text-blue-600 hover:bg-blue-100"
            onClick={() => {
              setModalAction("image");
              setIsModalOpen(true);
            }}
          >
            <LinkedInIcon
              id="image-medium"
              size={24}
              className="text-blue-600"
            />
            <span className="text-sm font-medium">Foto</span>
          </Button>

          <Button
            variant="ghost"
            className="flex items-center gap-2 text-black hover:text-orange-600 hover:bg-orange-100"
            onClick={() => {
              setModalAction(null);
              setIsModalOpen(true);
            }}
          >
            <LinkedInIcon
              id="compose-medium"
              size={24}
              className="text-orange-600"
            />
            <span className="text-sm font-medium">Escrever artigo</span>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
