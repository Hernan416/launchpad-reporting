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
import type { WeeklyPipelineDataPoint } from "@/types";
import { ACCENT_HEX } from "@/lib/accents";

const { strong, soft } = ACCENT_HEX.indigo;

export function QuotePipelineTrendChart({ data }: { data: WeeklyPipelineDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="quotesSent" name="Quotes Sent" fill={soft} radius={[4, 4, 0, 0]} />
        <Line
          type="monotone"
          dataKey="quoteFollowUp"
          name="Quote Follow-up"
          stroke={strong}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
