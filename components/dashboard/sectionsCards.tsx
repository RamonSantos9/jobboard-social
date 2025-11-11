"use client";

import * as React from "react";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SectionCardsProps {
  overview?: {
    totalVacancies?: number;
    totalApplications?: number;
    totalCompanies?: number;
    totalPosts?: number;
  };
}

export function SectionCards({
  overview: propsOverview,
}: SectionCardsProps = {}) {
  const [overview, setOverview] = React.useState<any>(propsOverview || null);
  const [loading, setLoading] = React.useState(!propsOverview);

  React.useEffect(() => {
    // Se já recebeu overview via props, não precisa buscar
    if (propsOverview) {
      setOverview(propsOverview);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setOverview(data.overview);
        }
      } catch (error) {
        console.error("Erro ao buscar métricas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propsOverview]);

  if (loading || !overview) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <CardDescription>Carregando...</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                -
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const totalVacancies =
    typeof overview?.totalVacancies === "number" ? overview.totalVacancies : 0;
  const totalApplications =
    typeof overview?.totalApplications === "number"
      ? overview.totalApplications
      : 0;
  const totalCompanies =
    typeof overview?.totalCompanies === "number" ? overview.totalCompanies : 0;
  const totalPosts =
    typeof overview?.totalPosts === "number" ? overview.totalPosts : 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total de Vagas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalVacancies.toLocaleString("pt-BR")}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Total de vagas cadastradas no sistema
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Candidaturas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalApplications.toLocaleString("pt-BR")}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Total de candidaturas realizadas
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Empresas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalCompanies.toLocaleString("pt-BR")}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Total de empresas cadastradas
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Posts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalPosts.toLocaleString("pt-BR")}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Total de posts publicados</div>
        </CardFooter>
      </Card>
    </div>
  );
}
