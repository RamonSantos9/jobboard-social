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
import { AdminDashboardSkeleton } from "@/components/dashboard/admin-skeleton";

import { ChartPieLabelCustom } from "@/components/dashboard/graphics/chart-pie-label-custom";
import { ChartLineLabel } from "@/components/dashboard/graphics/chart-line-label";

function AdminContent() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const router = useRouter();
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLast24h, setActivitiesLast24h] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar se o usuário é admin antes de renderizar
  const userRole = (session?.user as any)?.role || session?.user?.role;
  if (!session || !userRole || userRole !== "admin") {
    return null; // Não renderizar nada se não for admin
  }

  const handleCompanyUpdate = (company: any) => {
    setCompanies((prev) => {
      const existing = prev.find((c) => c._id === company._id);
      if (existing) {
        return prev.map((c) => (c._id === company._id ? company : c));
      } else {
        return [...prev, company];
      }
    });
  };

  const handleUserUpdate = (user: any) => {
    setUsers((prev) => {
      const existing = prev.find((u) => u._id === user._id);
      if (existing) {
        return prev.map((u) => (u._id === user._id ? user : u));
      } else {
        return [...prev, user];
      }
    });
  };

  const handleVacancyUpdate = (vacancy: any) => {
    setVacancies((prev) => {
      const existing = prev.find((v) => v._id === vacancy._id);
      if (existing) {
        return prev.map((v) => (v._id === vacancy._id ? vacancy : v));
      } else {
        return [...prev, vacancy];
      }
    });
  };

  const handleApplicationUpdate = (application: any) => {
    setApplications((prev) => {
      const existing = prev.find((a) => a._id === application._id);
      if (existing) {
        return prev.map((a) => (a._id === application._id ? application : a));
      } else {
        return [...prev, application];
      }
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Usar API unificada para reduzir tempo de carregamento
        const response = await fetch("/api/admin/dashboard-data");

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Erro desconhecido" }));
          console.error("Erro ao buscar dados:", response.status, errorData);

          if (response.status === 401) {
            router.push("/feed/auth/login");
            return;
          } else if (response.status === 403) {
            // Redirecionar para /feed se não tiver permissão
            router.push("/feed");
            return;
          } else {
            // Para outros erros, não setar erro, apenas redirecionar
            console.error("Erro ao buscar dados:", errorData);
            router.push("/feed");
            return;
          }
        } else {
          const data = await response.json();
          console.log("Dados recebidos:", data);

          // Atualizar todos os estados de uma vez
          if (data.stats) setStats(data.stats);
          if (data.activities) setActivities(data.activities);
          if (data.activitiesLast24h)
            setActivitiesLast24h(data.activitiesLast24h);
          if (data.companies) setCompanies(data.companies);
          if (data.users) setUsers(data.users);
          if (data.vacancies) setVacancies(data.vacancies);
          if (data.applications) setApplications(data.applications);
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
  }, []);

  if (loading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AdminDashboardSkeleton />
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="Painel Administrativo" />
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
                <div className="flex flex-col gap-4 md:gap-6 mt-4">
                  <SectionCards overview={stats?.overview} />
                  <div className="px-4 lg:px-6 grid gap-4 md:grid-cols-2">
                    <ChartPieLabelCustom />
                    <ChartLineLabel />
                  </div>
                  <div className="px-4 lg:px-6">
                    <ChartAreaInteractive />
                  </div>
                  <DataTable
                    data={activities}
                    activitiesLast24h={activitiesLast24h}
                    mode="admin"
                    companies={companies}
                    users={users}
                    vacancies={vacancies}
                    applications={applications}
                    onCompanyUpdate={handleCompanyUpdate}
                    onUserUpdate={handleUserUpdate}
                    onVacancyUpdate={handleVacancyUpdate}
                    onApplicationUpdate={handleApplicationUpdate}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollWrapper>
      </SidebarInset>
    </>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/feed/auth/login");
      return;
    }
    
    // Verificar se o usuário é admin do sistema
    const userRole = (session.user as any)?.role || session.user?.role;
    if (!userRole || userRole !== "admin") {
      router.push("/feed");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div></div>;
  }

  if (!session) {
    return null;
  }

  // Verificar role antes de renderizar
  const userRole = (session.user as any)?.role || session.user?.role;
  if (!userRole || userRole !== "admin") {
    return null; // Não renderizar nada enquanto redireciona
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
      <AdminContent />
    </SidebarProvider>
  );
}
