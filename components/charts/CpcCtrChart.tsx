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
import { ACCENT_HEX } from "@/lib/accents";

const { strong, soft } = ACCENT_HEX.cyan;

export function CpcCtrChart({ data }: { data: WeeklyDataPoint[] }) {
  const chartData = data.map((d) => ({ weekLabel: d.weekLabel, cpc: d.cpc, ctrPct: d.ctr * 100 }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickFormatter={(v: number) => `$${v}`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12, fill: "#64748b" }}
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
