import { Scale } from "lucide-react";
import { useReveal } from "../lib/useReveal";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

const logoBox: React.CSSProperties = {
  width: "48px",
  height: "48px",
  backgroundColor: "var(--nm-bg-cream)",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

export function PoweredBy() {
  const ref = useReveal();
  return (
    <section ref={ref as React.RefObject<HTMLDivElement>} className="nm-reveal nm-section-reveal" style={{ width: "100%", backgroundColor: "var(--nm-bg)", padding: "64px 0" }}>
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            ...telegraf,
            fontSize: "14px",
            color: "var(--nm-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: "0 0 32px 0",
          }}
        >
          Powered by
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "80px",
            flexWrap: "wrap",
          }}
        >
          {/* Zama */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={logoBox}>
              <img
                src="/zama-logo.png"
                alt="Zama"
                style={{ width: "28px", height: "28px", objectFit: "contain" }}
              />
            </div>
            <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-secondary)" }}>Zama FHE</span>
          </div>

          {/* Arc Network */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={logoBox}>
              <img
                src="/arc-logo.png"
                alt="Arc Network"
                style={{ width: "28px", height: "28px", objectFit: "contain" }}
              />
            </div>
            <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-secondary)" }}>Arc Network</span>
          </div>

          {/* UMA */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={logoBox}>
              <Scale size={22} style={{ color: "var(--nm-text-primary)" }} />
            </div>
            <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-secondary)" }}>UMA</span>
          </div>
        </div>
      </div>
    </section>
  );
}
