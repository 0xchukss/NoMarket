import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, BarChart3, CheckCircle2, CircleDollarSign, LockKeyhole, Network, Sparkles, XCircle } from "lucide-react";
import { CHAIN_ORDER, CHAINS, type ChainConfig } from "../lib/chains";
import { useSelectedChain } from "../lib/chains/useSelectedChain";
import type { Market } from "../lib/mockMarkets";
import type { CreatedMarket } from "../lib/marketStorage";
import { formatOutcomeVectorBinary } from "../lib/resolution";
import { isTradingOpen } from "../lib/marketLifecycle";
import { MarketVisualBadge } from "./MarketVisualBadge";

const nodeTags = ["Boolean claims", "Private liquidity", "UMA automation", "Encrypted payouts", "Conditional markets"];

export function OracleFormulaVeil() {
  return (
    <div className="oracle-formula-veil" aria-hidden="true">
      <span>&Sigma;&Phi;&Omega;&Theta;&Psi;&Lambda;</span>
      <span>p(x) = &Sigma; q_i * w_i</span>
      <span>f(&alpha;, &beta;) -&gt; sealed</span>
      <span>&lambda; proof &there4; valid</span>
    </div>
  );
}

export function NetworkTabs() {
  const { chainId, setChainId } = useSelectedChain();
  return (
    <div className="oracle-network-tabs" aria-label="Network selection">
      {CHAIN_ORDER.map((id) => {
        const active = chainId === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setChainId(id)}
            className={active ? "oracle-network-tab is-active" : "oracle-network-tab"}
          >
            <span className={`oracle-network-mark oracle-network-mark--${id}`} />
            {CHAINS[id].shortName.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

export function OracleNodeMap() {
  const nodes = [
    { x: 16, y: 31, label: nodeTags[0] },
    { x: 40, y: 23, label: nodeTags[1] },
    { x: 70, y: 32, label: nodeTags[2] },
    { x: 23, y: 71, label: nodeTags[3] },
    { x: 57, y: 76, label: nodeTags[4] },
    { x: 84, y: 61, label: "UMA flow" }
  ];
  const links = [
    [0, 1], [0, 3], [0, 4], [1, 2], [1, 4], [2, 4], [2, 5], [3, 4], [3, 5], [4, 5]
  ];

  return (
    <div className="oracle-node-map oracle-panel">
      <div className="oracle-panel-title">Outcome Graph</div>
      <svg viewBox="0 0 100 100" role="img" aria-label="NoMarket outcome graph">
        <defs>
          <linearGradient id="oracleLine" x1="0" x2="1">
            <stop offset="0%" stopColor="#d9a65c" />
            <stop offset="55%" stopColor="#f1d29a" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {links.map(([a, b], index) => (
          <line
            key={`${a}-${b}-${index}`}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            className={index % 3 === 0 ? "oracle-link oracle-link--purple" : "oracle-link"}
          />
        ))}
        {nodes.map((node, index) => (
          <g key={node.label} filter="url(#nodeGlow)">
            <circle cx={node.x} cy={node.y} r="1.9" className={index % 2 ? "oracle-node oracle-node--purple" : "oracle-node"} />
            <rect x={node.x - 10} y={node.y - 8.2} width="20" height="5.2" rx="2.3" className="oracle-node-label-bg" />
            <text x={node.x} y={node.y - 4.4} textAnchor="middle" className="oracle-node-label">
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function MiniSparkline() {
  return (
    <svg viewBox="0 0 120 44" className="oracle-mini-chart" aria-label="Probability sparkline">
      <polyline points="4,36 16,35 27,28 40,32 51,18 63,24 74,13 85,18 96,9 116,14" />
      <path d="M4 40 L4 36 L16 35 L27 28 L40 32 L51 18 L63 24 L74 13 L85 18 L96 9 L116 14 L116 40 Z" />
    </svg>
  );
}

export function MiniBars() {
  return (
    <div className="oracle-bars" aria-label="Market activity bars">
      {[38, 61, 44, 77, 54, 68, 49, 83, 58].map((height, index) => (
        <span key={index} style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

export function OraclePriceChart({ market }: { market: Market }) {
  const candles = [32, 44, 38, 59, 51, 48, 62, 57, 74, 68, 78, 71, 83, 88, 80, 92];
  return (
    <div className="oracle-chart oracle-panel">
      <div className="oracle-chart-head">
        <MarketVisualBadge market={market} size="xl" />
        <div>
          <p className="oracle-kicker">{market.category}</p>
          <h2>{market.title}</h2>
        </div>
      </div>
      <svg viewBox="0 0 720 360" role="img" aria-label={`${market.title} prediction chart`}>
        <defs>
          <linearGradient id="goldArc" x1="0" x2="1">
            <stop offset="0%" stopColor="#aa7a35" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#f2d48a" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="purpleArc" x1="0" x2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#d8b4fe" stopOpacity="0.75" />
          </linearGradient>
        </defs>
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`h-${i}`} x1="38" x2="650" y1={42 + i * 34} y2={42 + i * 34} className="oracle-grid-line" />
        ))}
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`v-${i}`} y1="35" y2="300" x1={42 + i * 48} x2={42 + i * 48} className="oracle-grid-line" />
        ))}
        {candles.map((value, index) => {
          const x = 62 + index * 30;
          const high = 290 - value * 2.4;
          const low = high + 60 + (index % 3) * 7;
          const open = high + 12 + (index % 4) * 6;
          const close = low - 12 - (index % 5) * 4;
          const rising = index % 3 !== 1;
          return (
            <g key={index}>
              <line x1={x} x2={x} y1={high} y2={low} className={rising ? "oracle-candle-wick up" : "oracle-candle-wick down"} />
              <rect
                x={x - 5}
                y={Math.min(open, close)}
                width="10"
                height={Math.max(8, Math.abs(close - open))}
                className={rising ? "oracle-candle up" : "oracle-candle down"}
              />
            </g>
          );
        })}
        <path d="M48 292 C180 248 278 160 388 128 C472 104 548 76 642 58" className="oracle-target-line gold" />
        <path d="M48 300 C186 270 284 214 392 184 C478 160 548 152 642 134" className="oracle-target-line white" />
        <path d="M48 305 C190 286 280 254 394 240 C498 226 570 228 642 218" className="oracle-target-line purple" />
        <text x="653" y="63" className="oracle-chart-flag">{market.outcomes[0]?.probability ?? market.probability}% chance</text>
        <text x="653" y="139" className="oracle-chart-flag muted">Middle path</text>
        <text x="653" y="223" className="oracle-chart-flag muted">Lower path</text>
      </svg>
    </div>
  );
}

export function OracleStatLedger() {
  const rows = [
    ["Oracle consensus", "94%"],
    ["Zama proof status", "Valid"],
    ["Encrypted settlement", "High"]
  ];
  return (
    <div className="oracle-ledger oracle-panel">
      <h3>Privacy Proofs</h3>
      {rows.map(([label, value]) => (
        <div key={label} className="oracle-ledger-row">
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

type OutcomeSummary = {
  tradingEnded?: boolean;
  outcomeVector?: number;
  atomCount?: number;
};

function hasCreatedLifecycle(market: Market | CreatedMarket): market is CreatedMarket {
  return "lifecycle" in market;
}

function hasResolvedOutcome(market: Market | CreatedMarket) {
  return hasCreatedLifecycle(market) && market.resolution?.outcomeVector !== undefined;
}

export function OracleSummaryModules({ market, tradingEnded = false, outcomeVector, atomCount = 0 }: { market: Market } & OutcomeSummary) {
  const outcomeReady = tradingEnded && outcomeVector !== undefined;
  const outcomeText = outcomeReady ? `Vector ${outcomeVector}` : tradingEnded ? "Pending" : `${market.probability}%`;
  const outcomeDetail = outcomeReady ? formatOutcomeVectorBinary(outcomeVector, atomCount) : undefined;
  return (
    <div className="oracle-summary-stack">
      <section className="oracle-panel oracle-state-panel">
        <div>
          <p className="oracle-kicker">{tradingEnded ? "Market outcome" : "Current probability"}</p>
          <strong className={outcomeReady ? "oracle-outcome-value" : tradingEnded ? "oracle-outcome-value pending" : undefined}>
            {outcomeText}
          </strong>
          {outcomeDetail && <span className="oracle-outcome-binary">{outcomeDetail}</span>}
        </div>
        {outcomeReady ? (
          <CheckCircle2 className="oracle-sigil oracle-sigil--success" />
        ) : tradingEnded ? (
          <XCircle className="oracle-sigil oracle-sigil--pending" />
        ) : (
          <Sparkles className="oracle-sigil" />
        )}
      </section>
      <section className="oracle-panel oracle-meta-panel">
        <h3>Market Stats</h3>
        <div><span>Volume</span><strong>{market.volume}</strong></div>
        <div><span>End date</span><strong>{market.endDate}</strong></div>
        <div><span>Resolver</span><strong>UMA</strong></div>
      </section>
    </div>
  );
}

export function MarketRows({
  markets,
  chain,
  emptyMessage = "No markets found.",
  emptyHint = "Try another title, category, atom, outcome, or network term."
}: {
  markets: Array<Market | CreatedMarket>;
  chain: ChainConfig;
  emptyMessage?: string;
  emptyHint?: string;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const rows = markets.slice(0, 9);
  const networkLabel = chain.shortName.toUpperCase();
  return (
    <div className="oracle-table">
      <div className="oracle-table-head">
        <span>Market</span>
        <span>Probability</span>
        <span>Volume</span>
        <span>Network</span>
        <span>Status</span>
        <span>Action</span>
      </div>
      {rows.length === 0 && (
        <div className="oracle-table-empty">
          <p>{emptyMessage}</p>
          <span>{emptyHint}</span>
        </div>
      )}
      {rows.map((market) => {
        const tradingOpen = !hasCreatedLifecycle(market) || isTradingOpen(market.lifecycle, now);
        const outcomeReady = hasResolvedOutcome(market);
        return (
          <div key={market.id} className={tradingOpen ? "oracle-table-row" : "oracle-table-row is-ended"}>
            <div className="oracle-market-name">
              <BarChart3 className="h-4 w-4 text-[#e2b66a]" />
              <MarketVisualBadge market={market} size="sm" />
              <span>{market.title}</span>
            </div>
            <span className={tradingOpen ? undefined : outcomeReady ? "oracle-market-outcome is-confirmed" : "oracle-market-outcome is-pending"}>
              {tradingOpen ? (
                `${market.probability}%`
              ) : outcomeReady ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Outcome
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  Pending
                </>
              )}
            </span>
            <span>{market.volume.replace("$", "")}</span>
            <span className={`oracle-mini-network oracle-mini-network--${chain.id}`}>{networkLabel}</span>
            <span className={tradingOpen ? "oracle-status" : "oracle-status ended"}>{tradingOpen ? "Active" : "Ended"}</span>
            {tradingOpen ? (
              <Link href={`/market/${market.id}`} className="oracle-row-action">
                Open <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <button type="button" disabled className="oracle-row-action is-disabled">
                Open <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function LandingCards({ markets }: { markets: Market[] }) {
  const featured = markets[0];
  return (
    <div className="oracle-landing-cards">
      <article className="oracle-card">
        <p className="oracle-kicker">Featured Market</p>
        <h3>{featured?.title || "No markets available"}</h3>
        <div className="oracle-card-split">
          <div>
            <span>{featured?.volume || "$0 Vol."}</span>
            <strong>{featured?.probability || 0}% chance</strong>
          </div>
          <MiniSparkline />
        </div>
        <Link href={featured ? `/market/${featured.id}` : "/markets"} className="oracle-card-action">View market</Link>
      </article>
      <article className="oracle-card">
        <p className="oracle-kicker">Hot Topics</p>
        {markets.slice(0, 4).map((market) => (
          <div key={market.id} className="oracle-activity-row">
            <Activity className="h-3.5 w-3.5" />
            <span>{market.category}</span>
            <strong>{market.change > 0 ? "+" : ""}{market.change}%</strong>
          </div>
        ))}
        <MiniBars />
      </article>
      <article className="oracle-card">
        <p className="oracle-kicker">Automation</p>
        {["Outcome schedule tracked", "UMA bot queued", "Encrypted payouts monitored"].map((item) => (
          <div key={item} className="oracle-note-row">
            <LockKeyhole className="h-3.5 w-3.5" />
            <span>{item}</span>
          </div>
        ))}
        <div className="oracle-note-row">
          <Network className="h-3.5 w-3.5" />
          <span>Zama and Arc</span>
        </div>
      </article>
    </div>
  );
}

export function ProbabilityInputCard({ market }: { market: Market }) {
  return (
    <section className="oracle-panel oracle-input-panel">
      <h3>Build combination bet</h3>
      <label>
        <span>Target outcome</span>
        <input value={market.outcomes[0]?.label || "Yes"} readOnly />
      </label>
      <label>
        <span>Probability</span>
        <select defaultValue={market.probability}>
          <option>{market.probability}%</option>
          <option>{Math.max(1, market.probability - 8)}%</option>
          <option>{Math.min(99, market.probability + 8)}%</option>
        </select>
      </label>
      <label>
        <span>Stake</span>
        <input defaultValue="0.1" />
      </label>
      <Link href={`/market/${market.id}?side=yes`} className="oracle-submit-button">
        Submit prediction
        <CircleDollarSign className="h-4 w-4" />
      </Link>
    </section>
  );
}
