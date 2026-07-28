"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WeeklyDataPoint } from "@/types";
import { ACCENT_HEX, CHART_GRID_STROKE, CHART_TICK } from "@/lib/accents";

const { strong } = ACCENT_HEX.blue;

export function CtrChart({ data }: { data: WeeklyDataPoint[] }) {
  const chartData = data.map((d) => ({ weekLabel: d.weekLabel, ctrPct: d.ctr * 100 }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis tick={CHART_TICK} tickFormatter={(v: number) => `${v}%`} />
        <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
        <Bar dataKey="ctrPct" name="CTR" fill={strong} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
