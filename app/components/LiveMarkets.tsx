import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useReveal } from "../lib/useReveal";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Market = {
  question: string;
  meta: string;
  resolution: string;
  resolved: boolean;
};

const MARKETS: Market[] = [
  {
    question: "Will ETH hit $5,000 before July 2025?",
    meta: "2 atoms · 14 bets · 0.42 ETH staked",
    resolution: "Resolves via UMA · Sepolia",
    resolved: false,
  },
  {
    question: "Will Arbitrum deploy a new L3 and reach 1M users?",
    meta: "3 atoms · 8 bets · 0.21 ETH staked",
    resolution: "Resolves via UMA · Sepolia",
    resolved: false,
  },
  {
    question: "Will Zama FHEVM reach mainnet before May 2025?",
    meta: "1 atom · 32 bets · 1.1 ETH staked",
    resolution: "Outcome: YES · Sepolia",
    resolved: true,
  },
];

function MarketCard({ market }: { market: Market }) {
  return (
    <div
      className="nm-reveal nm-card"
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        border: "1px solid var(--nm-border)",
        borderRadius: "8px",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "8px",
          }}
        >
          <span
            className={market.resolved ? undefined : "nm-dot-pulse"}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "999px",
              backgroundColor: market.resolved ? "#ffd208" : "#30a159",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              ...telegraf,
              fontSize: "12px",
              color: market.resolved ? "#ffd208" : "#30a159",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {market.resolved ? "Resolved" : "Active"}
          </span>
        </div>

        <p
          style={{
            ...telegraf,
            fontSize: "16px",
            color: "var(--nm-text-primary)",
            lineHeight: 1.4,
            margin: "0 0 6px 0",
          }}
        >
          {market.question}
        </p>

        <p style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-secondary)", margin: "0 0 4px 0" }}>
          {market.meta}
        </p>

        <p style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-secondary)", margin: 0 }}>
          {market.resolution}
        </p>
      </div>

      <div style={{ marginLeft: "auto", flexShrink: 0 }}>
        <Link
          href="/markets"
          style={{
            ...telegraf,
            fontSize: "14px",
            color: "var(--nm-text-primary)",
            backgroundColor: market.resolved ? "transparent" : "#ffd208",
            border: market.resolved ? "1px solid var(--nm-border)" : "none",
            borderRadius: "4px",
            padding: "8px 20px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          {market.resolved ? "View results" : "Bet"}
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

export function LiveMarkets() {
  const ref = useReveal(".nm-card");
  return (
    <section ref={ref as React.RefObject<HTMLDivElement>} className="nm-section-reveal" style={{ width: "100%", backgroundColor: "var(--nm-bg)", padding: "80px 0" }}>
      <div
        style={{
          maxWidth: "1350px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <h2
            style={{
              ...telegraf,
              fontSize: "36px",
              color: "var(--nm-text-primary)",
              letterSpacing: "-0.6px",
              margin: 0,
            }}
          >
            Open markets
          </h2>

          <Link
            href="/markets"
            className="nm-explore-link"
            style={{
              ...telegraf,
              fontSize: "14px",
              color: "var(--nm-text-primary)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              transition: "color 160ms ease",
            }}
          >
            View all
            <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {MARKETS.map((m) => (
            <MarketCard key={m.question} market={m} />
          ))}
        </div>
      </div>
    </section>
  );
}
