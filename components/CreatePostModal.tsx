"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Image,
  Video,
  FileText,
  Smile,
  Calendar,
  MapPin,
  Users,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "./ToastProvider";

interface CreatePostModalProps {
  onPostCreated?: (post?: any) => void;
}

export default function CreatePostModal({
  onPostCreated,
}: CreatePostModalProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [posting, setPosting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() && !mediaUrl) {
      toast({
        type: "error",
        title: "Digite algo ou adicione uma mídia",
      });
      return;
    }

    setPosting(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          mediaUrl,
          mediaType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          type: "success",
          title: "Publicação criada com sucesso!",
        });
        setContent("");
        setMediaUrl(null);
        setMediaType(null);
        setIsOpen(false);
        onPostCreated?.(data.post); // Passar o post criado
      } else {
        toast({
          type: "error",
          title: data.error || "Erro ao criar publicação",
        });
      }
    } catch (error) {
      toast({
        type: "error",
        title: "Erro ao criar publicação",
      });
    } finally {
      setPosting(false);
    }
  };

  const handleFileUpload = (type: "image" | "video") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "image" ? "image/*" : "video/*";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Simular upload - em produção, você faria upload real
        const url = URL.createObjectURL(file);
        setMediaUrl(url);
        setMediaType(type);
      }
    };

    input.click();
  };

  const removeMedia = () => {
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaUrl(null);
    setMediaType(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start text-black/60 bg-white hover:bg-gray-50 border rounded-full px-4 py-6 ">
          <span className="text-left">Comece uma publicação</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar uma publicação</DialogTitle>
          <DialogDescription>
            Compartilhe suas ideias, experiências e conhecimentos com sua rede.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/placeholder-avatar.svg" />
              <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {session?.user?.name || "Usuário"}
              </p>
              <p className="text-xs text-gray-500">Público</p>
            </div>
          </div>

          {/* Content */}
          <Textarea
            placeholder="O que você gostaria de compartilhar?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] border-0 text-lg resize-none focus:ring-0 ring-0 border-gray-200 rounded-lg"
          />

          {/* Media Preview */}
          {mediaUrl && (
            <div className="relative">
              {mediaType === "image" ? (
                <img
                  src={mediaUrl}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-lg border-2 border-gray-200"
                />
              ) : (
                <video
                  src={mediaUrl}
                  controls
                  className="w-full max-h-64 rounded-lg"
                />
              )}
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeMedia}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFileUpload("image")}
                className="text-gray-600 hover:text-blue-600"
              >
                <Image className="w-5 h-5 mr-2" />
                Imagem
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFileUpload("video")}
                className="text-gray-600 hover:text-blue-600"
              >
                <Video className="w-5 h-5 mr-2" />
                Vídeo
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={posting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={posting || (!content.trim() && !mediaUrl)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {posting ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
