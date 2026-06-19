import Link from "next/link";
import { Plus } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

export function DraftsHeader() {
  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        borderBottom: "1px solid var(--nm-divider)",
        padding: "48px 0 32px",
      }}
    >
      <div
        style={{
          maxWidth: "1350px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "24px",
        }}
      >
        <div>
          <h1
            style={{
              ...telegraf,
              fontSize: "36px",
              color: "var(--nm-text-primary)",
              letterSpacing: "-0.6px",
              margin: "0 0 8px 0",
            }}
          >
            Drafts
          </h1>
          <p
            style={{
              ...telegraf,
              fontSize: "15px",
              color: "var(--nm-text-body)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Markets you've saved locally but haven't deployed on-chain yet.
          </p>
        </div>

        <Link
          href="/create"
          style={{
            ...telegraf,
            fontSize: "14px",
            color: "var(--nm-text-primary)",
            backgroundColor: "#ffd208",
            borderRadius: "4px",
            padding: "8px 20px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          <Plus size={14} />
          Create new market
        </Link>
      </div>
    </section>
  );
}
