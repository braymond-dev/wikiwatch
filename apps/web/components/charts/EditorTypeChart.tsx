"use client";

import type { TooltipProps } from "recharts";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

import { EditorTypeRow } from "@/lib/types";
import { tooltipTheme } from "@/components/charts/tooltip-theme";

type EditorTypeChartProps = {
  data: EditorTypeRow[];
};

const colors = ["#77f0c2", "#7fc2ff", "#ffb36b"];

export function EditorTypeChart({ data }: EditorTypeChartProps) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
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
            <Tooltip content={<EditorTypeTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          alignItems: "center",
        }}
      >
        {data.map((entry, index) => (
          <div
            key={entry.name}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: colors[index % colors.length],
                flexShrink: 0,
              }}
            />
            <span>{entry.name}</span>
            <span className="muted">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorTypeTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0];
  const color = item.color ?? "#eff7ff";

  return (
    <div style={tooltipTheme.contentStyle}>
      <div style={{ ...tooltipTheme.labelStyle, marginBottom: 6 }}>Editor Type</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
        <span style={{ color, fontWeight: 600 }}>{String(item.name)}</span>
        <span style={{ color }}>{Number(item.value).toLocaleString()}</span>
      </div>
    </div>
  );
}
