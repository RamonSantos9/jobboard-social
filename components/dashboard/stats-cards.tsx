"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  Building2,
  UserCheck,
} from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalUsers?: number;
    activeUsers?: number;
    totalApplications?: number;
    totalPosts?: number;
    totalVacancies?: number;
    publishedVacancies?: number;
    totalCompanies?: number;
    activeVacancies?: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  // Se stats não estiver disponível, retornar loading
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground mt-1">-</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Garantir que todos os valores sejam números válidos
  const totalUsers = typeof stats?.totalUsers === 'number' ? stats.totalUsers : 0;
  const activeUsers = typeof stats?.activeUsers === 'number' ? stats.activeUsers : 0;
  const totalApplications = typeof stats?.totalApplications === 'number' ? stats.totalApplications : 0;
  const totalPosts = typeof stats?.totalPosts === 'number' ? stats.totalPosts : 0;
  const totalVacancies = typeof stats?.totalVacancies === 'number' ? stats.totalVacancies : 0;
  const publishedVacancies = typeof stats?.publishedVacancies === 'number' ? stats.publishedVacancies : 0;
  const totalCompanies = typeof stats?.totalCompanies === 'number' ? stats.totalCompanies : 0;

  const cards = [
    {
      title: "Total de Usuários",
      value: totalUsers.toLocaleString("pt-BR"),
      subtitle: `${activeUsers.toLocaleString("pt-BR")} ativos (30 dias)`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total de Vagas",
      value: totalVacancies.toLocaleString("pt-BR"),
      subtitle: `${publishedVacancies.toLocaleString("pt-BR")} publicadas`,
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Candidaturas",
      value: totalApplications.toLocaleString("pt-BR"),
      subtitle: "Total de candidaturas",
      icon: UserCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Posts",
      value: totalPosts.toLocaleString("pt-BR"),
      subtitle: "Total de posts",
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Empresas",
      value: totalCompanies.toLocaleString("pt-BR"),
      subtitle: "Total de empresas",
      icon: Building2,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`${card.bgColor} p-2 rounded-lg`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

