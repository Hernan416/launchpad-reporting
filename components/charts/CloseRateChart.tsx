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
import { ACCENT_HEX } from "@/lib/accents";

const { strong, soft } = ACCENT_HEX.emerald;

export function CloseRateChart({ data }: { data: WeeklyDataPoint[] }) {
  const chartData = data.map((d) => ({
    weekLabel: d.weekLabel,
    showRatePct: d.showRate * 100,
    closeRatePct: d.closeRate * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748b" }}
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
