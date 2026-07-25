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

const { strong, soft } = ACCENT_HEX.blue;

export function QuotesClosedChart({ data }: { data: WeeklyDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis tick={CHART_TICK} />
        <Tooltip />
        <Legend />
        <Bar dataKey="quotesSent" name="Quotes Sent" fill={soft} radius={[4, 4, 0, 0]} />
        <Bar dataKey="closed" name="Closed" fill={strong} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
