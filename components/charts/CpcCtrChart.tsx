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

const { strong, soft } = ACCENT_HEX.blue;

export function CpcCtrChart({ data }: { data: WeeklyDataPoint[] }) {
  const chartData = data.map((d) => ({ weekLabel: d.weekLabel, cpc: d.cpc, ctrPct: d.ctr * 100 }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
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
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip />
        <Legend />
        <Line yAxisId="left" type="monotone" dataKey="cpc" name="CPC ($)" stroke={strong} strokeWidth={2} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="ctrPct"
          name="CTR (%)"
          stroke={soft}
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
