"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyPipelineDataPoint } from "@/types";
import { ACCENT_HEX, CHART_GRID_STROKE, CHART_TICK } from "@/lib/accents";
import { ChartTooltip } from "./ChartTooltip";

const { strong } = ACCENT_HEX.blue;

export function LeadsTrendChart({ data }: { data: WeeklyPipelineDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis tick={CHART_TICK} />
        <Tooltip content={ChartTooltip} />
        <Bar dataKey="totalLeads" name="Total Leads" fill={strong} radius={[4, 4, 0, 0]} animationDuration={300} />
      </BarChart>
    </ResponsiveContainer>
  );
}
