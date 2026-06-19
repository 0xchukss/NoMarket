import Link from "next/link";
import { LockKeyhole } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

export function HowHero() {
  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        padding: "80px 0 64px",
        borderBottom: "1px solid var(--nm-divider)",
      }}
    >
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
            How it works
          </span>
        </div>

        <h1
          style={{
            ...telegraf,
            fontSize: "56px",
            color: "var(--nm-text-primary)",
            lineHeight: 1.1,
            letterSpacing: "-0.8px",
            margin: "0 auto 24px",
            maxWidth: "640px",
          }}
        >
          Predict. Encrypt. Win.
        </h1>

        <p
          style={{
            ...telegraf,
            fontSize: "16px",
            color: "var(--nm-text-body)",
            lineHeight: 1.6,
            maxWidth: "520px",
            margin: "0 auto 40px",
          }}
        >
          NoMarket lets you bet on complex combinations of outcomes with your
          positions encrypted on-chain the whole time.
        </p>

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
          Browse open markets
        </Link>
      </div>
    </section>
  );
}
