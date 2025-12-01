"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Briefcase,
  MapPin,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Clock,
  Sparkles,
  CheckCircle2,
  MessageCircle,
  Share2,
  Send,
} from "lucide-react";
import LinkedInIcon from "./LinkedInIcon";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck } from "lucide-react";
import ReactionButton from "./ReactionButton";
import CommentSection from "./CommentSection";
import ShareModal from "./ShareModal";
import SendMessagePopup from "./SendMessagePopup";
import type { ReactionType } from "@/models/Post";

interface JobCardProps {
  job: {
    _id: string;
    title: string;
    description: string;
    location: string;
    remote: boolean;
    type: string;
    level: string;
    category: string;
    salaryRange?: {
      min: number;
      max: number;
      currency: string;
    };
    companyId: {
      _id: string;
      name: string;
      logoUrl?: string;
      location?: string;
    };
    skills?: string[];
    benefits?: string[];
    matchScore?: number;
    createdAt: string;
  };
  variant?: "feed" | "list";
  onApplySuccess?: () => void;
}

const typeLabels: Record<string, string> = {
  "full-time": "Tempo integral",
  "part-time": "Meio período",
  contract: "Contrato",
  internship: "Estágio",
};

const levelLabels: Record<string, string> = {
  junior: "Júnior",
  mid: "Pleno",
  senior: "Sênior",
  lead: "Lead",
  executive: "Executivo",
};

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} d`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} m`;

  const years = Math.floor(months / 12);
  return `${years} a`;
}

export default function JobCard({
  job,
  variant = "feed",
  onApplySuccess,
}: JobCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const viewTracked = useRef(false);
  const viewStartTime = useRef<number | null>(null);

  // Estados para interações sociais
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(
    null
  );
  const [reactionsCount, setReactionsCount] = useState({
    like: 0,
    celebrate: 0,
    support: 0,
    interesting: 0,
    funny: 0,
    love: 0,
  });
  const [commentsCount, setCommentsCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSendMessage, setShowSendMessage] = useState(false);

  const formattedCreatedAt = useMemo(
    () => formatRelativeTime(job.createdAt),
    [job.createdAt]
  );

  // Verificar se vaga está salva
  useEffect(() => {
    if (!session?.user) return;

    const checkSaved = async () => {
      try {
        const response = await fetch("/api/saved-jobs");
        if (response.ok) {
          const data = await response.json();
          const saved = data.jobs?.some((j: any) => j._id === job._id);
          setIsSaved(saved);
        }
      } catch (error) {
        // Ignorar erro
      }
    };

    checkSaved();
  }, [session, job._id]);

  // Verificar se já se candidatou
  useEffect(() => {
    if (!session?.user || !job._id) {
      setCheckingApplication(false);
      return;
    }

    setCheckingApplication(true);
    const checkApplication = async () => {
      try {
        const response = await fetch(
          `/api/applications/check?jobId=${job._id}`
        );
        if (response.ok) {
          const data = await response.json();
          setHasApplied(data.hasApplied);
        }
      } catch (error) {
        console.error("Error checking application:", error);
      } finally {
        setCheckingApplication(false);
      }
    };

    checkApplication();
  }, [session, job._id]);

  // Tracking de view quando card entra na viewport
  useEffect(() => {
    if (!session?.user || viewTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !viewTracked.current) {
            viewTracked.current = true;
            viewStartTime.current = Date.now();

            // Registrar view
            fetch("/api/interactions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                itemType: "job",
                itemId: job._id,
                interactionType: "view",
              }),
            }).catch(() => {});

            // Atualizar duração periodicamente
            const interval = setInterval(() => {
              if (viewStartTime.current) {
                const duration = Math.floor(
                  (Date.now() - viewStartTime.current) / 1000
                );
                if (duration > 0 && duration % 5 === 0) {
                  // Atualizar a cada 5 segundos
                  fetch("/api/interactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      itemType: "job",
                      itemId: job._id,
                      interactionType: "view",
                      duration: 5,
                    }),
                  }).catch(() => {});
                }
              }
            }, 5000);

            // Limpar quando sair da viewport
            const cleanupObserver = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (!entry.isIntersecting && viewStartTime.current) {
                    const duration = Math.floor(
                      (Date.now() - viewStartTime.current) / 1000
                    );
                    if (duration > 0) {
                      fetch("/api/interactions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          itemType: "job",
                          itemId: job._id,
                          interactionType: "view",
                          duration,
                        }),
                      }).catch(() => {});
                    }
                    viewStartTime.current = null;
                    clearInterval(interval);
                    cleanupObserver.disconnect();
                  }
                });
              },
              { threshold: 0 }
            );

            if (cardRef.current) {
              cleanupObserver.observe(cardRef.current);
            }

            return () => {
              clearInterval(interval);
              cleanupObserver.disconnect();
            };
          }
        });
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [session, job._id]);

  const handleClick = () => {
    if (session?.user) {
      fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "job",
          itemId: job._id,
          interactionType: "click",
        }),
      }).catch(() => {});
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push("/feed/auth/login");
      return;
    }

    try {
      if (isSaved) {
        const response = await fetch(`/api/saved-jobs?jobId=${job._id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setIsSaved(false);
          toast.success("Vaga removida dos salvos");
        }
      } else {
        const response = await fetch("/api/saved-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: job._id }),
        });
        if (response.ok) {
          setIsSaved(true);
          toast.success("Vaga salva com sucesso");
        }
      }
    } catch (error) {
      toast.error("Erro ao salvar/remover vaga");
    }
  };

  const handleApplyClick = () => {
    if (!session) {
      router.push("/feed/auth/login");
      return;
    }

    if (hasApplied) {
      return;
    }

    // Redirecionar para página de aplicação
    router.push(`/jobs/${job._id}/apply`);
  };

  const handleApplySuccess = () => {
    setShowApplyModal(false);
    setHasApplied(true);
    onApplySuccess?.();
  };

  // Handlers para interações sociais
  const handleReaction = async (
    jobId: string,
    reactionType: ReactionType | null
  ) => {
    // TODO: Implementar API de reações para jobs
    // Por enquanto, apenas mostra mensagem
    toast.info("Reações para vagas em breve!");
    return;
  };

  const highlightSkills = job.skills?.slice(0, 4) || [];

  return (
    <div ref={cardRef} className="bg-white rounded-lg border">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Link href={`/companies/${job.companyId._id}`}>
              <Avatar className="w-12 h-12 shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                {!job.companyId.logoUrl ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <LinkedInIcon id="company-accent-4" size={48} />
                  </div>
                ) : (
                  <>
                    <AvatarImage
                      src={job.companyId.logoUrl}
                      alt={job.companyId.name}
                    />
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                      {job.companyId.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <Link href={`/companies/${job.companyId._id}`}>
                <h4 className="font-semibold text-sm text-black leading-tight mb-0.5 truncate cursor-pointer hover:underline">
                  {job.companyId.name}
                </h4>
              </Link>
              <p className="text-xs text-black leading-tight mb-0.5 truncate">
                {job.location}
                {job.remote && " • Remoto"}
              </p>
              <p className="text-xs text-black leading-tight flex items-center gap-1">
                {formattedCreatedAt} •{" "}
                <LinkedInIcon
                  id="globe-small"
                  size={16}
                  className="text-black"
                />
              </p>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="h-8 w-8 p-0"
              title={isSaved ? "Remover dos salvos" : "Salvar vaga"}
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-blue-600" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <div className="mb-3">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-semibold text-base text-black">{job.title}</h3>
            {hasApplied && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 bg-blue-100 text-blue-700 border-blue-300 text-[11px] px-2 py-0.5"
              >
                <CheckCircle2 className="w-3 h-3" />
                Candidatado
              </Badge>
            )}
            {job.matchScore !== undefined && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 bg-green-100 text-green-700 border-green-300 text-[11px] px-2 py-0.5"
              >
                <TrendingUp className="w-3 h-3" />
                {job.matchScore}% match
              </Badge>
            )}
          </div>

          <p className="text-sm text-black leading-relaxed line-clamp-3 mb-3">
            {job.description}
          </p>

          {/* Informações da vaga */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {typeLabels[job.type] || job.type}
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {levelLabels[job.level] || job.level}
            </span>
            {job.category && (
              <Badge
                variant="outline"
                className="text-xs border-gray-300 text-gray-600 px-2 py-0.5"
              >
                {job.category}
              </Badge>
            )}
            {job.salaryRange &&
              job.salaryRange.min != null &&
              job.salaryRange.max != null && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <DollarSign className="w-3 h-3" />
                  R$ {job.salaryRange.min.toLocaleString("pt-BR")} - R${" "}
                  {job.salaryRange.max.toLocaleString("pt-BR")}
                </span>
              )}
          </div>

          {/* Skills */}
          {highlightSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {highlightSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="border-blue-200 bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-gray-200 pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleApplyClick}
            disabled={hasApplied || checkingApplication}
            className="flex-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Briefcase className="w-4 h-4 mr-1.5" />
            {checkingApplication
              ? "Verificando..."
              : hasApplied
              ? "Você já se candidatou"
              : "Candidatar-se"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex-1 text-sm font-medium"
          >
            <Link href={`/jobs/${job._id}`}>
              Ver detalhes
              <ExternalLink className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>

        {/* Separator */}
        <div className="border-b border-gray-200 mt-3 mb-2"></div>

        {/* Engagement Stats */}
        <div className="flex justify-between items-center text-xs text-gray-500 pb-2">
          <div className="flex items-center gap-2">
            {(() => {
              const activeReactions = [
                { type: "like" as const, count: reactionsCount.like },
                { type: "love" as const, count: reactionsCount.love },
                { type: "celebrate" as const, count: reactionsCount.celebrate },
              ].filter((r) => r.count > 0);

              const totalReactions = activeReactions.reduce(
                (sum, r) => sum + r.count,
                0
              );

              if (totalReactions === 0) return null;

              return (
                <div className="flex items-center gap-2">
                  {/* Ícones de reação sobrepostos */}
                  <div className="flex items-center -space-x-2">
                    {activeReactions.map((reaction, index) => {
                      const iconMap = {
                        like: "/images/icons/like.svg",
                        love: "/images/icons/amei.svg",
                        celebrate: "/images/icons/parabens.svg",
                      };
                      const bgColorMap = {
                        like: "#378fe9",
                        love: "#df704d",
                        celebrate: "#6dae4f",
                      };

                      return (
                        <div
                          key={`reaction-${reaction.type}`}
                          className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-white relative"
                          style={{
                            backgroundColor: bgColorMap[reaction.type],
                            zIndex: activeReactions.length - index,
                          }}
                        >
                          <img
                            src={iconMap[reaction.type]}
                            alt={reaction.type}
                            className="w-3 h-3"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Contagem total */}
                  <span className="text-black font-medium ml-1">
                    {totalReactions}
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="text-black flex items-center gap-2">
            <span className="hover:underline cursor-pointer hover:text-black">
              {commentsCount} comentários
            </span>
          </div>
        </div>

        {/* Separator */}
        <div className="border-b mb-2"></div>

        {/* Action Buttons - Social Interactions */}
        <div className="flex justify-between items-center text-black">
          <ReactionButton
            postId={job._id}
            currentReaction={currentReaction}
            reactionsCount={Object.values(reactionsCount).reduce(
              (a, b) => a + b,
              0
            )}
            onReaction={handleReaction}
          />
          <button
            onClick={() => {
              setShowComments(!showComments);
              // Registrar interação de comentário quando abre
              if (!showComments && session?.user) {
                fetch("/api/interactions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    itemType: "job",
                    itemId: job._id,
                    interactionType: "comment",
                  }),
                }).catch(() => {});
              }
            }}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors flex-1 justify-center"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Comentar</span>
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors flex-1 justify-center"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Compartilhar</span>
          </button>
          <button
            onClick={() => setShowSendMessage(true)}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors flex-1 justify-center"
          >
            <Send className="w-5 h-5" />
            <span className="text-sm font-medium">Enviar</span>
          </button>
        </div>
      </div>

      {/* Comment Section */}
      {showComments && (
        <CommentSection postId={job._id} isExpanded={showComments} />
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={{
          _id: job._id,
          content: job.description,
          companyId: job.companyId,
        }}
      />

      {/* Send Message Popup */}
      <SendMessagePopup
        isOpen={showSendMessage}
        onClose={() => setShowSendMessage(false)}
        post={{
          _id: job._id,
          content: job.description,
          companyId: job.companyId,
        }}
      />
    </div>
  );
}
