import Link from "next/link";
import { ArrowRight } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

export function HowCtaBanner() {
  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg-tint)",
        borderTop: "1px solid var(--nm-divider)",
        padding: "80px 0",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <ArrowRight
          size={32}
          style={{ color: "#ffd208", marginBottom: "24px" }}
        />

        <h2
          style={{
            ...telegraf,
            fontSize: "36px",
            color: "var(--nm-text-primary)",
            letterSpacing: "-0.6px",
            lineHeight: 1.15,
            margin: "0 auto 16px",
          }}
        >
          Ready to place your first bet?
        </h2>

        <p
          style={{
            ...telegraf,
            fontSize: "15px",
            color: "var(--nm-text-body)",
            lineHeight: 1.6,
            margin: "0 auto 36px",
            maxWidth: "400px",
          }}
        >
          Pick an open market and build your expression. Your first bet takes
          about two minutes.
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
              padding: "10px 28px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Browse markets
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
