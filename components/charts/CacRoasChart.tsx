"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyDataPoint } from "@/types";
import { ACCENT_HEX, CHART_GRID_STROKE, CHART_TICK } from "@/lib/accents";

export function CacRoasChart({ data }: { data: WeeklyDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis
          yAxisId="left"
          tick={CHART_TICK}
          tickFormatter={(v: number) => `$${v}`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={CHART_TICK}
          tickFormatter={(v: number) => `${v}x`}
        />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="cac"
          name="CAC ($)"
          stroke={ACCENT_HEX.blue.strong}
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="roas"
          name="ROAS (x)"
          stroke={ACCENT_HEX.gold.strong}
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
