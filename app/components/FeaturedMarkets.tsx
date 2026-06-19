import React from "react";
import { useReveal } from "../lib/useReveal";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type MarketData = {
  category: string;
  title: string;
  left: { label: string; pct: number };
  right: { label: string; pct: number };
  volume: string;
  ends: string;
};

const MARKETS: MarketData[] = [
  {
    category: "Sports · Soccer · World Cup",
    title: "Canada vs. Qatar",
    left: { label: "Canada", pct: 68 },
    right: { label: "Qatar", pct: 32 },
    volume: "$1.2M",
    ends: "Dec 18, 2026",
  },
  {
    category: "Economy · FOMC",
    title: "Fed Decision in July",
    left: { label: "Hold", pct: 73 },
    right: { label: "Cut 25bps", pct: 27 },
    volume: "$890K",
    ends: "Jul 30, 2026",
  },
  {
    category: "Sports · Soccer",
    title: "World Cup Winner",
    left: { label: "Field", pct: 78 },
    right: { label: "Brazil", pct: 22 },
    volume: "$4.1M",
    ends: "Dec 21, 2026",
  },
  {
    category: "Crypto",
    title: "BTC Up or Down 5m",
    left: { label: "Up", pct: 54 },
    right: { label: "Down", pct: 46 },
    volume: "$220K",
    ends: "5 min",
  },
];

function MarketCard({ market }: { market: MarketData }) {
  const leftWins = market.left.pct >= market.right.pct;

  return (
    <div
      className="nm-reveal nm-card"
      style={{
        width: "340px",
        flexShrink: 0,
        scrollSnapAlign: "start",
        backgroundColor: "var(--nm-bg)",
        border: "1px solid var(--nm-border)",
        borderRadius: "8px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxSizing: "border-box",
      }}
    >
      <p
        style={{
          ...telegraf,
          fontSize: "11px",
          color: "var(--nm-text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: 0,
        }}
      >
        {market.category}
      </p>

      <p
        style={{
          ...telegraf,
          fontSize: "16px",
          color: "var(--nm-text-primary)",
          margin: 0,
          lineHeight: 1.35,
        }}
      >
        {market.title}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px",
          marginTop: "4px",
        }}
      >
        <span
          style={{
            ...telegraf,
            fontSize: "14px",
            color: leftWins ? "#30a159" : "#e23939",
          }}
        >
          {market.left.label} {market.left.pct}%
        </span>
        <span
          style={{
            ...telegraf,
            fontSize: "14px",
            color: leftWins ? "#e23939" : "#30a159",
            textAlign: "right",
          }}
        >
          {market.right.label} {market.right.pct}%
        </span>
      </div>

      <div
        style={{
          marginTop: "auto",
          paddingTop: "12px",
          borderTop: "1px solid var(--nm-divider)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ ...telegraf, fontSize: "11px", color: "var(--nm-text-secondary)" }}>
          {market.volume} Vol
        </span>
        <span style={{ ...telegraf, fontSize: "11px", color: "var(--nm-text-secondary)" }}>
          Ends {market.ends}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span
          style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "999px",
            backgroundColor: leftWins ? "#30a159" : "#e23939",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "999px",
            backgroundColor: leftWins ? "#e23939" : "#30a159",
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
}

export function FeaturedMarkets() {
  const ref = useReveal(".nm-card");
  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="nm-section-reveal"
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        padding: "32px 0",
      }}
    >
      <div
        style={{
          maxWidth: "1350px",
          margin: "0 auto",
          padding: "0 24px",
          position: "relative",
        }}
      >
        <h2
          style={{
            ...telegraf,
            fontSize: "20px",
            color: "var(--nm-text-primary)",
            letterSpacing: "-0.2px",
            margin: "0 0 20px 0",
          }}
        >
          Featured markets
        </h2>

        <div
          className="nm-catbar-scroll"
          style={{
            display: "flex",
            gap: "16px",
            overflowX: "auto",
            overflowY: "hidden",
            scrollSnapType: "x mandatory",
            paddingBottom: "4px",
          }}
        >
          {MARKETS.map((m) => (
            <MarketCard key={m.title} market={m} />
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "72px",
            background: "linear-gradient(to right, transparent, var(--nm-bg))",
            pointerEvents: "none",
          }}
        />
      </div>
    </section>
  );
}
