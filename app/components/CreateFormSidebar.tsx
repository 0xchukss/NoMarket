import type { ChainConfig } from "../lib/chains";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

const panel: React.CSSProperties = {
  border: "1px solid var(--nm-border)",
  borderRadius: "6px",
  padding: "24px",
};

const kicker: React.CSSProperties = {
  ...telegraf,
  fontSize: "11px",
  color: "var(--nm-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  margin: "0 0 12px 0",
};

const big: React.CSSProperties = {
  ...telegraf,
  fontSize: "32px",
  color: "var(--nm-text-primary)",
  letterSpacing: "-0.4px",
  lineHeight: 1,
  display: "block",
  margin: "0 0 8px 0",
};

const sub: React.CSSProperties = {
  ...telegraf,
  fontSize: "13px",
  color: "var(--nm-text-body)",
  lineHeight: 1.6,
  margin: "0 0 8px 0",
};

type Props = {
  outcomeCount: number;
  atomCount: number;
  chain: ChainConfig;
  creationDepositWei: bigint;
  creationDepositDisplay: string;
};

export function CreateFormSidebar({
  outcomeCount,
  atomCount,
  chain,
  creationDepositWei,
  creationDepositDisplay,
}: Props) {
  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Outcome Space */}
      <div style={panel}>
        <p style={kicker}>Outcome Space</p>
        <span style={big}>{outcomeCount.toLocaleString()}</span>
        <p style={sub}>
          {atomCount} atom{atomCount === 1 ? "" : "s"} = 2^{atomCount} possible outcomes.
        </p>
        <p style={{ ...sub, margin: 0 }}>
          Bets on AND, OR, NOT, and IF/THEN become possible after this market
          is confirmed on-chain.
        </p>
      </div>

      {/* Chain Boundary */}
      <div style={panel}>
        <p style={kicker}>{chain.shortName} Boundary</p>
        <p style={sub}>
          {chain.enabled
            ? "This chain has a configured beta endpoint."
            : chain.setupMessage}
        </p>
        <p style={sub}>{chain.privacyDescription}</p>
        <p style={{ ...sub, margin: 0 }}>
          UMA-style assertions resolve the final combinatorial outcome vector.
        </p>
      </div>

      {/* Creation Fee */}
      <div style={panel}>
        <p style={kicker}>Creation Fee</p>
        <span style={big}>
          {creationDepositWei > 0n ? creationDepositDisplay : "None"}
        </span>
        <p style={sub}>{chain.shortName} market creation deposit</p>
        <p style={{ ...sub, margin: 0 }}>
          Required when the market is confirmed on-chain.
        </p>
      </div>

    </aside>
  );
}
