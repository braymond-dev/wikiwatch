import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <section className="glass-card" style={{ padding: 20, borderRadius: 24 }}>
      <div style={{ marginBottom: 18 }}>
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--font-display), sans-serif",
            fontSize: 22,
          }}
        >
          {title}
        </h3>
        <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  );
}
