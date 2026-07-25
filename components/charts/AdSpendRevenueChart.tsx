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

export function AdSpendRevenueChart({ data }: { data: WeeklyDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis tick={CHART_TICK} tickFormatter={(v: number) => `$${v}`} />
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
        <Legend />
        <Bar dataKey="adSpend" name="Ad Spend" fill={ACCENT_HEX.blue.strong} radius={[4, 4, 0, 0]} />
        <Line
          type="monotone"
          dataKey="revenueClosed"
          name="Revenue Closed"
          stroke={ACCENT_HEX.gold.strong}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
