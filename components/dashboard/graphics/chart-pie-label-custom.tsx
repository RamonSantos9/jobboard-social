"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Função para normalizar categorias
const normalizeCategory = (category: string): string => {
  const normalized = category.toLowerCase().trim();

  // Mapeamento de padrões para categorias normalizadas
  if (normalized.includes("front-end") || normalized.includes("frontend")) {
    return "Front-end";
  }
  if (normalized.includes("back-end") || normalized.includes("backend")) {
    return "Back-end";
  }
  if (normalized.includes("full stack") || normalized.includes("fullstack")) {
    return "Full-stack";
  }
  if (normalized.includes("devops") || normalized.includes("dev-ops")) {
    return "DevOps";
  }

  // Retornar categoria original se não houver match
  return category;
};

export function ChartPieLabelCustom() {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/admin/dashboard-data");
        if (response.ok) {
          const data = await response.json();

          // Usar dados de vagas por categoria
          const categories = data.stats?.trends?.vacanciesByCategory || [];

          // Normalizar e agrupar categorias
          const categoryMap = new Map<string, number>();

          categories.forEach((item: any) => {
            const normalizedCategory = normalizeCategory(
              item.category || "Outros"
            );
            const count = item.count || 0;

            if (categoryMap.has(normalizedCategory)) {
              categoryMap.set(
                normalizedCategory,
                categoryMap.get(normalizedCategory)! + count
              );
            } else {
              categoryMap.set(normalizedCategory, count);
            }
          });

          // Converter para array e ordenar por contagem decrescente
          const groupedCategories = Array.from(categoryMap.entries())
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Limitar a 10 categorias

          const formattedData = groupedCategories.map((item, index) => ({
            category: item.category,
            count: item.count,
            fill: colors[index % colors.length],
          }));

          setChartData(formattedData);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do gráfico:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      count: {
        label: "Vagas",
      },
    };

    chartData.forEach((item) => {
      config[item.category] = {
        label: item.category,
        color: item.fill,
      };
    });

    return config;
  }, [chartData]);

  if (loading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Vagas por Categoria</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Vagas por Categoria</CardTitle>
        <CardDescription>
          Mostrando todos os dados de todo o período
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] px-0"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="category" hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              labelLine={false}
              label={({ payload, ...props }) => {
                return (
                  <text
                    cx={props.cx}
                    cy={props.cy}
                    x={props.x}
                    y={props.y}
                    textAnchor={props.textAnchor}
                    dominantBaseline={props.dominantBaseline}
                    fill="hsla(var(--foreground))"
                  >
                    {payload.count}
                  </text>
                );
              }}
              nameKey="category"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Total de vagas por categoria <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Mostrando todas as vagas publicadas
        </div>
      </CardFooter>
    </Card>
  );
}
