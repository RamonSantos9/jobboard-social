"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import { ScrollWrapper } from "@/components/dashboard/scroll-wrapper";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase,
  Calendar,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  ArrowLeft,
  User,
  MapPin,
  GraduationCap,
  Building,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const companyId = params.id as string;
  const applicationId = params.applicationId as string;

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/feed/auth/login");
      return;
    }

    const checkAccess = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}/check-access`);
        if (!response.ok) {
          router.push(`/company/${companyId}`);
          return;
        }
        fetchApplication();
      } catch (error) {
        console.error("Error checking access:", error);
        router.push(`/company/${companyId}`);
      }
    };

    if (companyId) {
      checkAccess();
    }
  }, [session, status, router, companyId]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/companies/${companyId}/applications/${applicationId}`
      );
      if (response.ok) {
        const data = await response.json();
        setApplication(data.application);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao carregar candidatura");
      }
    } catch (error) {
      console.error("Error fetching application:", error);
      setError("Erro ao carregar candidatura");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="Detalhes da Candidatura" />
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!session) {
    return null;
  }

  if (error || !application) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="Detalhes da Candidatura" />
          <ScrollWrapper className="flex-1" variant="dashboard">
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  <div className="px-4 lg:px-6">
                    <Card>
                      <CardContent className="py-12 text-center text-gray-500">
                        {error || "Candidatura não encontrada"}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </ScrollWrapper>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Detalhes da Candidatura" />
        <ScrollWrapper className="flex-1" variant="dashboard">
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="mb-4"
                  >
                    <Link href={`/company/${companyId}/admin/applications`}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar para candidaturas
                    </Link>
                  </Button>

                  <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    {/* Informações Principais */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage
                                src={application.candidateId?.profile?.photoUrl}
                              />
                              <AvatarFallback>
                                {(application.candidateName ||
                                  application.candidateId?.name ||
                                  "C")[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-2xl">
                                {application.candidateName ||
                                  application.candidateId?.name ||
                                  "Candidato"}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {application.jobId?.title || "Vaga"}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge
                            variant={
                              application.status === "accepted"
                                ? "default"
                                : application.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {application.status === "accepted"
                              ? "Aceita"
                              : application.status === "rejected"
                              ? "Rejeitada"
                              : "Pendente"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Informações de Contato */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Informações de Contato
                          </h3>
                          <Separator className="mb-3" />
                          <div className="space-y-2">
                            {(application.candidateEmail ||
                              application.candidateId?.email) && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-700">
                                  {application.candidateEmail ||
                                    application.candidateId?.email}
                                </span>
                              </div>
                            )}
                            {application.candidatePhone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-700">
                                  {application.candidatePhone}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">
                                Candidatou-se em{" "}
                                {new Date(application.createdAt).toLocaleDateString(
                                  "pt-BR",
                                  {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Carta de Apresentação */}
                        {application.coverLetter && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                              Carta de Apresentação
                            </h3>
                            <Separator className="mb-3" />
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {application.coverLetter}
                            </p>
                          </div>
                        )}

                        {/* Informações Adicionais */}
                        {application.additionalInfo && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                              Informações Adicionais
                            </h3>
                            <Separator className="mb-3" />
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                              {application.additionalInfo}
                            </p>
                          </div>
                        )}

                        {/* Currículo */}
                        {application.resumeUrl && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                              Currículo
                            </h3>
                            <Separator className="mb-3" />
                            <a
                              href={application.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              Ver currículo PDF
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        )}

                        {/* Dados Profissionais */}
                        {application.profileSnapshot && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                              Dados Profissionais
                            </h3>
                            <Separator className="mb-3" />
                            <div className="space-y-4">
                              {application.profileSnapshot.headline && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">
                                    Título Profissional
                                  </p>
                                  <p className="text-sm text-gray-900">
                                    {application.profileSnapshot.headline}
                                  </p>
                                </div>
                              )}

                              {(application.profileSnapshot.currentTitle ||
                                application.profileSnapshot.currentCompany) && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">
                                    Cargo Atual
                                  </p>
                                  <p className="text-sm text-gray-900">
                                    {application.profileSnapshot.currentTitle}
                                    {application.profileSnapshot.currentCompany &&
                                      ` na ${application.profileSnapshot.currentCompany}`}
                                  </p>
                                </div>
                              )}

                              {application.profileSnapshot.location && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">
                                    Localização
                                  </p>
                                  <p className="text-sm text-gray-900">
                                    {application.profileSnapshot.location}
                                  </p>
                                </div>
                              )}

                              {application.profileSnapshot.skills &&
                                application.profileSnapshot.skills.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 mb-2">
                                      Habilidades
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {application.profileSnapshot.skills.map(
                                        (skill: string, index: number) => (
                                          <Badge
                                            key={index}
                                            variant="outline"
                                            className="border-blue-200 bg-blue-50 text-blue-700"
                                          >
                                            {skill}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                              {application.profileSnapshot.experience &&
                                application.profileSnapshot.experience.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 mb-2">
                                      Experiência Profissional
                                    </p>
                                    <div className="space-y-3">
                                      {application.profileSnapshot.experience.map(
                                        (exp: any, index: number) => (
                                          <div
                                            key={index}
                                            className="border-l-2 border-gray-200 pl-3"
                                          >
                                            <p className="text-sm font-medium text-gray-900">
                                              {exp.title}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                              {exp.company}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {new Date(
                                                exp.startDate
                                              ).toLocaleDateString("pt-BR", {
                                                month: "short",
                                                year: "numeric",
                                              })}{" "}
                                              -{" "}
                                              {exp.current
                                                ? "Atual"
                                                : exp.endDate
                                                ? new Date(
                                                    exp.endDate
                                                  ).toLocaleDateString("pt-BR", {
                                                    month: "short",
                                                    year: "numeric",
                                                  })
                                                : "N/A"}
                                            </p>
                                            {exp.description && (
                                              <p className="text-xs text-gray-600 mt-1">
                                                {exp.description}
                                              </p>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                              {application.profileSnapshot.education &&
                                application.profileSnapshot.education.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 mb-2">
                                      Formação Acadêmica
                                    </p>
                                    <div className="space-y-3">
                                      {application.profileSnapshot.education.map(
                                        (edu: any, index: number) => (
                                          <div
                                            key={index}
                                            className="border-l-2 border-gray-200 pl-3"
                                          >
                                            <p className="text-sm font-medium text-gray-900">
                                              {edu.degree}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                              {edu.institution} - {edu.fieldOfStudy}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {new Date(
                                                edu.startDate
                                              ).toLocaleDateString("pt-BR", {
                                                month: "short",
                                                year: "numeric",
                                              })}{" "}
                                              -{" "}
                                              {edu.current
                                                ? "Atual"
                                                : edu.endDate
                                                ? new Date(
                                                    edu.endDate
                                                  ).toLocaleDateString("pt-BR", {
                                                    month: "short",
                                                    year: "numeric",
                                                  })
                                                : "N/A"}
                                            </p>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Sidebar */}
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Ações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Button variant="outline" className="w-full" asChild>
                            <Link
                              href={`/jobboard/${application.candidateId?._id}`}
                            >
                              <User className="w-4 h-4 mr-2" />
                              Ver Perfil Completo
                            </Link>
                          </Button>
                          {application.resumeUrl && (
                            <Button variant="outline" className="w-full" asChild>
                              <a
                                href={application.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Baixar Currículo
                              </a>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </ScrollWrapper>
        </SidebarInset>
      </SidebarProvider>
    );

}

