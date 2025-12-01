"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Eye,
  MousePointerClick,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Statistics {
  totalApplications: number;
  pendingApplications: number;
  reviewingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  totalViews: number;
  totalClicks: number;
  savedJobs: number;
  applicationsByMonth: Array<{ month: string; count: number }>;
  applicationsByStatus: Array<{ name: string; value: number }>;
}

const COLORS = ["#FCD34D", "#3B82F6", "#10B981", "#EF4444"];

export default function JobStatisticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics>({
    totalApplications: 0,
    pendingApplications: 0,
    reviewingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    totalViews: 0,
    totalClicks: 0,
    savedJobs: 0,
    applicationsByMonth: [],
    applicationsByStatus: [],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/feed/auth/login");
      return;
    }

    if (status === "authenticated") {
      fetchStatistics();
    }
  }, [status, router]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch("/api/user/job-statistics");
      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Minhas Estatísticas
        </h1>
        <p className="text-gray-600 mt-2">
          Acompanhe seu progresso e desempenho na busca por vagas
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Total de Candidaturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {statistics.totalApplications}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Todas as suas candidaturas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {statistics.pendingApplications}
            </div>
            <p className="text-xs text-gray-500 mt-1">Aguardando análise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Em Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {statistics.reviewingApplications}
            </div>
            <p className="text-xs text-gray-500 mt-1">Sendo avaliadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Aceitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {statistics.acceptedApplications}
            </div>
            <p className="text-xs text-gray-500 mt-1">Candidaturas aprovadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Candidaturas por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Candidaturas por Mês</CardTitle>
            <CardDescription>
              Histórico de candidaturas nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.applicationsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Candidaturas</CardTitle>
            <CardDescription>Distribuição por status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statistics.applicationsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statistics.applicationsByStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas de Engajamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Visualizações de Vagas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {statistics.totalViews}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Vagas que você visualizou
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4" />
              Cliques em Vagas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {statistics.totalClicks}
            </div>
            <p className="text-xs text-gray-500 mt-1">Vagas que você clicou</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejeitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics.rejectedApplications}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Candidaturas não aprovadas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
