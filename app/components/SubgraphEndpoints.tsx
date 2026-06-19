import { ExternalLink, Copy } from "lucide-react";
import { useState } from "react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Endpoint = {
  chain: string;
  chainId: string;
  url: string | null;
  status: "live" | "pending";
};

const ENDPOINTS: Endpoint[] = [
  {
    chain: "Sepolia (Zama)",
    chainId: "11155111",
    url: null,
    status: "pending",
  },
  {
    chain: "Arc testnet",
    chainId: "5042002",
    url: null,
    status: "pending",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px",
        display: "flex",
        alignItems: "center",
        color: copied ? "#22c55e" : "var(--nm-text-muted)",
        transition: "color 160ms ease",
        flexShrink: 0,
      }}
      title="Copy"
    >
      <Copy size={13} />
    </button>
  );
}

function EndpointCard({ chain, chainId, url, status }: Endpoint) {
  const isLive = status === "live";
  const displayUrl = url ?? "not deployed yet";

  return (
    <div
      style={{
        flex: 1,
        border: "1px solid var(--nm-border)",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      {/* card header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--nm-divider)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: isLive ? "#22c55e" : "#d1d5db",
              flexShrink: 0,
            }}
          />
          <span style={{ ...telegraf, fontSize: "14px", color: "var(--nm-text-primary)" }}>
            {chain}
          </span>
        </div>
        <span style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-muted)" }}>
          Chain {chainId}
        </span>
      </div>

      {/* endpoint row */}
      <div style={{ padding: "16px 20px", backgroundColor: "var(--nm-bg-tint)" }}>
        <p style={{ ...telegraf, fontSize: "11px", color: "var(--nm-text-muted)", margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          GraphQL endpoint
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <code
            style={{
              ...telegraf,
              fontSize: "13px",
              color: isLive ? "var(--nm-text-primary)" : "var(--nm-text-muted)",
              flex: 1,
              wordBreak: "break-all" as const,
            }}
          >
            {displayUrl}
          </code>
          {isLive && url && <CopyButton text={url} />}
        </div>
      </div>

      {/* playground link */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--nm-divider)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-muted)" }}>
          {isLive ? "GraphQL playground" : "Available after deployment"}
        </span>
        {isLive ? (
          <a
            href={url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...telegraf,
              fontSize: "12px",
              color: "var(--nm-text-primary)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Open
            <ExternalLink size={11} />
          </a>
        ) : (
          <span style={{ ...telegraf, fontSize: "12px", color: "#d1d5db" }}>
            Open
          </span>
        )}
      </div>
    </div>
  );
}

export function SubgraphEndpoints() {
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
          Endpoints
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
          GraphQL endpoints
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
          Both subgraphs will be deployed once contracts are live. Until then,
          the app reads events directly from RPC logs starting from the deploy
          block.
        </p>

        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {ENDPOINTS.map((ep) => (
            <EndpointCard key={ep.chain} {...ep} />
          ))}
        </div>

        {/* fallback note */}
        <div
          style={{
            marginTop: "24px",
            padding: "14px 18px",
            border: "1px solid var(--nm-divider)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
          }}
        >
          <span
            style={{
              ...telegraf,
              fontSize: "11px",
              color: "var(--nm-text-primary)",
              backgroundColor: "#ffd208",
              borderRadius: "3px",
              padding: "2px 6px",
              flexShrink: 0,
              marginTop: "1px",
            }}
          >
            FALLBACK
          </span>
          <p style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-secondary)", margin: 0, lineHeight: 1.6 }}>
            When a subgraph URL is not configured, the app switches to RPC log
            mode automatically. It fetches raw logs from the deploy block using
            the public RPC for that chain. Slower than the subgraph but always
            accurate.
          </p>
        </div>
      </div>
    </section>
  );
}
