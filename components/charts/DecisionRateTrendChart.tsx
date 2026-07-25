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
import type { WeeklyPipelineDataPoint } from "@/types";
import { ACCENT_HEX, CHART_GRID_STROKE, CHART_TICK } from "@/lib/accents";

const YES_COLOR = "#059669"; // emerald-600
const NO_COLOR = "#dc2626"; // red-600

export function DecisionRateTrendChart({ data }: { data: WeeklyPipelineDataPoint[] }) {
  const chartData = data.map((d) => ({
    weekLabel: d.weekLabel,
    yesRatePct: d.yesRate * 100,
    noRatePct: d.noRate * 100,
    decisionRatePct: d.decisionRate * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis tick={CHART_TICK} tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
        <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
        <Legend />
        <Line type="monotone" dataKey="yesRatePct" name="Yes %" stroke={YES_COLOR} strokeWidth={2} />
        <Line type="monotone" dataKey="noRatePct" name="No %" stroke={NO_COLOR} strokeWidth={2} />
        <Line
          type="monotone"
          dataKey="decisionRatePct"
          name="Decision %"
          stroke={ACCENT_HEX.gold.strong}
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
