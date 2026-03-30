"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TimeSeriesPoint } from "@/lib/types";
import { tooltipTheme } from "@/components/charts/tooltip-theme";

type EditsLineChartProps = {
  data: TimeSeriesPoint[];
};

export function EditsLineChart({ data }: EditsLineChartProps) {
  return (
    <div className="chart-shell">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(175,214,255,0.08)" vertical={false} />
          <XAxis dataKey="bucket" stroke="#99abc2" tickLine={false} minTickGap={28} />
          <YAxis stroke="#99abc2" tickLine={false} width={52} />
          <Tooltip
            contentStyle={tooltipTheme.contentStyle}
            labelStyle={tooltipTheme.labelStyle}
          />
          <Legend />
          <Line type="monotone" dataKey="totalEdits" stroke="#77f0c2" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="registeredEdits" stroke="#7fc2ff" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="tempAccountEdits" stroke="#f08ae8" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="botEdits" stroke="#ffb36b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
