import Link from "next/link";
import { ArrowUpRight, Clock3, Wallet2 } from "lucide-react";
import { formatEther } from "viem";
import { MarketVisualBadge } from "./MarketVisualBadge";
import { formatOutcomeVectorBinary } from "../lib/resolution";
import type { ChainConfig } from "../lib/chains";
import type { CreatedMarket } from "../lib/marketStorage";

export type HistoryBet = {
  market: CreatedMarket;
  betId: bigint;
  bettor: string;
  publicStake: bigint;
  outcomeMask?: bigint;
  careMask?: bigint;
  expression?: string;
  tx: string;
};

export type ResolutionState = {
  resolved: boolean;
  outcomeVector?: number;
};

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

function shortAddress(addr: string) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
}

function resultForBet(bet: HistoryBet, resolution?: ResolutionState) {
  if (!resolution?.resolved || resolution.outcomeVector === undefined) {
    return { label: "Pending", color: "#ffd208" };
  }
  if (bet.outcomeMask === undefined || bet.careMask === undefined) {
    return { label: "Private", color: "#888888" };
  }
  const matched = (resolution.outcomeVector & Number(bet.careMask)) === Number(bet.outcomeMask);
  return matched
    ? { label: "Won", color: "#22c55e" }
    : { label: "Lost", color: "#ef4444" };
}

export function resolutionForMarket(
  market: CreatedMarket,
  resolutions: Map<string, ResolutionState>
): ResolutionState {
  const indexed = resolutions.get(market.onchain.marketId);
  if (indexed) return indexed;
  return {
    resolved: market.resolution.status === "resolved",
    outcomeVector:
      market.resolution.status === "resolved"
        ? market.resolution.outcomeVector
        : undefined,
  };
}

function colorBadge(color: string): React.CSSProperties {
  return {
    ...telegraf,
    display: "inline-block",
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "4px",
    backgroundColor: `${color}14`,
    color,
    border: `1px solid ${color}30`,
    whiteSpace: "nowrap",
  };
}

const tableWrap: React.CSSProperties = {
  border: "1px solid var(--nm-border)",
  borderRadius: "6px",
  overflow: "hidden",
};

const tableLabel: React.CSSProperties = {
  ...telegraf,
  fontSize: "11px",
  color: "var(--nm-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  padding: "14px 16px 10px",
  margin: 0,
};

const headerCell: React.CSSProperties = {
  ...telegraf,
  fontSize: "12px",
  color: "var(--nm-text-secondary)",
};

const marketNameCol: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
};

const marketTitle: React.CSSProperties = {
  ...telegraf,
  fontSize: "13px",
  color: "var(--nm-text-primary)",
  margin: 0,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
};

const marketSub: React.CSSProperties = {
  ...telegraf,
  fontSize: "11px",
  color: "var(--nm-text-muted)",
  textTransform: "uppercase",
  margin: "2px 0 0",
};

function EmptyStateBox({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--nm-border)",
        borderRadius: "6px",
        padding: "56px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
        {icon}
      </div>
      <p style={{ ...telegraf, fontSize: "15px", color: "var(--nm-text-primary)", margin: "0 0 6px" }}>
        {title}
      </p>
      <p style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-muted)", margin: 0 }}>
        {hint}
      </p>
    </div>
  );
}

function EndedMarketsTable({
  markets,
  resolutions,
}: {
  markets: CreatedMarket[];
  resolutions: Map<string, ResolutionState>;
}) {
  const cols = "1fr 120px 80px 56px";
  return (
    <div style={tableWrap}>
      <p style={tableLabel}>Ended Markets</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: cols,
          backgroundColor: "var(--nm-bg-tint)",
          borderBottom: "1px solid var(--nm-border)",
          padding: "10px 16px",
        }}
      >
        <span style={headerCell}>Market</span>
        <span style={headerCell}>Outcome</span>
        <span style={headerCell}>Volume</span>
        <span style={headerCell}>Action</span>
      </div>
      {markets.map((market) => {
        const resolution = resolutionForMarket(market, resolutions);
        const confirmed = resolution.resolved && resolution.outcomeVector !== undefined;
        return (
          <div
            key={market.id}
            className="nm-market-row"
            style={{
              display: "grid",
              gridTemplateColumns: cols,
              alignItems: "center",
              padding: "12px 16px",
              borderTop: "1px solid var(--nm-divider)",
            }}
          >
            <div style={marketNameCol}>
              <MarketVisualBadge market={market} size="sm" />
              <div style={{ minWidth: 0 }}>
                <p style={marketTitle}>{market.title}</p>
                <p style={marketSub}>
                  {market.category} · #{market.onchain.marketId}
                </p>
              </div>
            </div>

            <div>
              <span style={colorBadge(confirmed ? "#22c55e" : "#ffd208")}>
                {confirmed ? "Confirmed" : "Pending"}
              </span>
              {resolution.outcomeVector !== undefined && (
                <p style={{ ...telegraf, fontSize: "11px", color: "var(--nm-text-muted)", margin: "3px 0 0" }}>
                  {formatOutcomeVectorBinary(resolution.outcomeVector, market.atoms.length)}
                </p>
              )}
            </div>

            <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-body)" }}>
              {market.volume.replace("$", "")}
            </span>

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
              className="nm-footer-link"
            >
              Open <ArrowUpRight size={13} />
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function BetsTable({
  bets,
  resolutions,
  chain,
  mode,
}: {
  bets: HistoryBet[];
  resolutions: Map<string, ResolutionState>;
  chain: ChainConfig;
  mode: "personal" | "general";
}) {
  const cols = "1fr 100px 130px 160px 80px";
  return (
    <div style={tableWrap}>
      <p style={tableLabel}>{mode === "personal" ? "Your Bets" : "All Bets"}</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: cols,
          backgroundColor: "var(--nm-bg-tint)",
          borderBottom: "1px solid var(--nm-border)",
          padding: "10px 16px",
        }}
      >
        <span style={headerCell}>Market</span>
        <span style={headerCell}>Wallet</span>
        <span style={headerCell}>Stake</span>
        <span style={headerCell}>Expression</span>
        <span style={headerCell}>Result</span>
      </div>
      {bets.map((bet) => {
        const result = resultForBet(bet, resolutions.get(bet.market.onchain.marketId));
        return (
          <Link
            key={`${bet.market.id}-${bet.tx}-${bet.betId}`}
            href={`/market/${bet.market.id}`}
            className="nm-market-row"
            style={{
              display: "grid",
              gridTemplateColumns: cols,
              alignItems: "center",
              padding: "12px 16px",
              borderTop: "1px solid var(--nm-divider)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={marketNameCol}>
              <MarketVisualBadge market={bet.market} size="sm" />
              <div style={{ minWidth: 0 }}>
                <p style={marketTitle}>{bet.market.title}</p>
                <p style={marketSub}>
                  {bet.market.category} · Bet #{bet.betId.toString()}
                </p>
              </div>
            </div>

            <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-body)" }}>
              {shortAddress(bet.bettor)}
            </span>

            <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-primary)" }}>
              {formatEther(bet.publicStake)} {chain.nativeCurrency}
            </span>

            <p
              style={{
                ...telegraf,
                fontSize: "13px",
                color: "var(--nm-text-secondary)",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {bet.expression || "private"}
            </p>

            <span style={colorBadge(result.color)}>{result.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

type Props = {
  status: "loading" | "idle" | "error";
  message: string;
  mode: "personal" | "general";
  address: string | undefined;
  visibleBets: HistoryBet[];
  visibleEndedMarkets: CreatedMarket[];
  resolutions: Map<string, ResolutionState>;
  chain: ChainConfig;
};

export function HistoryBody({
  status,
  message,
  mode,
  address,
  visibleBets,
  visibleEndedMarkets,
  resolutions,
  chain,
}: Props) {
  if (status === "loading") {
    return (
      <div
        style={{
          border: "1px solid var(--nm-border)",
          borderRadius: "6px",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <p style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-muted)", margin: 0 }}>
          Loading {chain.shortName} history...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        style={{
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "6px",
          padding: "16px 20px",
        }}
      >
        <p style={{ ...telegraf, fontSize: "13px", color: "#ef4444", margin: 0 }}>
          {message}
        </p>
      </div>
    );
  }

  if (mode === "personal" && !address) {
    return (
      <EmptyStateBox
        icon={<Wallet2 size={32} color="var(--nm-icon-muted)" />}
        title="Connect your wallet."
        hint="Connect to see your personal bet history on this network."
      />
    );
  }

  if (visibleBets.length === 0 && visibleEndedMarkets.length === 0) {
    return (
      <EmptyStateBox
        icon={<Clock3 size={32} color="var(--nm-icon-muted)" />}
        title="No history found."
        hint="Ended markets and confirmed bets appear here."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {visibleEndedMarkets.length > 0 && (
        <EndedMarketsTable markets={visibleEndedMarkets} resolutions={resolutions} />
      )}
      {visibleBets.length > 0 && (
        <BetsTable bets={visibleBets} resolutions={resolutions} chain={chain} mode={mode} />
      )}
    </div>
  );
}
