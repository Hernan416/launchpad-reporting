"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { WeeklyPipelineDataPoint } from "@/types";
import { ACCENT_HEX } from "@/lib/accents";

const CANCELLED_COLOR = "#d97706"; // amber-600
const LOST_COLOR = "#dc2626"; // red-600

export function AppointmentsOutcomeDonut({ data }: { data: WeeklyPipelineDataPoint[] }) {
  const totals = data.reduce(
    (acc, week) => ({
      booked: acc.booked + week.appointmentsBooked,
      cancelled: acc.cancelled + week.appointmentsCancelled,
      lost: acc.lost + week.appointmentsLost,
    }),
    { booked: 0, cancelled: 0, lost: 0 }
  );

  const pieData = [
    { name: "Booked", value: totals.booked, color: ACCENT_HEX.blue.strong },
    { name: "Cancelled", value: totals.cancelled, color: CANCELLED_COLOR },
    { name: "Lost", value: totals.lost, color: LOST_COLOR },
  ];

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
          {pieData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
