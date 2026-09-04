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
import type { WeeklyCallFunnelDataPoint } from "@/types";
import { ACCENT_HEX, CHART_GRID_STROKE, CHART_NEUTRAL, CHART_TICK } from "@/lib/accents";

const { strong, soft } = ACCENT_HEX.blue;

export function CallFunnelVolumeChart({ data }: { data: WeeklyCallFunnelDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis tick={CHART_TICK} />
        <Tooltip />
        <Legend />
        <Bar dataKey="appointmentsBooked" name="Booked" fill={CHART_NEUTRAL} radius={[4, 4, 0, 0]} />
        <Bar dataKey="shows" name="Shows" fill={soft} radius={[4, 4, 0, 0]} />
        <Bar dataKey="closed" name="Closed" fill={strong} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
