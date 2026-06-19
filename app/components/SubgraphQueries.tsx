import { useState } from "react";
import { Copy, Check } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Query = {
  title: string;
  description: string;
  code: string;
};

const QUERIES: Query[] = [
  {
    title: "List open markets",
    description: "Fetch the 20 most recent markets with OPEN status, ordered by creation time.",
    code: `{
  markets(
    where: { status: "OPEN" }
    orderBy: createdAt
    orderDirection: desc
    first: 20
  ) {
    id
    title
    atoms
    creator
    stake
    betCount
    createdAt
  }
}`,
  },
  {
    title: "Single market with bets",
    description: "Fetch a market by its on-chain ID and include the 50 most recent bets.",
    code: `{
  market(id: "42") {
    id
    title
    atoms
    status
    stake
    bets(
      first: 50
      orderBy: placedAt
      orderDirection: desc
    ) {
      id
      wallet
      stake
      encrypted
      placedAt
      claimed
    }
  }
}`,
  },
  {
    title: "Bets by wallet",
    description: "All bets placed by a specific wallet address, newest first.",
    code: `{
  bets(
    where: { wallet: "0xYOUR_ADDRESS" }
    orderBy: placedAt
    orderDirection: desc
  ) {
    id
    stake
    encrypted
    claimed
    claimedAt
    market {
      id
      title
      status
    }
  }
}`,
  },
  {
    title: "Settled resolutions",
    description: "All resolutions that have passed the UMA liveness window, with their parent markets.",
    code: `{
  resolutions(
    where: { settled: true }
    orderBy: settledAt
    orderDirection: desc
  ) {
    id
    outcomeVector
    claim
    proposer
    settledAt
    market {
      id
      title
      atoms
    }
  }
}`,
  },
];

function QueryCard({ title, description, code }: Query) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div
      style={{
        border: "1px solid var(--nm-border)",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      {/* card header */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--nm-divider)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <span style={{ ...telegraf, fontSize: "14px", color: "var(--nm-text-primary)", display: "block" }}>
            {title}
          </span>
          <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-muted)", marginTop: "2px", display: "block" }}>
            {description}
          </span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            background: "none",
            border: "1px solid var(--nm-border)",
            borderRadius: "4px",
            cursor: "pointer",
            padding: "5px 10px",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            color: copied ? "#22c55e" : "var(--nm-text-secondary)",
            transition: "color 160ms ease, border-color 160ms ease",
            flexShrink: 0,
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span style={{ ...telegraf, fontSize: "12px" }}>
            {copied ? "Copied" : "Copy"}
          </span>
        </button>
      </div>

      {/* code block */}
      <pre
        style={{
          ...telegraf,
          fontSize: "13px",
          color: "var(--nm-text-primary)",
          backgroundColor: "var(--nm-bg-tint)",
          margin: 0,
          padding: "20px 24px",
          overflowX: "auto",
          lineHeight: 1.7,
          whiteSpace: "pre" as const,
        }}
      >
        {code}
      </pre>
    </div>
  );
}

export function SubgraphQueries() {
  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        padding: "72px 0",
        borderBottom: "1px solid var(--nm-divider)",
      }}
    >
      <div
        style={{
          maxWidth: "1350px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <p
          style={{
            ...telegraf,
            fontSize: "11px",
            color: "var(--nm-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: "0 0 8px 0",
          }}
        >
          Queries
        </p>

        <h2
          style={{
            ...telegraf,
            fontSize: "28px",
            color: "var(--nm-text-primary)",
            letterSpacing: "-0.4px",
            margin: "0 0 8px 0",
            lineHeight: 1.2,
          }}
        >
          Example queries
        </h2>

        <p
          style={{
            ...telegraf,
            fontSize: "15px",
            color: "var(--nm-text-body)",
            lineHeight: 1.6,
            margin: "0 0 40px 0",
            maxWidth: "520px",
          }}
        >
          Paste these into the GraphQL playground once the subgraph is
          deployed. Replace placeholder values like{" "}
          <code
            style={{
              ...telegraf,
              fontSize: "13px",
              backgroundColor: "var(--nm-bg-cream)",
              padding: "1px 5px",
              borderRadius: "3px",
            }}
          >
            0xYOUR_ADDRESS
          </code>{" "}
          with real values.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {QUERIES.map((q) => (
            <QueryCard key={q.title} {...q} />
          ))}
        </div>
      </div>
    </section>
  );
}
