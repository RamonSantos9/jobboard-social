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
import { X, Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useEffect, useRef, useCallback } from "react";
import LinkedInIcon from "@/components/LinkedInIcon";
import ImageEditorModal from "@/components/ImageEditorModal";

interface CreatePostModalProps {
  onPostCreated?: (post?: any) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialAction?: "image" | "video" | null;
}

export default function CreatePostModal({
  onPostCreated,
  children,
  open,
  onOpenChange,
  initialAction,
}: CreatePostModalProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const actionTriggeredRef = useRef(false);
  const [showEditor, setShowEditor] = useState(false);
  const [step, setStep] = useState<"upload" | "editor" | "text">("text");
  const [userProfile, setUserProfile] = useState<{
    photoUrl?: string;
    firstName?: string;
    lastName?: string;
  } | null>(null);

  // Usar estado externo se fornecido, caso contrário usar interno
  const modalOpen = open !== undefined ? open : isOpen;
  const setModalOpen = onOpenChange || setIsOpen;

  // Função para buscar perfil
  const fetchProfile = useCallback(async () => {
    if (!session) return;
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

  // Resetar estado quando o modal fechar
  useEffect(() => {
    if (!modalOpen) {
      actionTriggeredRef.current = false;
      setStep("text");
      setShowEditor(false);
      setContent("");
      setMediaUrl(null);
      setMediaType(null);
      setMediaUrls([]);
    }
  }, [modalOpen]);

  const handleFileUpload = async (type: "image" | "video") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "image" ? "image/*" : "video/*";
    input.multiple = type === "image"; // Permitir múltiplas imagens

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      setUploading(true);

      try {
        if (type === "image" && files.length > 1) {
          // Upload múltiplas imagens
          const uploadPromises = Array.from(files).map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", "image");

            const response = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
              const errorMessage =
                data.message || data.error || "Erro ao fazer upload";

              // Se for erro de configuração do preset, mostrar mensagem mais detalhada
              if (data.type === "preset_error" && data.troubleshooting) {
                toast.error("⚠️ Upload Preset não configurado", {
                  description:
                    "O preset 'jobboard_social' não foi encontrado. Consulte CLOUDINARY_SETUP.md para instruções.",
                  duration: 12000,
                  action: {
                    label: "Abrir Cloudinary",
                    onClick: () => {
                      window.open(
                        "https://cloudinary.com/console/settings/upload",
                        "_blank"
                      );
                    },
                  },
                });
                console.error(
                  "═══════════════════════════════════════════════════════════"
                );
                console.error(
                  "🔴 ERRO: Upload Preset 'jobboard_social' não encontrado"
                );
                console.error(
                  "═══════════════════════════════════════════════════════════"
                );
                console.error("");
                console.error("📋 INSTRUÇÕES RÁPIDAS:");
                console.error("");
                console.error(
                  "1. Acesse: https://cloudinary.com/console/settings/upload"
                );
                console.error("2. Clique em 'Add upload preset'");
                console.error(
                  "3. Nome do preset: jobboard_social (exatamente assim)"
                );
                console.error("4. Signing mode: Unsigned (MUITO IMPORTANTE!)");
                console.error("5. Clique em 'Save'");
                console.error(
                  "6. Reinicie o servidor Next.js (Ctrl+C e depois npm run dev)"
                );
                console.error("");
                console.error(
                  "📖 Para instruções detalhadas, consulte o arquivo CLOUDINARY_SETUP.md"
                );
                console.error("");
                console.error(
                  "═══════════════════════════════════════════════════════════"
                );
                console.error("Erro completo:", data);
              } else if (data.type === "configuration_error") {
                toast.error("Cloudinary não configurado", {
                  description: data.message,
                  duration: 8000,
                });
              } else {
                toast.error(errorMessage, {
                  description: data.details
                    ? "Veja o console para mais detalhes"
                    : undefined,
                  duration: 6000,
                });
              }

              throw new Error(errorMessage);
            }

            return data.url;
          });

          const urls = await Promise.all(uploadPromises);
          const newMediaUrls = [...mediaUrls, ...urls];
          setMediaUrls(newMediaUrls);
          setMediaType("image");
          // Abrir editor após upload de imagens
          setStep("editor");
          setShowEditor(true);
        } else {
          // Upload único (imagem ou vídeo)
          const file = files[0];
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", type);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            // Se a API retornou uma mensagem de erro específica, usar ela
            const errorMessage =
              data.message || data.error || "Erro ao fazer upload";

            // Se for erro de configuração do preset, mostrar mensagem mais detalhada
            if (data.type === "preset_error" && data.troubleshooting) {
              toast.error("⚠️ Upload Preset não configurado", {
                description:
                  "O preset 'jobboard_social' não foi encontrado. Consulte CLOUDINARY_SETUP.md para instruções.",
                duration: 12000,
                action: {
                  label: "Abrir Cloudinary",
                  onClick: () => {
                    window.open(
                      "https://cloudinary.com/console/settings/upload",
                      "_blank"
                    );
                  },
                },
              });
              console.error(
                "═══════════════════════════════════════════════════════════"
              );
              console.error(
                "🔴 ERRO: Upload Preset 'jobboard_social' não encontrado"
              );
              console.error(
                "═══════════════════════════════════════════════════════════"
              );
              console.error("");
              console.error("📋 INSTRUÇÕES RÁPIDAS:");
              console.error("");
              console.error(
                "1. Acesse: https://cloudinary.com/console/settings/upload"
              );
              console.error("2. Clique em 'Add upload preset'");
              console.error(
                "3. Nome do preset: jobboard_social (exatamente assim)"
              );
              console.error("4. Signing mode: Unsigned (MUITO IMPORTANTE!)");
              console.error("5. Clique em 'Save'");
              console.error(
                "6. Reinicie o servidor Next.js (Ctrl+C e depois npm run dev)"
              );
              console.error("");
              console.error(
                "📖 Para instruções detalhadas, consulte o arquivo CLOUDINARY_SETUP.md"
              );
              console.error("");
              console.error(
                "═══════════════════════════════════════════════════════════"
              );
              console.error("Erro completo:", data);
            } else if (data.type === "configuration_error") {
              toast.error("Cloudinary não configurado", {
                description: data.message,
                duration: 8000,
              });
            } else {
              toast.error(errorMessage, {
                description: data.details
                  ? "Veja o console para mais detalhes"
                  : undefined,
                duration: 6000,
              });
            }

            throw new Error(errorMessage);
          }

          // Upload bem-sucedido
          if (type === "image") {
            const newMediaUrls = [...mediaUrls, data.url];
            setMediaUrls(newMediaUrls);
            setMediaType("image");
            // Abrir editor após upload de imagem
            setStep("editor");
            setShowEditor(true);
          } else {
            setMediaUrl(data.url);
            setMediaType("video");
            // Vídeo não precisa de editor, permanecer no passo de texto
          }
        }
      } catch (error) {
        console.error("Upload error:", error);

        // Verificar se já foi exibido um toast específico
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erro ao fazer upload do arquivo";

        // Se for erro de preset ou configuração, o toast já foi exibido acima
        if (
          !errorMessage.includes("CONFIGURAÇÃO") &&
          !errorMessage.includes("preset") &&
          !errorMessage.includes("Cloudinary não configurado")
        ) {
          // Para outros erros, mostrar toast genérico
          toast.error(errorMessage, {
            description: "Verifique o console para mais detalhes",
            duration: 6000,
          });
        }
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  // Acionar upload quando o modal abrir com initialAction
  useEffect(() => {
    if (modalOpen && initialAction && !actionTriggeredRef.current) {
      actionTriggeredRef.current = true;
      // Pequeno delay para garantir que o modal esteja totalmente renderizado
      const timer = setTimeout(() => {
        handleFileUpload(initialAction);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [modalOpen, initialAction]);

  const handleSubmit = async () => {
    if (!content.trim() && !mediaUrl && mediaUrls.length === 0) {
      toast.error("Digite algo ou adicione uma mídia");
      return;
    }

    setPosting(true);
    try {
      // Normalizar dados de mídia antes de enviar
      let finalMediaUrl: string | null = null;
      let finalMediaType: "image" | "video" | null = null;
      let finalMediaUrls: string[] | undefined = undefined;

      // Se há vídeo, usar mediaUrl
      if (mediaUrl && mediaType === "video") {
        finalMediaUrl = mediaUrl;
        finalMediaType = "video";
      }
      // Se há imagens
      else if (mediaUrls.length > 0) {
        if (mediaUrls.length === 1) {
          // Uma única imagem: salvar em mediaUrl para compatibilidade
          finalMediaUrl = mediaUrls[0];
          finalMediaType = "image";
        } else {
          // Múltiplas imagens: salvar todas em mediaUrls e a primeira em mediaUrl
          finalMediaUrl = mediaUrls[0];
          finalMediaType = "image";
          finalMediaUrls = mediaUrls;
        }
      }

      console.log("Enviando post com dados:", {
        content,
        mediaUrl: finalMediaUrl,
        mediaType: finalMediaType,
        mediaUrls: finalMediaUrls,
      });

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim() || undefined,
          mediaUrl: finalMediaUrl || undefined,
          mediaType: finalMediaType || undefined,
          mediaUrls: finalMediaUrls,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Publicação criada com sucesso!");
        setContent("");
        setMediaUrl(null);
        setMediaType(null);
        setMediaUrls([]);
        setModalOpen(false);
        onPostCreated?.(data.post);
      } else {
        console.error("Erro ao criar post:", data);
        toast.error(data.error || data.details || "Erro ao criar publicação");
      }
    } catch (error) {
      console.error("Erro ao criar publicação:", error);
      toast.error("Erro ao criar publicação");
    } finally {
      setPosting(false);
    }
  };

  const removeMedia = (index?: number) => {
    if (index !== undefined) {
      // Remover imagem específica
      const newMediaUrls = mediaUrls.filter((_, i) => i !== index);
      setMediaUrls(newMediaUrls);
      if (newMediaUrls.length === 0) {
        setMediaType(null);
        setMediaUrl(null);
      }
    } else {
      // Remover vídeo ou última mídia
      if (mediaUrl) {
        setMediaUrl(null);
      }
      if (mediaUrls.length > 0) {
        setMediaUrls([]);
      }
      setMediaType(null);
    }
  };

  const handleEditorNext = () => {
    setShowEditor(false);
    setStep("text");
  };

  const handleEditorBack = () => {
    setShowEditor(false);
    setStep("text");
  };

  const handleEditImage = (index: number) => {
    // Voltar para o editor com a imagem selecionada
    setShowEditor(true);
    setStep("editor");
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      {!open && (
        <DialogTrigger asChild>
          {children || (
            <Button className="w-full justify-start text-black/60 bg-white border rounded-full px-4 py-6 hover:bg-white">
              <span className="text-left">Comece uma publicação</span>
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar uma publicação</DialogTitle>
          <DialogDescription className="text-black/60 text-sm">
            Compartilhe suas ideias, experiências e conhecimentos com sua rede.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={
                  userProfile?.photoUrl || "/placeholder/userplaceholder.svg"
                }
              />
              <AvatarFallback>
                {userProfile?.firstName?.[0] || ""}
                {userProfile?.lastName?.[0] || ""}
                {!userProfile?.firstName && !userProfile?.lastName
                  ? session?.user?.name?.[0] || "U"
                  : ""}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {userProfile?.firstName && userProfile?.lastName
                  ? `${userProfile.firstName} ${userProfile.lastName}`
                  : session?.user?.name || "Usuário"}
              </p>
              <p className="text-xs text-black/60">Público</p>
            </div>
          </div>

          {/* Content */}
          <Textarea
            placeholder="O que você gostaria de compartilhar?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] border-0 text-sm resize-none focus:ring-0 ring-0 border-black/40 rounded-lg"
          />

          {/* Media Preview */}
          {uploading && (
            <div className="p-4 text-center text-sm text-black">
              Fazendo upload...
            </div>
          )}

          {mediaUrls.length > 0 && step === "text" && (
            <div className="grid grid-cols-2 gap-2">
              {mediaUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border-2 border-black/40"
                  />
                  {/* Overlay com botões de ação - aparece ao passar o mouse */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
                      onClick={() => handleEditImage(index)}
                      aria-label="Editar imagem"
                    >
                      <Pencil className="w-4 h-4 text-black" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-8 h-8 p-0 bg-red-500/90 hover:bg-red-600"
                      onClick={() => removeMedia(index)}
                      aria-label="Remover imagem"
                    >
                      <X className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                  {/* Botões sempre visíveis no canto superior direito */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-7 h-7 p-0 bg-white/80 hover:bg-white border border-gray-300"
                      onClick={() => handleEditImage(index)}
                      aria-label="Editar imagem"
                    >
                      <Pencil className="w-3 h-3 text-black" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-7 h-7 p-0 bg-red-500/80 hover:bg-red-600"
                      onClick={() => removeMedia(index)}
                      aria-label="Remover imagem"
                    >
                      <X className="w-3 h-3 text-white" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mediaUrl && mediaType === "video" && (
            <div className="relative">
              <video
                src={mediaUrl}
                controls
                className="w-full max-h-64 rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => removeMedia()}
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
                className="text-black hover:text-blue-600"
              >
                <LinkedInIcon id="image-medium" size={20} className="mr-2" />
                Imagem
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFileUpload("video")}
                className="text-black hover:text-green-600"
              >
                <LinkedInIcon id="video-medium" size={20} className="mr-2" />
                Vídeo
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={posting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  posting ||
                  uploading ||
                  (!content.trim() && !mediaUrl && mediaUrls.length === 0)
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {posting
                  ? "Publicando..."
                  : uploading
                  ? "Fazendo upload..."
                  : "Publicar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Image Editor Modal */}
      <ImageEditorModal
        isOpen={showEditor && step === "editor"}
        onClose={() => {
          setShowEditor(false);
          setStep("text");
        }}
        images={mediaUrls}
        onImagesChange={(newImages) => {
          setMediaUrls(newImages);
          if (newImages.length === 0) {
            setMediaType(null);
            setMediaUrl(null);
          }
        }}
        onNext={handleEditorNext}
        onBack={handleEditorBack}
      />
    </Dialog>
  );
}
