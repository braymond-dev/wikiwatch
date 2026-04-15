type StatCardProps = {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "mint" | "amber" | "blue";
  compact?: boolean;
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

export function StatCard({
  label,
  value,
  sublabel,
  tone = "blue",
  compact = false,
}: StatCardProps) {
  return (
    <div
      className="glass-card"
      style={{
        padding: compact ? 16 : 20,
        borderRadius: 22,
        background: toneMap[tone].background,
        borderColor: toneMap[tone].borderColor,
      }}
    >
      <div className="muted" style={{ fontSize: compact ? 13 : 14, marginBottom: sublabel ? 6 : 12 }}>
        {label}
      </div>
      {sublabel ? (
        <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
          {sublabel}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: "var(--font-display), sans-serif",
          fontSize: compact
            ? "clamp(1.45rem, 2.1vw, 2.15rem)"
            : "clamp(1.8rem, 3vw, 2.7rem)",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
