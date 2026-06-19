import { Share2 } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

function StatusPill({ label, status }: { label: string; status: "live" | "pending" }) {
  const isLive = status === "live";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "6px 12px",
        border: "1px solid var(--nm-border)",
        borderRadius: "4px",
        backgroundColor: "var(--nm-bg)",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: isLive ? "#22c55e" : "#d1d5db",
          flexShrink: 0,
        }}
      />
      <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-primary)" }}>{label}</span>
      <span style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-muted)" }}>
        {isLive ? "live" : "not deployed"}
      </span>
    </div>
  );
}

export function SubgraphHero() {
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
          <Share2 size={14} style={{ color: "#ffd208", flexShrink: 0 }} />
          <span
            style={{
              ...telegraf,
              fontSize: "12px",
              color: "var(--nm-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            Subgraph & API
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
          }}
        >
          NoMarket Subgraph
        </h1>

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
          On-chain events indexed by The Graph Protocol. Query markets, bets,
          and resolutions from both testnets via GraphQL.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "40px",
          }}
        >
          <StatusPill label="Sepolia (Zama)" status="pending" />
          <StatusPill label="Arc testnet" status="pending" />
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <a
            href="https://github.com/0xchukss/NoMarket"
            target="_blank"
            rel="noopener noreferrer"
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
            View on GitHub ↗
          </a>

          <a
            href="/docs#subgraph"
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
            Read the docs
          </a>
        </div>
      </div>
    </section>
  );
}
