"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyDataPoint } from "@/types";
import { ACCENT_HEX, CHART_GRID_STROKE, CHART_TICK } from "@/lib/accents";

const { strong, soft } = ACCENT_HEX.blue;

export function CloseRateChart({ data }: { data: WeeklyDataPoint[] }) {
  const chartData = data.map((d) => ({
    weekLabel: d.weekLabel,
    showRatePct: d.showRate * 100,
    closeRatePct: d.closeRate * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis
          tick={CHART_TICK}
          tickFormatter={(v: number) => `${v}%`}
          domain={[0, 100]}
        />
        <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
        <Legend />
        <Area
          type="monotone"
          dataKey="showRatePct"
          name="Show Rate %"
          stroke={soft}
          fill={soft}
          fillOpacity={0.3}
        />
        <Area
          type="monotone"
          dataKey="closeRatePct"
          name="Close Rate %"
          stroke={strong}
          fill={strong}
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
