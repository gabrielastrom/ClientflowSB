"use client";
export const dynamic = "force-dynamic";

import * as React from "react";
import { Pie, PieChart, Cell, Label } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

type ExpenseByCategoryChartProps = {
  data: {
    name: string;
    expense: number;
    fill: string;
  }[];
};

export default function ExpenseByCategoryChart({ data: chartData }: ExpenseByCategoryChartProps) {
  const chartConfig = React.useMemo(() => {
    if (!chartData) return {};
    return {
      expense: {
        label: "Expense",
      },
      ...chartData.reduce((acc, entry) => {
        acc[entry.name as keyof typeof acc] = {
          label: entry.name,
          color: entry.fill,
        };
        return acc;
      }, {} as { [key: string]: { label: string, color: string } }),
    } satisfies ChartConfig;
  }, [chartData]);

  const totalExpense = React.useMemo(() => {
    if (!chartData) return 0;
    return chartData.reduce((acc, curr) => acc + curr.expense, 0);
  }, [chartData]);

  if (!chartData || chartData.length === 0) {
    return (
        <div className="h-[350px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">No expense data for this month.</p>
        </div>
    )
  }

  return (
    <div className="h-[350px] w-full">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-full"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={chartData}
            dataKey="expense"
            nameKey="name"
            innerRadius="60%"
            strokeWidth={2}
            stroke="hsl(var(--card))"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        dy="-0.5em"
                        className="text-2xl font-bold"
                        fill="hsl(var(--foreground))"
                      >
                        {totalExpense.toLocaleString()} kr
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        dy="1.2em"
                        className="text-sm"
                        fill="hsl(var(--muted-foreground))"
                      >
                        This Month
                      </tspan>
                    </text>
                  );
                }
                return null;
              }}
            />
          </Pie>
          <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/3 [&>*]:justify-center"
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
}

    