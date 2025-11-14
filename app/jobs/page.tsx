"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Header from "@/components/Header";
import LeftSidebarJobs from "./components/LeftSidebarJobs";
import CreateJobModal from "@/components/CreateJobModal";
import JobCard from "@/components/JobCard";
import JobCardSkeleton from "@/components/JobCardSkeleton";
import { Badge } from "@/components/ui/badge";
import { Compass, Plus, Sparkles, Wand2 } from "lucide-react";

interface Job {
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
  createdAt: string;
  matchScore?: number;
  matchBreakdown?: {
    skills: number;
    location: number;
    level: number;
    sector: number;
  };
  skills?: string[];
  benefits?: string[];
}

export default function JobsPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [createJobModalOpen, setCreateJobModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    type: "",
    level: "",
  });

  useEffect(() => {
    fetchJobs(true, 1);
  }, [session]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      // Carregar mais quando estiver a 200px do fim
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, loadingMore, page]);

  const fetchJobs = async (isInitialLoad = false, pageNum = 1) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Usar feed recomendado se usuário estiver logado, senão usar feed padrão
      const endpoint = session?.user
        ? `/api/feed/recommended?page=${pageNum}&limit=10`
        : `/api/jobs?page=${pageNum}&limit=10`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (response.ok) {
        if (session?.user && data.items) {
          // Feed recomendado retorna items (filtrar apenas jobs e mapear)
          const jobItems = data.items
            .filter((item: any) => item.type === "job")
            .map((item: any) => ({
              _id: item._id,
              title: item.title,
              description: item.description,
              location: item.location,
              remote: item.remote,
              type: item.jobType || item.type,
              level: item.level,
              category: item.category,
              salaryRange: item.salaryRange,
              companyId: item.companyId,
              skills: item.skills || [],
              benefits: item.benefits || [],
              matchScore: item.matchScore,
              createdAt: item.createdAt,
            }));
          if (isInitialLoad) {
            setJobs(jobItems);
          } else {
            setJobs((prev) => [...prev, ...jobItems]);
          }
          setHasMore(data.pagination?.hasMore ?? false);
        } else if (data.jobs) {
          // Feed padrão retorna jobs
          if (isInitialLoad) {
            setJobs(data.jobs);
          } else {
            setJobs((prev) => [...prev, ...data.jobs]);
          }
          setHasMore(
            data.pagination
              ? data.pagination.page < data.pagination.pages
              : data.jobs.length === 10
          );
        }
      } else {
        if (isInitialLoad) {
          toast.error(data.error || "Erro ao carregar vagas");
        }
        setJobs([]);
      }
    } catch (error) {
      console.error("Erro ao buscar vagas:", error);
      if (isInitialLoad) {
        toast.error("Erro ao carregar vagas");
      }
      setJobs([]);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchJobs(false, nextPage);
  };

  const handleJobCreated = () => {
    // Resetar e recarregar vagas após criar
    setPage(1);
    setJobs([]);
    fetchJobs(true, 1);
  };

  const filteredJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          (filters.location === "" ||
            job.location
              .toLowerCase()
              .includes(filters.location.toLowerCase())) &&
          (filters.type === "" || job.type === filters.type) &&
          (filters.level === "" || job.level === filters.level)
      ),
    [jobs, filters]
  );

  return (
    <div className="bg-[#f3f2ef] min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block flex-shrink-0 w-64">
            <div className="sticky top-[80px] h-[calc(100vh-6rem)] overflow-y-auto">
              <LeftSidebarJobs />
            </div>
          </aside>

          <main className="flex-1 space-y-4 lg:ml-0">
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <JobCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredJobs.length === 0 ? (
                <Card className="border border-gray-200 bg-white rounded-lg shadow-sm">
                  <CardContent className="py-12 text-center text-gray-500">
                    <p className="text-base font-medium text-gray-700 mb-1">
                      Nenhuma vaga encontrada
                    </p>
                    <p className="text-sm text-gray-500">
                      Tente ajustar os filtros ou buscar por outros termos.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {filteredJobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      variant="list"
                      onApplySuccess={() =>
                        toast.success("Candidatura enviada com sucesso!")
                      }
                    />
                  ))}
                  {loadingMore && (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <JobCardSkeleton key={`loading-${i}`} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          <aside className="hidden lg:block flex-shrink-0 w-80 space-y-4">
            <Card className="border border-gray-200 bg-white rounded-lg shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Dicas para sua busca
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3 text-sm text-gray-600">
                <p className="leading-relaxed">
                  Atualize seu perfil para aumentar suas chances de ser
                  encontrado por recrutadores.
                </p>
                <p className="leading-relaxed">
                  Salve suas vagas favoritas para acompanhar oportunidades
                  importantes.
                </p>
                <Button variant="outline" size="sm" className="w-full text-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Otimizar perfil
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white rounded-lg shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Vagas com alta demanda
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-1"
                  >
                    Desenvolvedor React
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-1"
                  >
                    Engenheiro de Dados
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-1"
                  >
                    Especialista em Cloud
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      {/* Modal de Criar Vaga */}
      {session && (
        <CreateJobModal
          open={createJobModalOpen}
          onOpenChange={setCreateJobModalOpen}
          onJobCreated={handleJobCreated}
        />
      )}
    </div>
  );
}
