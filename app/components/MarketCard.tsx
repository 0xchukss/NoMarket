import Link from "next/link";
import { ArrowUpRight, Bookmark, Share2 } from "lucide-react";
import type { Market } from "../lib/mockMarkets";
import { MarketVisualBadge } from "./MarketVisualBadge";

export function MarketCard({ market }: { market: Market }) {
  return (
    <article className="oracle-card" style={{ padding: "16px", transition: "transform 160ms ease, box-shadow 160ms ease" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-2.5">
          <MarketVisualBadge market={market} size="sm" />
          <div className="min-w-0">
            <p
              style={{
                margin: 0,
                fontFamily: "var(--oracle-mono)",
                fontSize: "0.66rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "rgba(244,213,141,0.6)",
              }}
            >
              {market.category}
            </p>
            <Link
              href={`/market/${market.id}`}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontFamily: "var(--oracle-serif)",
                fontSize: "0.9rem",
                fontWeight: 900,
                color: "#efe8db",
                lineHeight: 1.35,
                marginTop: "4px",
              }}
            >
              {market.title}
            </Link>
          </div>
        </div>

        <div
          style={{
            flexShrink: 0,
            border: "1px solid rgba(244,213,141,0.22)",
            borderRadius: "8px",
            background: "rgba(244,213,141,0.07)",
            padding: "6px 10px",
            textAlign: "right",
          }}
        >
          <p style={{ margin: 0, fontFamily: "var(--oracle-mono)", fontSize: "1rem", fontWeight: 900, color: "#f4d58d" }}>
            {market.probability}%
          </p>
          <p style={{ margin: 0, fontFamily: "var(--oracle-mono)", fontSize: "0.62rem", color: "rgba(244,239,228,0.44)" }}>chance</p>
        </div>
      </div>

      <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "7px" }}>
        {market.outcomes.map((outcome) => (
          <div key={outcome.label} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "999px",
                  flexShrink: 0,
                  background:
                    outcome.tone === "no"
                      ? "#f87171"
                      : outcome.tone === "yes"
                        ? "#6ee7b7"
                        : "#93c5fd",
                }}
              />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--oracle-mono)",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "rgba(244,239,228,0.72)",
                }}
              >
                {outcome.label}
              </span>
            </div>
            <span style={{ fontFamily: "var(--oracle-mono)", fontSize: "0.72rem", fontWeight: 900, color: "#efe8db" }}>
              {outcome.probability}%
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <Link
          href={`/market/${market.id}?side=yes`}
          style={{
            display: "grid",
            height: "32px",
            placeItems: "center",
            borderRadius: "6px",
            background: "rgba(104,211,160,0.12)",
            border: "1px solid rgba(104,211,160,0.2)",
            fontFamily: "var(--oracle-mono)",
            fontSize: "0.72rem",
            fontWeight: 900,
            color: "#8ef0b8",
          }}
        >
          Yes
        </Link>
        <Link
          href={`/market/${market.id}?side=no`}
          style={{
            display: "grid",
            height: "32px",
            placeItems: "center",
            borderRadius: "6px",
            background: "rgba(221,120,120,0.1)",
            border: "1px solid rgba(221,120,120,0.18)",
            fontFamily: "var(--oracle-mono)",
            fontSize: "0.72rem",
            fontWeight: 900,
            color: "#ffabab",
          }}
        >
          No
        </Link>
      </div>

      <div
        style={{
          marginTop: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "var(--oracle-mono)",
          fontSize: "0.68rem",
          color: "rgba(244,239,228,0.4)",
        }}
      >
        <span>{market.volume}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Share2 style={{ width: "13px", height: "13px", cursor: "pointer" }} />
          <Bookmark style={{ width: "13px", height: "13px", cursor: "pointer" }} />
          <Link href={`/market/${market.id}`} style={{ display: "flex", alignItems: "center", gap: "4px", color: "rgba(244,213,141,0.6)" }}>
            Open <ArrowUpRight style={{ width: "11px", height: "11px" }} />
          </Link>
        </div>
      </div>
    </article>
  );
}
