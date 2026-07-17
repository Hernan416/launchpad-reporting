"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyDataPoint } from "@/types";
import { ACCENT_HEX } from "@/lib/accents";

const { strong, soft } = ACCENT_HEX.indigo;

export function LandingViewsOptInChart({ data }: { data: WeeklyDataPoint[] }) {
  const chartData = data.map((d) => ({
    weekLabel: d.weekLabel,
    landingPageViews: d.landingPageViews,
    optInRatePct: d.optInRate * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="landingPageViews"
          name="Landing Page Views"
          fill={soft}
          radius={[4, 4, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="optInRatePct"
          name="Opt-in Rate (%)"
          stroke={strong}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
