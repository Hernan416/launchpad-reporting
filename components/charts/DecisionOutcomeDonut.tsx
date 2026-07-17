"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  Yes: "#059669", // emerald-600
  No: "#dc2626", // red-600
  Reviewing: "#d97706", // amber-600
};

export function DecisionOutcomeDonut({
  quoteYes,
  quoteNo,
  reviewing,
}: {
  quoteYes: number;
  quoteNo: number;
  reviewing: number;
}) {
  const data = [
    { name: "Yes", value: quoteYes },
    { name: "No", value: quoteNo },
    { name: "Reviewing", value: reviewing },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="60%"
          outerRadius="85%"
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
