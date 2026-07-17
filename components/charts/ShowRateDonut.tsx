"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { WeeklyDataPoint } from "@/types";
import { ACCENT_HEX } from "@/lib/accents";

const COLORS = [ACCENT_HEX.emerald.strong, "#cbd5e1"];

export function ShowRateDonut({ data }: { data: WeeklyDataPoint[] }) {
  const totalShows = data.reduce((sum, d) => sum + d.shows, 0);
  const totalAppointments = data.reduce((sum, d) => sum + d.appointments, 0);
  const noShows = Math.max(totalAppointments - totalShows, 0);

  const pieData = [
    { name: "Showed", value: totalShows },
    { name: "No-show / Other", value: noShows },
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
          {pieData.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
