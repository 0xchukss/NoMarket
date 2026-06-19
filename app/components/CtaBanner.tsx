import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useReveal } from "../lib/useReveal";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

export function CtaBanner() {
  const ref = useReveal();
  return (
    <section ref={ref as React.RefObject<HTMLDivElement>} className="nm-reveal nm-section-reveal" style={{ width: "100%", backgroundColor: "var(--nm-bg-tint)", padding: "80px 0" }}>
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <LockKeyhole size={32} style={{ color: "#ffd208", marginBottom: "24px" }} />

        <h2
          style={{
            ...telegraf,
            fontSize: "48px",
            color: "var(--nm-text-primary)",
            letterSpacing: "-0.8px",
            lineHeight: 1.15,
            maxWidth: "600px",
            margin: "0 auto 20px",
          }}
        >
          Bet privately. Win openly.
        </h2>

        <p
          style={{
            ...telegraf,
            fontSize: "16px",
            color: "var(--nm-text-body)",
            lineHeight: 1.6,
            maxWidth: "520px",
            margin: "0 auto 36px",
          }}
        >
          NoMarket is live on Sepolia. Connect your wallet and place your first encrypted bet.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
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
              padding: "10px 28px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Open app
          </Link>

          <Link
            href="/docs"
            style={{
              ...telegraf,
              fontSize: "15px",
              color: "var(--nm-text-primary)",
              backgroundColor: "transparent",
              border: "1px solid var(--nm-border)",
              borderRadius: "4px",
              padding: "10px 28px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Read the docs
          </Link>
        </div>
      </div>
    </section>
  );
}
