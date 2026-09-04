"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { WeeklyDataPoint } from "@/types";
import { ACCENT_HEX, CHART_NEUTRAL } from "@/lib/accents";
import { CHART_LEGEND_PROPS, ChartTooltip } from "./ChartTooltip";

const COLORS = [ACCENT_HEX.blue.strong, CHART_NEUTRAL];

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
          animationDuration={300}
        >
          {pieData.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={ChartTooltip} />
        <Legend {...CHART_LEGEND_PROPS} />
      </PieChart>
    </ResponsiveContainer>
  );
}
