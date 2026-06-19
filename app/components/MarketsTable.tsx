import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BarChart2 } from "lucide-react";
import type { ChainConfig } from "../lib/chains";
import type { Market } from "../lib/mockMarkets";
import type { CreatedMarket } from "../lib/marketStorage";
import { isTradingOpen } from "../lib/marketLifecycle";
import { MarketVisualBadge } from "./MarketVisualBadge";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

const COL = {
  market: { flex: 1, minWidth: 0 },
  prob:   { width: "80px",  flexShrink: 0 },
  vol:    { width: "90px",  flexShrink: 0 },
  net:    { width: "80px",  flexShrink: 0 },
  status: { width: "80px",  flexShrink: 0 },
  action: { width: "56px",  flexShrink: 0, textAlign: "right" as const },
};

function isCreatedMarket(market: Market | CreatedMarket): market is CreatedMarket {
  return "lifecycle" in market;
}

function isResolved(market: Market | CreatedMarket) {
  return (
    isCreatedMarket(market) &&
    market.resolution?.status === "resolved" &&
    market.resolution?.outcomeVector !== undefined
  );
}

function NetworkPill({ chain }: { chain: ChainConfig }) {
  return (
    <span
      style={{
        ...telegraf,
        fontSize: "11px",
        color: chain.color,
        backgroundColor: `${chain.color}14`,
        border: `1px solid ${chain.color}33`,
        borderRadius: "3px",
        padding: "2px 7px",
        letterSpacing: "0.06em",
        display: "inline-block",
      }}
    >
      {chain.shortName.toUpperCase()}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span
        style={{
          ...telegraf,
          fontSize: "13px",
          color: "#22c55e",
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        <span
          className="nm-dot-pulse"
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "#22c55e",
            flexShrink: 0,
            display: "inline-block",
          }}
        />
        Active
      </span>
    );
  }
  return (
    <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-muted)" }}>
      Ended
    </span>
  );
}

function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "56px 24px",
        textAlign: "center",
      }}
    >
      <BarChart2 size={40} style={{ color: "var(--nm-border)" }} />
      <p style={{ ...telegraf, fontSize: "15px", color: "var(--nm-text-primary)", margin: 0 }}>
        {message}
      </p>
      {hint && (
        <p style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-muted)", margin: 0 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

type Props = {
  markets: Array<Market | CreatedMarket>;
  chain: ChainConfig;
  emptyMessage?: string;
  emptyHint?: string;
  positionMarketIds?: Set<string>;
};

export function MarketsTable({
  markets,
  chain,
  emptyMessage = "No markets found.",
  emptyHint = "Try a different title, category, atom, or outcome term.",
  positionMarketIds,
}: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const rows = markets.slice(0, 9);

  return (
    <div
      data-tour-id="markets-table"
      style={{
        border: "1px solid var(--nm-border)",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      {/* header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "10px 20px",
          backgroundColor: "var(--nm-bg-tint)",
          borderBottom: "1px solid var(--nm-divider)",
        }}
      >
        {(["Market", "Probability", "Volume", "Network", "Status", "Action"] as const).map(
          (col, i) => {
            const colStyle = [COL.market, COL.prob, COL.vol, COL.net, COL.status, COL.action][i];
            return (
              <span
                key={col}
                style={{
                  ...telegraf,
                  ...colStyle,
                  fontSize: "11px",
                  color: "var(--nm-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {col}
              </span>
            );
          }
        )}
      </div>

      {/* empty state */}
      {rows.length === 0 && <EmptyState message={emptyMessage} hint={emptyHint} />}

      {/* data rows */}
      {rows.map((market, i) => {
        const tradingOpen = !isCreatedMarket(market) || isTradingOpen(market.lifecycle, now);
        const resolved = isResolved(market);
        const isLast = i === rows.length - 1;
        const marketId = isCreatedMarket(market) ? market.onchain.marketId : market.id;
        const hasPosition = Boolean(positionMarketIds?.size && marketId && positionMarketIds.has(marketId));

        return (
          <div
            key={market.id}
            className="nm-market-row"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "14px 20px",
              borderBottom: isLast ? "none" : "1px solid var(--nm-divider)",
              transition: "background-color 120ms ease",
            }}
          >
            {/* market name + badge */}
            <div
              style={{
                ...COL.market,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                overflow: "hidden",
              }}
            >
              <MarketVisualBadge market={market} size="sm" />
              <span
                style={{
                  ...telegraf,
                  fontSize: "14px",
                  color: "var(--nm-text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {market.title}
              </span>
              {hasPosition && (
                <span
                  style={{
                    ...telegraf,
                    fontSize: "10px",
                    color: "#22c55e",
                    backgroundColor: "rgba(34,197,94,0.08)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    borderRadius: "3px",
                    padding: "2px 6px",
                    letterSpacing: "0.06em",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  BET
                </span>
              )}
            </div>

            {/* probability */}
            <span
              style={{
                ...telegraf,
                ...COL.prob,
                fontSize: "14px",
                color: tradingOpen ? "var(--nm-text-primary)" : resolved ? "#22c55e" : "var(--nm-text-muted)",
              }}
            >
              {tradingOpen ? `${market.probability}%` : resolved ? "Resolved" : "Pending"}
            </span>

            {/* volume */}
            <span
              style={{
                ...telegraf,
                ...COL.vol,
                fontSize: "14px",
                color: "var(--nm-text-body)",
              }}
            >
              {market.volume.replace("$", "")}
            </span>

            {/* network */}
            <div style={COL.net}>
              <NetworkPill chain={chain} />
            </div>

            {/* status */}
            <div style={COL.status}>
              <StatusBadge active={tradingOpen} />
            </div>

            {/* action */}
            <div style={COL.action}>
              <Link
                href={`/market/${market.id}`}
                style={{
                  ...telegraf,
                  fontSize: "13px",
                  color: "var(--nm-text-primary)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                Open
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
