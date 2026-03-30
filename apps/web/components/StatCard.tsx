type StatCardProps = {
  label: string;
  value: string;
  tone?: "mint" | "amber" | "blue";
};

const toneMap = {
  mint: {
    background: "linear-gradient(135deg, rgba(119,240,194,0.16), rgba(9,18,31,0.6))",
    borderColor: "rgba(119,240,194,0.24)",
  },
  amber: {
    background: "linear-gradient(135deg, rgba(255,179,107,0.16), rgba(9,18,31,0.6))",
    borderColor: "rgba(255,179,107,0.24)",
  },
  blue: {
    background: "linear-gradient(135deg, rgba(127,194,255,0.16), rgba(9,18,31,0.6))",
    borderColor: "rgba(127,194,255,0.24)",
  },
};

export function StatCard({ label, value, tone = "blue" }: StatCardProps) {
  return (
    <div
      className="glass-card"
      style={{
        padding: 20,
        borderRadius: 22,
        background: toneMap[tone].background,
        borderColor: toneMap[tone].borderColor,
      }}
    >
      <div className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display), sans-serif",
          fontSize: "clamp(1.8rem, 3vw, 2.7rem)",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

