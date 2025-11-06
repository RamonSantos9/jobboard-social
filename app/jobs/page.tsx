"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import LeftSidebarJobs from "./components/LeftSidebarJobs";
import CreateJobModal from "@/components/CreateJobModal";
import { Plus, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    name: string;
    logoUrl?: string;
  };
  createdAt: string;
  matchScore?: number;
  matchBreakdown?: {
    skills: number;
    location: number;
    level: number;
    sector: number;
  };
}

export default function JobsPage() {
  const { data: session } = useSession();
  const router = useRouter();
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
      // Se usuário está logado, buscar vagas recomendadas
      let response;
      if (session) {
        response = await fetch("/api/jobs/recommended");
      } else {
        response = await fetch("/api/jobs");
      }

      const data = await response.json();
      if (response.ok) {
        setJobs(data.jobs);
      } else {
        toast.error("Erro ao carregar vagas");
      }
    } catch (error) {
      toast.error("Erro ao carregar vagas");
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = () => {
    fetchJobs(); // Recarregar vagas após criar
  };

  const handleApply = async (jobId: string) => {
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
        body: JSON.stringify({ jobId }),
      });

      if (response.ok) {
        toast.success("Candidatura enviada com sucesso!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao enviar candidatura");
      }
    } catch (error) {
      toast.error("Erro ao enviar candidatura");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    return (
      job.title.toLowerCase().includes(filters.search.toLowerCase()) &&
      (filters.location === "" ||
        job.location.toLowerCase().includes(filters.location.toLowerCase())) &&
      (filters.type === "" || job.type === filters.type) &&
      (filters.level === "" || job.level === filters.level)
    );
  });

  return (
    <div className="bg-gray-50">
      <Header />

      <div className="flex max-w-7xl mx-auto px-4 mt-10">
        {/* Sidebar fixa */}
        <LeftSidebarJobs />

        {/* Conteúdo principal */}
        <main className="flex-1 px-4">
          {/* Header com botão Anunciar Vaga */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vagas de Emprego</h1>
              {session && jobs.length > 0 && jobs[0].matchScore !== undefined && (
                <p className="text-sm text-gray-600 mt-1">
                  Vagas personalizadas para você
                </p>
              )}
            </div>
            {session && (
              <Button onClick={() => setCreateJobModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Anunciar Vaga
              </Button>
            )}
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar
                  </label>
                  <input
                    type="text"
                    placeholder="Título da vaga..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localização
                  </label>
                  <input
                    type="text"
                    placeholder="Cidade, estado..."
                    value={filters.location}
                    onChange={(e) =>
                      setFilters({ ...filters, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) =>
                      setFilters({ ...filters, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    <option value="full-time">Tempo integral</option>
                    <option value="part-time">Meio período</option>
                    <option value="contract">Contrato</option>
                    <option value="internship">Estágio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nível
                  </label>
                  <select
                    value={filters.level}
                    onChange={(e) =>
                      setFilters({ ...filters, level: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    <option value="junior">Júnior</option>
                    <option value="mid">Pleno</option>
                    <option value="senior">Sênior</option>
                    <option value="lead">Lead</option>
                    <option value="executive">Executivo</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jobs List */}
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-600">
                    Nenhuma vaga encontrada com os filtros aplicados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredJobs.map((job) => (
                <Card key={job._id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {job.title}
                          </h3>
                          {job.matchScore !== undefined && (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200"
                            >
                              <TrendingUp className="w-3 h-3" />
                              {job.matchScore}% match
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span>{job.companyId.name}</span>
                          <span>•</span>
                          <span>{job.location}</span>
                          {job.remote && <span>•</span>}
                          {job.remote && <span>Remoto</span>}
                          <span>•</span>
                          <span className="capitalize">{job.type}</span>
                          <span>•</span>
                          <span className="capitalize">{job.level}</span>
                        </div>
                        <p className="text-gray-700 mb-4 line-clamp-3">
                          {job.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {job.category}
                            </span>
                          )}
                        </div>
                        {job.salaryRange && (
                          <p className="text-sm text-green-600 font-medium">
                            R$ {job.salaryRange.min.toLocaleString()} - R${" "}
                            {job.salaryRange.max.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        <Button asChild>
                          <Link href={`/jobs/${job._id}`}>Ver Detalhes</Link>
                        </Button>
                        {session && (
                          <Button
                            variant="outline"
                            onClick={() => handleApply(job._id)}
                          >
                            Candidatar-se
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
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
