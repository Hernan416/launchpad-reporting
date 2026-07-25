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

const { strong, soft } = ACCENT_HEX.gold;

export function AppointmentsCostChart({ data }: { data: WeeklyDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis yAxisId="left" tick={CHART_TICK} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={CHART_TICK}
          tickFormatter={(v: number) => `$${v}`}
        />
        <Tooltip />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="appointments"
          name="Appointments"
          fill={soft}
          radius={[4, 4, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="costPerAppointment"
          name="Cost per Appointment ($)"
          stroke={strong}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
