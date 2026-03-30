"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { WikiBreakdownRow } from "@/lib/types";
import { tooltipTheme } from "@/components/charts/tooltip-theme";

type WikiBarChartProps = {
  data: WikiBreakdownRow[];
};

export function WikiBarChart({ data }: WikiBarChartProps) {
  return (
    <div className="chart-shell">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(175,214,255,0.08)" vertical={false} />
          <XAxis dataKey="wiki" stroke="#99abc2" tickLine={false} interval={0} angle={-20} textAnchor="end" height={70} />
          <YAxis stroke="#99abc2" tickLine={false} width={52} />
          <Tooltip
            contentStyle={tooltipTheme.contentStyle}
            labelStyle={tooltipTheme.labelStyle}
          />
          <Bar dataKey="totalEdits" fill="#7fc2ff" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
