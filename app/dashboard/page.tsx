"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";

import { ScrollWrapper } from "@/components/dashboard/scroll-wrapper";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ChartAreaInteractive } from "@/components/dashboard/graphics/chart-area-interactive";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { SectionCards } from "@/components/dashboard/sectionsCards";
import { DataTable } from "@/components/dashboard/data-table";

import { ChartPieLabelCustom } from "@/components/dashboard/graphics/chart-pie-label-custom";
import { ChartPieInteractive } from "@/components/dashboard/graphics/chart-pie-interactive";

function DashboardContent() {
  const { data: session } = useSession();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verificar se é admin do sistema ou admin de empresa
        const isSystemAdmin = session?.user?.role === "admin";

        let statsResponse, activitiesResponse;

        if (isSystemAdmin) {
          // Admin do sistema: buscar dados gerais
          [statsResponse, activitiesResponse] = await Promise.all([
            fetch("/api/dashboard/stats"),
            fetch("/api/dashboard/recent-activities"),
          ]);
        } else {
          // Verificar se é admin de empresa
          const companyStatsResponse = await fetch(
            "/api/dashboard/company-stats"
          );
          if (companyStatsResponse.ok) {
            setIsCompanyAdmin(true);
            statsResponse = companyStatsResponse;
            activitiesResponse = await fetch(
              "/api/dashboard/recent-activities"
            );
          } else {
            // Não é admin de empresa, redirecionar
            router.push("/feed");
            return;
          }
        }

        // Verificar resposta de estatísticas
        if (!statsResponse.ok) {
          const errorData = await statsResponse
            .json()
            .catch(() => ({ error: "Erro desconhecido" }));
          console.error(
            "Erro ao buscar estatísticas:",
            statsResponse.status,
            errorData
          );

          if (statsResponse.status === 401) {
            router.push("/feed/auth/login");
            return;
          } else if (statsResponse.status === 403) {
            // Redirecionar para /feed se não tiver permissão
            router.push("/feed");
            return;
          } else {
            setError(
              `Erro ao buscar estatísticas: ${
                errorData.error || "Erro desconhecido"
              }`
            );
          }
        } else {
          const statsData = await statsResponse.json();
          console.log("Estatísticas recebidas:", statsData);
          setStats(statsData);
        }

        // Verificar resposta de atividades
        if (!activitiesResponse.ok) {
          const errorData = await activitiesResponse
            .json()
            .catch(() => ({ error: "Erro desconhecido" }));
          console.error(
            "Erro ao buscar atividades:",
            activitiesResponse.status,
            errorData
          );

          if (activitiesResponse.status === 401) {
            router.push("/feed/auth/login");
            return;
          } else if (activitiesResponse.status === 403) {
            // Redirecionar para /feed se não tiver permissão
            router.push("/feed");
            return;
          } else if (!error) {
            // Só definir erro se ainda não foi definido
            setError(
              `Erro ao buscar atividades: ${
                errorData.error || "Erro desconhecido"
              }`
            );
          }
        } else {
          const activitiesData = await activitiesResponse.json();
          console.log("Atividades recebidas:", activitiesData);
          setActivities(activitiesData.activities || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          "Erro ao carregar dados da dashboard. Tente recarregar a página."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, router]);

  if (loading) {
    return (
      <>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <ScrollWrapper className="flex-1" variant="dashboard">
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium">Carregando dados...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Aguarde enquanto buscamos as informações
                </p>
              </div>
            </div>
          </ScrollWrapper>
        </SidebarInset>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <ScrollWrapper className="flex-1" variant="dashboard">
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center max-w-md">
                <p className="text-lg font-medium text-destructive">
                  Erro ao carregar dashboard
                </p>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
              </div>
            </div>
          </ScrollWrapper>
        </SidebarInset>
      </>
    );
  }

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <ScrollWrapper className="flex-1" variant="dashboard">
          <div className="flex flex-1 flex-col ">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4  md:gap-6">
                {/* Stats Cards */}
                {stats && <StatsCards stats={stats.overview || stats} />}

                {/* Charts */}
                <div className="grid gap-4 md:grid-cols-2"></div>

                <div className="flex flex-col gap-4  md:gap-6">
                  <div className="px-4 lg:px-6 grid gap-4 md:grid-cols-2">
                    <ChartPieLabelCustom />
                    <ChartPieInteractive />
                  </div>

                  <SectionCards />
                  <div className="px-4 lg:px-6">
                    <ChartAreaInteractive />
                  </div>
                  <DataTable data={activities} mode="company" />
                </div>
              </div>
            </div>
          </div>
        </ScrollWrapper>
      </SidebarInset>
    </>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/feed/auth/login");
    }
  }, [session, status, router]);

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
      <DashboardContent />
    </SidebarProvider>
  );
}
