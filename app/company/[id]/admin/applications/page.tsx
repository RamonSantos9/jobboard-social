"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import { ScrollWrapper } from "@/components/dashboard/scroll-wrapper";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Briefcase, Calendar, User, Filter, Mail, Phone, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function CompanyApplicationsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const companyId = params.id as string;
  const userId = searchParams.get("userId");
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}/applications`);
        if (response.ok) {
          const data = await response.json();
          let filtered = data.applications || [];
          
          // Filtrar por userId se fornecido
          if (userId) {
            filtered = filtered.filter(
              (app: any) => app.candidateId?._id?.toString() === userId
            );
          }
          
          // Filtrar por status
          if (statusFilter !== "all") {
            filtered = filtered.filter(
              (app: any) => app.status === statusFilter
            );
          }
          
          setApplications(filtered);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchApplications();
    }
  }, [companyId, userId, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Candidaturas" />
        <ScrollWrapper className="flex-1" variant="dashboard">
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5" />
                          Candidaturas ({applications.length})
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filtrar por status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              <SelectItem value="pending">Pendentes</SelectItem>
                              <SelectItem value="accepted">Aceitas</SelectItem>
                              <SelectItem value="rejected">Rejeitadas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {applications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Nenhuma candidatura encontrada
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {applications.map((application: any) => (
                            <Card key={application._id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={application.candidateId?.profile?.photoUrl} />
                                    <AvatarFallback>
                                      {application.candidateId?.name?.[0]?.toUpperCase() || "C"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                          {application.candidateName || application.candidateId?.name || "Candidato"}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                          {application.jobId?.title || "Vaga"}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                                          <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(application.createdAt).toLocaleDateString("pt-BR")}
                                          </span>
                                          {(application.candidateEmail || application.candidateId?.email) && (
                                            <span className="flex items-center gap-1">
                                              <Mail className="h-3 w-3" />
                                              {application.candidateEmail || application.candidateId?.email}
                                            </span>
                                          )}
                                          {application.candidatePhone && (
                                            <span className="flex items-center gap-1">
                                              <Phone className="h-3 w-3" />
                                              {application.candidatePhone}
                                            </span>
                                          )}
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

                                    <Separator className="my-3" />
                                    
                                    {/* Informações Adicionais */}
                                    <div className="space-y-2">
                                      {application.coverLetter && (
                                        <div>
                                          <p className="text-xs font-medium text-gray-700 mb-1">Carta de Apresentação:</p>
                                          <p className="text-sm text-gray-600 line-clamp-2">
                                            {application.coverLetter}
                                          </p>
                                        </div>
                                      )}

                                      {application.additionalInfo && (
                                        <div>
                                          <p className="text-xs font-medium text-gray-700 mb-1">Informações Adicionais:</p>
                                          <p className="text-sm text-gray-600 line-clamp-2">
                                            {application.additionalInfo}
                                          </p>
                                        </div>
                                      )}

                                      {application.resumeUrl && (
                                        <div>
                                          <p className="text-xs font-medium text-gray-700 mb-1">Currículo:</p>
                                          <a
                                            href={application.resumeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                          >
                                            <FileText className="h-3 w-3" />
                                            Ver currículo PDF
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        </div>
                                      )}

                                      {/* Dados Profissionais do Perfil */}
                                      {application.profileSnapshot && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                          <p className="text-xs font-medium text-gray-700 mb-2">Dados Profissionais:</p>
                                          <div className="space-y-1 text-xs text-gray-600">
                                            {application.profileSnapshot.headline && (
                                              <p><span className="font-medium">Título:</span> {application.profileSnapshot.headline}</p>
                                            )}
                                            {application.profileSnapshot.currentTitle && application.profileSnapshot.currentCompany && (
                                              <p>
                                                <span className="font-medium">Cargo Atual:</span> {application.profileSnapshot.currentTitle} 
                                                {application.profileSnapshot.currentCompany && ` na ${application.profileSnapshot.currentCompany}`}
                                              </p>
                                            )}
                                            {application.profileSnapshot.location && (
                                              <p><span className="font-medium">Localização:</span> {application.profileSnapshot.location}</p>
                                            )}
                                            {application.profileSnapshot.skills && application.profileSnapshot.skills.length > 0 && (
                                              <div>
                                                <span className="font-medium">Habilidades:</span>{" "}
                                                <span className="text-gray-500">
                                                  {application.profileSnapshot.skills.slice(0, 5).join(", ")}
                                                  {application.profileSnapshot.skills.length > 5 && "..."}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-4">
                                      <Button variant="outline" size="sm" asChild>
                                        <Link href={`/jobboard/${application.candidateId?._id}`}>
                                          Ver Perfil
                                        </Link>
                                      </Button>
                                      <Button variant="outline" size="sm" asChild>
                                        <Link href={`/company/${companyId}/admin/applications/${application._id}`}>
                                          Ver Detalhes Completos
                                        </Link>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </ScrollWrapper>
      </SidebarInset>
    </>
  );
}

export default function CompanyApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/feed/auth/login");
      return;
    }

    const checkAccess = async () => {
      try {
        const response = await fetch(
          `/api/companies/${params.id}/check-access`
        );
        if (!response.ok) {
          router.push(`/company/${params.id}`);
        }
      } catch (error) {
        console.error("Error checking access:", error);
        router.push(`/company/${params.id}`);
      }
    };

    if (params.id) {
      checkAccess();
    }
  }, [session, status, router, params]);

  if (status === "loading") {
    return <div></div>;
  }

  if (!session) {
    return null;
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
      <CompanyApplicationsContent />
    </SidebarProvider>
  );
}

