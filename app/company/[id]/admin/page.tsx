"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";

import { ScrollWrapper } from "@/components/dashboard/scroll-wrapper";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, TrendingUp, Eye } from "lucide-react";
import Link from "next/link";

function CompanyAdminContent() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const params = useParams();
  const companyId = params.id as string;
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, applicationsResponse] = await Promise.all([
          fetch(`/api/dashboard/company/${companyId}/stats`),
          fetch(`/api/companies/${companyId}/applications`),
        ]);

        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStats(data);
        }

        if (applicationsResponse.ok) {
          const data = await applicationsResponse.json();
          setApplications(data.applications || []);
        }
      } catch (error) {
        console.error("Error fetching company admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div></div>
      </div>
    );
  }

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarIconsOnly isCollapsed={isCollapsed} />
      <SidebarInset>
        <SiteHeader
          title={
            stats?.company?.name
              ? `Painel Admin - ${stats.company.name}`
              : "Painel Admin da Empresa"
          }
        />
        <ScrollWrapper className="flex-1" variant="dashboard">
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {/* Company Info */}
                {stats?.company && (
                  <div className="px-4 lg:px-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-4">
                          {stats.company.logoUrl && (
                            <img
                              src={stats.company.logoUrl}
                              alt={stats.company.name}
                              className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                            />
                          )}
                          <div>
                            <CardTitle className="text-2xl font-semibold text-gray-900">
                              {stats.company.name}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              Painel administrativo da empresa
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </div>
                )}

                {/* Stats Cards */}
                {stats?.overview && (
                  <div className="px-4 lg:px-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Total de Vagas
                          </CardTitle>
                          <Briefcase className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {stats.overview.totalVacancies}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {stats.overview.publishedVacancies} publicadas
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Candidaturas
                          </CardTitle>
                          <Users className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {stats.overview.totalApplications}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total recebidas
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Visualizações
                          </CardTitle>
                          <Eye className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {stats.overview.totalViews.toLocaleString("pt-BR")}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total de visualizações
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Taxa de Conversão
                          </CardTitle>
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {stats.overview.conversionRate.toFixed(1)}%
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Candidaturas / Visualizações
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Charts */}
                {stats?.trends?.applicationsByMonth && (
                  <div className="px-4 lg:px-6">
                    <ChartArea
                      title="Candidaturas por Mês"
                      data={stats.trends.applicationsByMonth}
                      color="text-purple-600"
                    />
                  </div>
                )}

                {/* Recent Applications */}
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Candidaturas Recentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {applications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Nenhuma candidatura recente
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {applications.slice(0, 10).map((application: any) => (
                            <div
                              key={application._id}
                              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    {application.candidateId?.name?.[0]?.toUpperCase() ||
                                      "C"}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {application.candidateId?.name ||
                                      "Candidato"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {application.jobId?.title || "Vaga"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    application.status === "accepted"
                                      ? "default"
                                      : application.status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {application.status === "accepted"
                                    ? "Aceita"
                                    : application.status === "rejected"
                                    ? "Rejeitada"
                                    : "Pendente"}
                                </Badge>
                                <Button variant="outline" size="sm" asChild>
                                  <Link
                                    href={`/applications/${application._id}`}
                                  >
                                    Ver detalhes
                                  </Link>
                                </Button>
                              </div>
                            </div>
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

export default function CompanyAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/feed/auth/login");
      return;
    }

    // Verificar se o usuário tem acesso à empresa
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
  }, [session, status, router, params.id]);

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
      <CompanyAdminContent />
    </SidebarProvider>
  );
}
