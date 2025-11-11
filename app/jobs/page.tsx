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
  const [createJobModalOpen, setCreateJobModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    type: "",
    level: "",
  });

  useEffect(() => {
    fetchJobs();
  }, [session]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Se usuário está logado, buscar vagas recomendadas
      const url = session ? "/api/jobs/recommended" : "/api/jobs";
      const response = await fetch(url);

      const data = await response.json();

      if (response.ok) {
        console.log(`Vagas recebidas: ${data.jobs?.length || 0}`);
        if (data.jobs && Array.isArray(data.jobs)) {
          setJobs(data.jobs);
        } else {
          console.error("Formato de dados inválido:", data);
          setJobs([]);
        }
      } else {
        console.error("Erro na resposta:", data);
        toast.error(data.error || "Erro ao carregar vagas");
        setJobs([]);
      }
    } catch (error) {
      console.error("Erro ao buscar vagas:", error);
      toast.error("Erro ao carregar vagas");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = () => {
    fetchJobs(); // Recarregar vagas após criar
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
                <Card className="border border-gray-200 bg-white rounded-lg shadow-sm">
                  <CardContent className="py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span>Carregando vagas...</span>
                    </div>
                  </CardContent>
                </Card>
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
                filteredJobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    variant="list"
                    onApplySuccess={() =>
                      toast.success("Candidatura enviada com sucesso!")
                    }
                  />
                ))
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
