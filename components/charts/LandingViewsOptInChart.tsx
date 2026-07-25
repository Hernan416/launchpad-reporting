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
import { ACCENT_HEX, CHART_GRID_STROKE, CHART_TICK } from "@/lib/accents";

const { strong, soft } = ACCENT_HEX.gold;

export function LandingViewsOptInChart({ data }: { data: WeeklyDataPoint[] }) {
  const chartData = data.map((d) => ({
    weekLabel: d.weekLabel,
    landingPageViews: d.landingPageViews,
    optInRatePct: d.optInRate * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis yAxisId="left" tick={CHART_TICK} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={CHART_TICK}
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
