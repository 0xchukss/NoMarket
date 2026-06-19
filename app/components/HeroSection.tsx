import Link from "next/link";
import { LockKeyhole } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

export function HeroSection() {
  return (
    <section style={{ width: "100%", backgroundColor: "var(--nm-bg)", padding: "80px 0 64px" }}>
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "24px",
          }}
        >
          <LockKeyhole size={14} style={{ color: "#ffd208", flexShrink: 0 }} />
          <span
            style={{
              ...telegraf,
              fontSize: "12px",
              color: "var(--nm-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            Private by default.
          </span>
        </div>

        <h1
          style={{
            ...telegraf,
            fontSize: "64px",
            color: "var(--nm-text-primary)",
            lineHeight: 1.1,
            letterSpacing: "-1px",
            margin: "0 auto 24px",
            maxWidth: "700px",
          }}
        >
          Predict anything.
          <br />
          Reveal nothing.
        </h1>

        <p
          style={{
            ...telegraf,
            fontSize: "16px",
            color: "var(--nm-text-body)",
            lineHeight: 1.6,
            maxWidth: "600px",
            margin: "0 auto 40px",
          }}
        >
          NoMarket is a prediction market where your bets are encrypted on-chain.
          Nobody sees what you picked, not even us. Outcomes are resolved by
          UMA's Optimistic Oracle, trustless, on-chain, final.
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link
            href="/markets"
            style={{
              ...telegraf,
              fontSize: "15px",
              color: "var(--nm-text-on-primary)",
              backgroundColor: "var(--nm-text-primary)",
              borderRadius: "4px",
              padding: "10px 24px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Browse Markets
          </Link>

          <Link
            href="/create"
            style={{
              ...telegraf,
              fontSize: "15px",
              color: "var(--nm-text-primary)",
              backgroundColor: "transparent",
              border: "1px solid var(--nm-border)",
              borderRadius: "4px",
              padding: "10px 24px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Create a Market
          </Link>
        </div>

        <p style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-muted)", marginTop: "32px", marginBottom: 0 }}>
          Running on Sepolia testnet · Powered by{" "}
          <span style={{ color: "var(--nm-text-primary)" }}>Zama FHE</span>
        </p>
      </div>
    </section>
  );
}
