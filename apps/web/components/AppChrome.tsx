import { AutoRefresh } from "@/components/AutoRefresh";
import { Filters } from "@/components/Filters";
import { TopNav } from "@/components/TopNav";
import { getAvailableWikis } from "@/lib/queries";

export async function AppChrome() {
  const availableWikis = await getAvailableWikis();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "WikiWatch";

  return (
    <section
      style={{
        display: "grid",
        gap: 24,
      }}
    >
      <div
        className="glass-card"
        style={{
          borderRadius: 28,
          padding: "28px clamp(20px, 4vw, 40px)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "auto -60px -80px auto",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(119,240,194,0.32), transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div className="eyebrow">Live Wikimedia Analytics</div>
        <div style={{ marginTop: 14 }}>
          <AutoRefresh intervalMs={60000} />
        </div>
        <div style={{ marginTop: 16, marginBottom: 18 }}>
          <TopNav />
        </div>
        <div
          className="hero-grid"
          style={{
            marginTop: 16,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display), sans-serif",
                fontSize: "clamp(2.6rem, 6vw, 4.8rem)",
                lineHeight: 0.96,
                letterSpacing: "-0.04em",
              }}
            >
              {appName}
            </h1>
            <p
              className="muted"
              style={{
                margin: "14px 0 0",
                maxWidth: 720,
                fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
                lineHeight: 1.7,
              }}
            >
              Track the most edited Wikipedia pages across multiple time windows,
              compare human and bot activity, and watch the stream update from
              Wikimedia EventStreams in near real time.
            </p>
          </div>
          <Filters availableWikis={availableWikis} />
        </div>
      </div>
    </section>
  );
}
