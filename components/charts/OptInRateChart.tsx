"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WeeklyDataPoint } from "@/types";
import { ACCENT_HEX, CHART_GRID_STROKE, CHART_TICK } from "@/lib/accents";

const { strong } = ACCENT_HEX.gold;

export function OptInRateChart({ data }: { data: WeeklyDataPoint[] }) {
  const chartData = data.map((d) => ({ weekLabel: d.weekLabel, optInRatePct: d.optInRate * 100 }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis tick={CHART_TICK} tickFormatter={(v: number) => `${v}%`} />
        <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
        <Bar dataKey="optInRatePct" name="Opt-in Rate" fill={strong} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
