"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WeeklyDataPoint } from "@/types";
import { ACCENT_HEX, CHART_GRID_STROKE, CHART_TICK } from "@/lib/accents";
import { ChartTooltip } from "./ChartTooltip";

const { strong } = ACCENT_HEX.blue;

export function CpcChart({ data }: { data: WeeklyDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis tick={CHART_TICK} tickFormatter={(v: number) => `$${v}`} />
        <Tooltip content={(props) => <ChartTooltip {...props} valueFormatter={(v) => `$${v.toFixed(2)}`} />} />
        <Bar dataKey="cpc" name="CPC" fill={strong} radius={[4, 4, 0, 0]} animationDuration={300} />
      </BarChart>
    </ResponsiveContainer>
  );
}
