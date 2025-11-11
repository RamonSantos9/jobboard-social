"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts";

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

export const description = "A line chart with a label";

const monthLabels = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const monthLabelsShort = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const chartConfig = {
  vagas: {
    label: "Vagas",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function ChartLineLabel() {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/admin/dashboard-data");
        if (response.ok) {
          const data = await response.json();

          // Usar dados de vagas e candidaturas por mês
          const vacanciesByMonth = data.stats?.trends?.vacanciesByMonth || [];
          const applicationsByMonth =
            data.stats?.trends?.applicationsByMonth || [];

          // Criar um mapa para facilitar a busca
          const vacanciesMap = new Map<string, number>();
          vacanciesByMonth.forEach((item: any) => {
            if (item.month && typeof item.count === "number") {
              vacanciesMap.set(item.month, item.count);
            }
          });

          const applicationsMap = new Map<string, number>();
          applicationsByMonth.forEach((item: any) => {
            if (item.month && typeof item.count === "number") {
              applicationsMap.set(item.month, item.count);
            }
          });

          // Gerar os últimos 6 meses completos (mesmo que não tenham dados)
          const now = new Date();
          const formattedData: any[] = [];

          for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const monthKey = `${year}-${String(month).padStart(2, "0")}`;
            const monthIndex = month - 1;

            const vagasValue = vacanciesMap.get(monthKey);
            const candidaturasValue = applicationsMap.get(monthKey);

            const dataPoint = {
              month: monthLabels[monthIndex] || monthKey,
              monthShort: monthLabelsShort[monthIndex] || monthKey.slice(0, 3),
              vagas: vagasValue !== undefined ? Number(vagasValue) : 0,
              candidaturas:
                candidaturasValue !== undefined ? Number(candidaturasValue) : 0,
            };

            formattedData.push(dataPoint);
          }

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vagas por Mês</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vagas por Mês</CardTitle>
          <CardDescription>Nenhum dado disponível</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vagas por Mês</CardTitle>
        <CardDescription>Últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="monthShort"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              minTickGap={0}
              angle={0}
              textAnchor="middle"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="vagas"
              type="monotone"
              stroke="var(--color-vagas)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-vagas)",
                r: 4,
              }}
              activeDot={{
                r: 6,
              }}
              connectNulls={false}
            >
              <LabelList
                dataKey="vagas"
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: any) => (value > 0 ? value : "")}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Tendência dos últimos 6 meses <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Mostrando total de vagas dos últimos 6 meses
        </div>
      </CardFooter>
    </Card>
  );
}
