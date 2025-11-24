"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Building,
  Clock,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface VacancyDetail {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
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
  createdAt: string;
  companyId: {
    _id: string;
    name: string;
    logoUrl?: string;
    description?: string;
    location?: string;
    industry?: string;
    size?: string;
  };
}

export default function VacancyDetailPage() {
  const params = useParams();
  const vacancyId = params.id as string;
  const [vacancy, setVacancy] = useState<VacancyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchVacancy = async () => {
      try {
        const response = await fetch(`/api/jobs/${vacancyId}`);
        const data = await response.json();

        if (response.ok) {
          setVacancy(data.job);
        } else {
          setError(data.error || "Vaga não encontrada");
        }
      } catch (err) {
        setError("Erro ao carregar vaga");
      } finally {
        setLoading(false);
      }
    };

    if (vacancyId) {
      fetchVacancy();
    }
  }, [vacancyId]);

  useEffect(() => {
    const checkApplication = async () => {
      if (!session || !vacancyId) {
        setCheckingApplication(false);
        return;
      }

      try {
        const response = await fetch(`/api/applications/check?jobId=${vacancyId}`);
        if (response.ok) {
          const data = await response.json();
          setHasApplied(data.hasApplied);
        }
      } catch (err) {
        console.error("Error checking application:", err);
      } finally {
        setCheckingApplication(false);
      }
    };

    checkApplication();
  }, [session, vacancyId]);

  const handleApply = () => {
    if (!session) {
      router.push("/feed/auth/login");
      return;
    }

    if (hasApplied) {
      return;
    }

    router.push(`/jobs/${vacancyId}/apply`);
  };

  return (
    <div className="bg-[#f3f2ef] min-h-screen">
      <Header />
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para vagas
        </Link>

        {loading ? (
          <Card className="mt-6 border border-gray-200 bg-white">
            <CardContent className="py-12 text-center text-gray-500">
              Carregando detalhes da vaga...
            </CardContent>
          </Card>
        ) : error || !vacancy ? (
          <Card className="mt-6 border border-gray-200 bg-white">
            <CardContent className="py-12 text-center text-gray-500">
              {error || "Vaga não encontrada"}
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <CardTitle className="text-2xl font-semibold text-gray-900">
                      {vacancy.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{vacancy.companyId.name}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {vacancy.location}
                    </span>
                    {vacancy.remote && (
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                        Remoto
                      </Badge>
                    )}
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {vacancy.type}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Publicado em {new Date(vacancy.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {vacancy.salaryRange && vacancy.salaryRange.min != null && vacancy.salaryRange.max != null && (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                      <DollarSign className="w-4 h-4" />
                      R$ {vacancy.salaryRange.min.toLocaleString("pt-BR")} - R$ {vacancy.salaryRange.max.toLocaleString("pt-BR")}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                      {vacancy.level}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                      {vacancy.category}
                    </Badge>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="gap-2"
                      onClick={handleApply}
                      disabled={hasApplied || checkingApplication}
                    >
                      <Briefcase className="w-4 h-4" />
                      {checkingApplication
                        ? "Verificando..."
                        : hasApplied
                        ? "Você já se candidatou"
                        : "Candidatar-se agora"}
                    </Button>
                    <Button variant="outline" className="border-gray-300">
                      Salvar vaga
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <section>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Descrição</h2>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {vacancy.description}
                  </p>
                </section>

                {vacancy.requirements.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Requisitos</h3>
                    <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                      {vacancy.requirements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {vacancy.responsibilities.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Responsabilidades</h3>
                    <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                      {vacancy.responsibilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {vacancy.skills.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Habilidades desejadas</h3>
                    <div className="flex flex-wrap gap-2">
                      {vacancy.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}

                {vacancy.benefits.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefícios</h3>
                    <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                      {vacancy.benefits.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-lg">
                    {vacancy.companyId.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {vacancy.companyId.name}
                    </CardTitle>
                    {vacancy.companyId.industry && (
                      <p className="text-sm text-gray-500">{vacancy.companyId.industry}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-700">
                {vacancy.companyId.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-[2px] text-gray-500" />
                    <span>{vacancy.companyId.location}</span>
                  </div>
                )}
                {vacancy.companyId.size && (
                  <div className="flex items-start gap-2">
                    <Building className="w-4 h-4 mt-[2px] text-gray-500" />
                    <span>Tamanho da empresa: {vacancy.companyId.size}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 mt-[2px] text-gray-500" />
                  <span>Empresa verificada na plataforma</span>
                </div>
                {vacancy.companyId.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {vacancy.companyId.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

