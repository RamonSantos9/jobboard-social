"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Building2,
  MapPin,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
} from "lucide-react";
import Link from "next/link";

interface UserVacancy {
  _id: string;
  title: string;
  status: string;
  companyId: {
    _id: string;
    name: string;
    logoUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  location: string;
  type: string;
  level: string;
}

export default function JobAccountPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [vacancies, setVacancies] = useState<UserVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (session) {
      fetchVacancies();
    }
  }, [session, page]);

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vacancies/user?page=${page}&limit=20`);

      if (!response.ok) {
        throw new Error("Erro ao buscar vagas");
      }

      const data = await response.json();
      setVacancies((prev) =>
        page === 1 ? data.vacancies : [...prev, ...data.vacancies]
      );
      setHasMore(data.pagination.page < data.pagination.totalPages);
    } catch (error) {
      console.error("Erro ao buscar vagas:", error);
      toast.error("Erro ao carregar vagas");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            Publicada
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <Clock className="mr-1 h-3 w-3" />
            Rascunho
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Pause className="mr-1 h-3 w-3" />
            Pausada
          </Badge>
        );
      case "closed":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="mr-1 h-3 w-3" />
            Fechada
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      "full-time": "Tempo integral",
      "part-time": "Meio período",
      contract: "Contrato",
      internship: "Estágio",
    };
    return types[type] || type;
  };

  const getLevelLabel = (level: string) => {
    const levels: Record<string, string> = {
      junior: "Júnior",
      mid: "Pleno",
      senior: "Sênior",
      lead: "Líder",
      executive: "Executivo",
    };
    return levels[level] || level;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Conta de anúncio de vaga
            </h1>
            <p className="text-gray-600 mt-2">
              Gerencie as vagas que você anunciou
            </p>
          </div>

          {/* Vacancies List */}
          {loading && page === 1 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-1/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : vacancies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 text-lg">
                  Você ainda não anunciou nenhuma vaga
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/jobs/create")}
                >
                  Anunciar primeira vaga
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {vacancies.map((vacancy) => (
                <Card
                  key={vacancy._id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {vacancy.companyId.logoUrl && (
                            <img
                              src={vacancy.companyId.logoUrl}
                              alt={vacancy.companyId.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {vacancy.title}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {vacancy.companyId.name}
                            </p>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(vacancy.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {vacancy.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {getTypeLabel(vacancy.type)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Nível:</span>
                        {getLevelLabel(vacancy.level)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Criada em {formatDate(vacancy.createdAt)}
                          {vacancy.publishedAt &&
                            ` • Publicada em ${formatDate(vacancy.publishedAt)}`}
                        </span>
                      </div>
                      <Link href={`/jobs/${vacancy._id}`}>
                        <Button variant="outline" size="sm">
                          Ver vaga
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {hasMore && (
                <div className="text-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loading}
                  >
                    {loading ? "Carregando..." : "Carregar mais"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

