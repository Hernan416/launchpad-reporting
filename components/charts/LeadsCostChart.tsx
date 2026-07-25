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

const { strong, soft } = ACCENT_HEX.blue;

export function LeadsCostChart({ data }: { data: WeeklyDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis tick={CHART_TICK} />
        <Tooltip />
        <Legend />
        <Bar dataKey="leads" name="Leads" fill={soft} radius={[4, 4, 0, 0]} />
        <Line
          type="monotone"
          dataKey="costPerLead"
          name="Cost per Lead ($)"
          stroke={strong}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
