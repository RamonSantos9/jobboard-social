"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, MapPin, DollarSign, TrendingUp, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

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
    };
    matchScore?: number;
    createdAt: string;
  };
}

export default function JobCard({ job }: JobCardProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const formatJobType = (type: string) => {
    const types: Record<string, string> = {
      "full-time": "Tempo integral",
      "part-time": "Meio período",
      contract: "Contrato",
      internship: "Estágio",
    };
    return types[type] || type;
  };

  const formatLevel = (level: string) => {
    const levels: Record<string, string> = {
      junior: "Júnior",
      mid: "Pleno",
      senior: "Sênior",
      lead: "Lead",
      executive: "Executivo",
    };
    return levels[level] || level;
  };

  const handleApply = async () => {
    if (!session) {
      router.push("/auth/login");
      return;
    }

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId: job._id }),
      });

      if (response.ok) {
        // Sucesso - pode adicionar toast aqui se necessário
      }
    } catch (error) {
      console.error("Error applying to job:", error);
    }
  };

  return (
    <Card className="border-2 border-blue-100 bg-blue-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="w-12 h-12 border-2 border-white">
              <AvatarImage
                src={job.companyId.logoUrl || "/placeholder-avatar.svg"}
              />
              <AvatarFallback>
                {job.companyId.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-gray-900">
                  {job.title}
                </h3>
                {job.matchScore !== undefined && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 bg-green-100 text-green-700 border-green-300 text-xs"
                  >
                    <TrendingUp className="w-3 h-3" />
                    {job.matchScore}% match
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{job.companyId.name}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <MapPin className="w-3 h-3" />
                  <span>{job.location}</span>
                  {job.remote && <span className="ml-1">• Remoto</span>}
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-600">
                  {formatJobType(job.type)}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-600">
                  {formatLevel(job.level)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
          {job.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {job.salaryRange && (
              <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <DollarSign className="w-4 h-4" />
                <span>
                  R$ {job.salaryRange.min.toLocaleString()} - R${" "}
                  {job.salaryRange.max.toLocaleString()}
                </span>
              </div>
            )}
            {job.category && (
              <Badge variant="outline" className="text-xs">
                {job.category}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/jobs/${job._id}`}>
                Ver Detalhes
                <ExternalLink className="w-3 h-3 ml-1" />
              </Link>
            </Button>
            {session && (
              <Button size="sm" onClick={handleApply}>
                <Briefcase className="w-3 h-3 mr-1" />
                Candidatar-se
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
