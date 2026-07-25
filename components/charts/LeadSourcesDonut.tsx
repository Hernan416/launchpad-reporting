"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { WeeklyPipelineDataPoint } from "@/types";
import { CHART_PALETTE } from "@/lib/accents";

/** Sums leadsBySource (a per-week dynamic breakdown) across the whole trend window into one totals-by-label pie. */
export function LeadSourcesDonut({ data }: { data: WeeklyPipelineDataPoint[] }) {
  const totals = new Map<string, number>();
  for (const week of data) {
    for (const source of week.leadsBySource) {
      totals.set(source.label, (totals.get(source.label) ?? 0) + source.count);
    }
  }
  const pieData = [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          innerRadius="60%"
          outerRadius="85%"
          paddingAngle={2}
        >
          {pieData.map((entry, index) => (
            <Cell key={entry.name} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
