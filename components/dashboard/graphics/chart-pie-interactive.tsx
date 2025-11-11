"use client";

import * as React from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const description = "An interactive pie chart";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

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

export function ChartPieInteractive() {
  const id = "pie-interactive";
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeMonth, setActiveMonth] = React.useState<string>("");

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/admin/dashboard-data");
        if (response.ok) {
          const data = await response.json();
          
          // Usar dados de vagas preenchidas por mês
          const filledData = data.stats?.trends?.filledVacanciesByMonth || [];
          
          const formattedData = filledData.map((item: any, index: number) => {
            const [year, month] = item.month.split("-");
            const monthIndex = parseInt(month) - 1;
            const monthKey = monthNames[monthIndex] || `month${month}`;
            
            return {
              month: monthKey,
              desktop: item.count || 0,
              fill: colors[index % colors.length],
              label: monthLabels[monthIndex] || `Mês ${month}`,
            };
          });

          setChartData(formattedData);
          if (formattedData.length > 0) {
            setActiveMonth(formattedData[0].month);
          }
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
      visitors: {
        label: "Visitors",
      },
      desktop: {
        label: "Desktop",
      },
      mobile: {
        label: "Mobile",
      },
    };

    chartData.forEach((item) => {
      config[item.month] = {
        label: item.label,
        color: item.fill,
      };
    });

    return config;
  }, [chartData]);

  const activeIndex = React.useMemo(
    () => chartData.findIndex((item) => item.month === activeMonth),
    [activeMonth, chartData]
  );
  
  const months = React.useMemo(() => chartData.map((item) => item.month), [chartData]);

  if (loading) {
    return (
      <Card data-chart={id} className="flex flex-col">
        <CardHeader className="flex-row items-start space-y-0 pb-0">
          <div className="grid gap-1">
            <CardTitle>Vagas Preenchidas por Mês</CardTitle>
            <CardDescription>Carregando dados...</CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (!chartData.length || !activeMonth) {
    return (
      <Card data-chart={id} className="flex flex-col">
        <CardHeader className="flex-row items-start space-y-0 pb-0">
          <div className="grid gap-1">
            <CardTitle>Vagas Preenchidas por Mês</CardTitle>
            <CardDescription>Nenhum dado disponível</CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card data-chart={id} className="flex flex-col">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Vagas Preenchidas por Mês</CardTitle>
          <CardDescription>Últimos 12 meses</CardDescription>
        </div>
        <Select value={activeMonth} onValueChange={setActiveMonth}>
          <SelectTrigger
            className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {months.map((key) => {
              const config = chartConfig[key as keyof typeof chartConfig];
              const item = chartData.find((d) => d.month === key);

              if (!config || !item) {
                return null;
              }

              return (
                <SelectItem
                  key={key}
                  value={key}
                  className="rounded-lg [&_span]:flex"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-xs"
                      style={{
                        backgroundColor: `var(--color-${key})`,
                      }}
                    />
                    {config?.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          id={id}
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="desktop"
              nameKey="month"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex >= 0 ? activeIndex : 0}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 10} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 25}
                    innerRadius={outerRadius + 12}
                  />
                </g>
              )}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox && activeIndex >= 0) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {chartData[activeIndex]?.desktop.toLocaleString("pt-BR") || 0}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Visitors
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
