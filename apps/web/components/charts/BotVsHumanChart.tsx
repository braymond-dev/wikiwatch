"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { BotVsHumanRow } from "@/lib/types";

type BotVsHumanChartProps = {
  data: BotVsHumanRow[];
};

const colors = ["#77f0c2", "#ffb36b"];

export function BotVsHumanChart({ data }: BotVsHumanChartProps) {
  return (
    <div className="chart-shell">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "rgba(5,11,21,0.96)",
              border: "1px solid rgba(175,214,255,0.14)",
              borderRadius: 16,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

