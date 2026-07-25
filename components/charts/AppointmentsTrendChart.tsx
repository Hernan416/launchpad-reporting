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
import type { WeeklyPipelineDataPoint } from "@/types";
import { ACCENT_HEX, CHART_GRID_STROKE, CHART_TICK } from "@/lib/accents";

const { strong } = ACCENT_HEX.blue;
const CANCELLED_COLOR = "#d97706"; // amber-600
const LOST_COLOR = "#dc2626"; // red-600

export function AppointmentsTrendChart({ data }: { data: WeeklyPipelineDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="weekLabel" tick={CHART_TICK} />
        <YAxis tick={CHART_TICK} />
        <Tooltip />
        <Legend />
        <Bar dataKey="appointmentsBooked" name="Booked" fill={strong} radius={[4, 4, 0, 0]} />
        <Bar
          dataKey="appointmentsCancelled"
          name="Cancelled"
          fill={CANCELLED_COLOR}
          radius={[4, 4, 0, 0]}
        />
        <Bar dataKey="appointmentsLost" name="Lost" fill={LOST_COLOR} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
