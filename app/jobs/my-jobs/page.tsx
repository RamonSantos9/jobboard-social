"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import JobCard from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark, Briefcase, Clock } from "lucide-react";
import { toast } from "sonner";

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
  skills?: string[];
  benefits?: string[];
  createdAt: string;
}

interface Application {
  _id: string;
  jobId: Job;
  status: string;
  appliedAt: string;
  coverLetter?: string;
}

export default function MyJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("saved");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/feed/auth/login");
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      // Buscar vagas salvas
      const savedResponse = await fetch("/api/saved-jobs");
      if (savedResponse.ok) {
        const savedData = await savedResponse.json();
        setSavedJobs(savedData.jobs || []);
      }

      // Buscar candidaturas
      const applicationsResponse = await fetch("/api/applications");
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        setApplications(applicationsData.applications || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar suas vagas");
    } finally {
      setLoading(false);
    }
  };

  const handleJobRemoved = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Minhas Vagas</h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas vagas salvas e acompanhe suas candidaturas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            Vagas Salvas ({savedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Candidaturas ({applications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="space-y-4">
          {savedJobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <Bookmark className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma vaga salva
              </h3>
              <p className="text-gray-600 mb-4">
                Comece a salvar vagas interessantes para acessá-las facilmente
                depois
              </p>
              <Button onClick={() => router.push("/jobs")}>
                Explorar Vagas
              </Button>
            </div>
          ) : (
            savedJobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onApplySuccess={handleJobRemoved}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma candidatura
              </h3>
              <p className="text-gray-600 mb-4">
                Você ainda não se candidatou a nenhuma vaga
              </p>
              <Button onClick={() => router.push("/jobs")}>Buscar Vagas</Button>
            </div>
          ) : (
            applications.map((application) => (
              <div
                key={application._id}
                className="bg-white rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <JobCard
                      job={application.jobId}
                      onApplySuccess={handleJobRemoved}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Candidatado em{" "}
                    {new Date(application.appliedAt).toLocaleDateString(
                      "pt-BR"
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        application.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : application.status === "reviewing"
                          ? "bg-blue-100 text-blue-800"
                          : application.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {application.status === "pending"
                        ? "Pendente"
                        : application.status === "reviewing"
                        ? "Em Análise"
                        : application.status === "accepted"
                        ? "Aceito"
                        : "Rejeitado"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
