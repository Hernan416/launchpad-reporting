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

const { strong, soft } = ACCENT_HEX.blue;

export function CloseRateChart({ data }: { data: WeeklyDataPoint[] }) {
  const chartData = data.map((d) => ({
    weekLabel: d.weekLabel,
    showRatePct: d.showRate * 100,
    closeRatePct: d.closeRate * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis tick={CHART_TICK} tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
        <Tooltip content={(props) => <ChartTooltip {...props} valueFormatter={(v) => `${v.toFixed(1)}%`} />} />
        <Legend {...CHART_LEGEND_PROPS} />
        <Bar dataKey="showRatePct" name="Show Rate %" fill={soft} radius={[4, 4, 0, 0]} animationDuration={300} />
        <Bar dataKey="closeRatePct" name="Close Rate %" fill={strong} radius={[4, 4, 0, 0]} animationDuration={300} />
      </BarChart>
    </ResponsiveContainer>
  );
}
