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
import type { WeeklyPipelineDataPoint } from "@/types";
import { ACCENT_HEX, CHART_GRID_STROKE, CHART_TICK } from "@/lib/accents";

const { strong, soft } = ACCENT_HEX.gold;
const YES_COLOR = "#059669"; // emerald-600
const NO_COLOR = "#dc2626"; // red-600

export function QuotesTrendChart({ data }: { data: WeeklyPipelineDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis tick={CHART_TICK} />
        <Tooltip />
        <Legend />
        <Bar dataKey="quotesSent" name="Quotes Sent" fill={strong} radius={[4, 4, 0, 0]} />
        <Bar dataKey="quoteYes" name="Quote - Yes" fill={YES_COLOR} radius={[4, 4, 0, 0]} />
        <Bar dataKey="quoteNo" name="Quote - No" fill={NO_COLOR} radius={[4, 4, 0, 0]} />
        <Bar dataKey="reviewing" name="Reviewing" fill={soft} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
