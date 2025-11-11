"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
} from "lucide-react";
import LinkedInIcon from "./LinkedInIcon";
import ApplyJobModal from "./ApplyJobModal";

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

  const formattedCreatedAt = useMemo(
    () => formatRelativeTime(job.createdAt),
    [job.createdAt]
  );

  const handleApplyClick = () => {
    if (!session) {
      router.push("/feed/auth/login");
      return;
    }
    setShowApplyModal(true);
  };

  const handleApplySuccess = () => {
    setShowApplyModal(false);
    onApplySuccess?.();
  };

  const highlightSkills = job.skills?.slice(0, 4) || [];
  const showSecondaryInfo = variant === "list";

  return (
    <Card
      className={
        variant === "feed"
          ? "border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow rounded-lg"
          : "border border-blue-200 bg-blue-50/40 rounded-lg"
      }
    >
      <CardHeader className="pb-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="w-12 h-12 border border-gray-200">
              {!job.companyId.logoUrl ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <LinkedInIcon id="company-accent-4" size={48} />
                </div>
              ) : (
                <>
                  <AvatarImage src={job.companyId.logoUrl} />
                  <AvatarFallback className="bg-gray-100 text-gray-600">
                    {job.companyId.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-base text-gray-900">
                  {job.title}
                </h3>
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
              <p className="text-sm text-gray-600 mb-1">{job.companyId.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {job.location}
                </span>
                {job.remote && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    Remoto
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {typeLabels[job.type] || job.type}
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {levelLabels[job.level] || job.level}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formattedCreatedAt}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4 space-y-3">
        <p className="text-sm text-gray-900 leading-relaxed line-clamp-3">
          {job.description}
        </p>

        {highlightSkills.length > 0 && (
          <div className="flex flex-wrap gap-2">
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

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-700">
            {job.salaryRange &&
              job.salaryRange.min !== undefined &&
              job.salaryRange.max !== undefined && (
                <div className="flex items-center gap-1 text-green-600 font-medium">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    R$ {job.salaryRange.min.toLocaleString("pt-BR")} - R${" "}
                    {job.salaryRange.max.toLocaleString("pt-BR")}
                  </span>
                </div>
              )}
            {job.category && (
              <Badge
                variant="outline"
                className="text-xs border-gray-300 text-gray-600 px-2 py-0.5"
              >
                {job.category}
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="text-sm">
              <Link href={`/jobs/${job._id}`}>
                Ver detalhes
                <ExternalLink className="w-3 h-3 ml-1" />
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={handleApplyClick}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Briefcase className="w-3 h-3 mr-1" />
              Candidatar-se
            </Button>
          </div>
        </div>

        {showSecondaryInfo && job.benefits && job.benefits.length > 0 && (
          <div className="border-t border-blue-100 pt-3">
            <p className="text-xs uppercase text-blue-700 font-semibold mb-2">
              Benefícios principais
            </p>
            <div className="flex flex-wrap gap-2">
              {job.benefits.slice(0, 4).map((benefit) => (
                <Badge
                  key={benefit}
                  variant="outline"
                  className="bg-white text-blue-700 border-blue-200 text-[11px]"
                >
                  {benefit}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <ApplyJobModal
        open={showApplyModal}
        onOpenChange={setShowApplyModal}
        jobId={job._id}
        jobTitle={job.title}
        companyName={job.companyId.name}
        onApplySuccess={handleApplySuccess}
      />
    </Card>
  );
}
