import { ArrowRight } from "lucide-react";
import { useReveal } from "../lib/useReveal";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

export function PromoBanner() {
  const ref = useReveal();
  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="nm-reveal nm-section-reveal"
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg-tint)",
      }}
    >
      <div
        style={{
          maxWidth: "1350px",
          margin: "0 auto",
          padding: "24px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
        }}
      >
        <div>
          <span
            style={{
              ...telegraf,
              display: "inline-block",
              fontSize: "10px",
              color: "var(--nm-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              backgroundColor: "var(--nm-bg-cream)",
              borderRadius: "4px",
              padding: "2px 8px",
              marginBottom: "8px",
            }}
          >
            Beta
          </span>

          <p
            style={{
              ...telegraf,
              fontSize: "18px",
              color: "var(--nm-text-primary)",
              margin: 0,
            }}
          >
            Build a combo prediction
          </p>

          <p
            style={{
              ...telegraf,
              fontSize: "13px",
              color: "var(--nm-text-secondary)",
              margin: "4px 0 0 0",
            }}
          >
            Combine multiple predictions in one trade for a bigger payout
          </p>
        </div>

        <a
          href="/create"
          style={{
            ...telegraf,
            fontSize: "14px",
            color: "var(--nm-text-primary)",
            backgroundColor: "#ffd208",
            border: "none",
            borderRadius: "4px",
            padding: "8px 20px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          Get started
          <ArrowRight size={14} />
        </a>
      </div>
    </section>
  );
}
