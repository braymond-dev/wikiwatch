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
            contentStyle={{
              background: "rgba(5,11,21,0.96)",
              border: "1px solid rgba(175,214,255,0.14)",
              borderRadius: 16,
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="totalEdits" stroke="#77f0c2" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="humanEdits" stroke="#7fc2ff" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="botEdits" stroke="#ffb36b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

