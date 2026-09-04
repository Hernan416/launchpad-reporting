"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyDataPoint } from "@/types";
import { ACCENT_HEX, CHART_GRID_STROKE, CHART_TICK } from "@/lib/accents";
import { CHART_LEGEND_PROPS, ChartTooltip } from "./ChartTooltip";

export function AdSpendRevenueChart({ data }: { data: WeeklyDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis tick={CHART_TICK} tickFormatter={(v: number) => `$${v}`} />
        <Tooltip content={(props) => <ChartTooltip {...props} valueFormatter={(v) => `$${v.toFixed(2)}`} />} />
        <Legend {...CHART_LEGEND_PROPS} />
        <Bar
          dataKey="adSpend"
          name="Ad Spend"
          fill={ACCENT_HEX.blue.strong}
          radius={[4, 4, 0, 0]}
          animationDuration={300}
        />
        <Bar
          dataKey="revenueClosed"
          name="Revenue Closed"
          fill={ACCENT_HEX.gold.strong}
          radius={[4, 4, 0, 0]}
          animationDuration={300}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
