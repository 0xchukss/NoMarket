import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, CheckCircle, ArrowRight, Wallet } from "lucide-react";
import { loadCreatedMarkets, deleteCreatedMarket, type CreatedMarket } from "../lib/marketStorage";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncate(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function DraftRow({
  market,
  onDelete,
}: {
  market: CreatedMarket;
  onDelete: (id: string) => void;
}) {
  const deployed = market.onchain.materialized;
  const chainLabel = market.onchain.chainId === "arc" ? "Arc testnet" : "Sepolia";
  const dateLabel = deployed ? "Deployed" : "Saved";

  return (
    <div
      style={{
        backgroundColor: "var(--nm-bg)",
        border: "1px solid var(--nm-border)",
        borderRadius: "8px",
        padding: "20px 24px",
      }}
    >
      {/* title row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        {deployed ? (
          <CheckCircle size={14} style={{ color: "#30a159", flexShrink: 0, marginTop: "3px" }} />
        ) : (
          <FileText size={14} style={{ color: "var(--nm-text-secondary)", flexShrink: 0, marginTop: "3px" }} />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                ...telegraf,
                fontSize: "15px",
                color: "var(--nm-text-primary)",
                lineHeight: 1.3,
              }}
            >
              {market.title}
            </span>
            <span
              style={{
                ...telegraf,
                fontSize: "10px",
                color: deployed ? "#30a159" : "var(--nm-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                backgroundColor: deployed ? "rgba(48,161,89,0.12)" : "var(--nm-bg-tint)",
                borderRadius: "4px",
                padding: "2px 7px",
                flexShrink: 0,
              }}
            >
              {deployed ? "Deployed" : "Draft"}
            </span>
          </div>

          <span
            style={{
              ...telegraf,
              fontSize: "12px",
              color: "var(--nm-text-secondary)",
              marginTop: "3px",
              display: "block",
            }}
          >
            {market.category} · {market.atoms.length} atom
            {market.atoms.length !== 1 ? "s" : ""} · {dateLabel}{" "}
            {formatDate(market.createdAt)}
          </span>
        </div>
      </div>

      {/* atoms */}
      <div
        style={{
          paddingLeft: "24px",
          marginBottom: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {market.atoms.map((atom, i) => (
          <span
            key={i}
            style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-body)" }}
          >
            Atom {i + 1}: {atom.description}
          </span>
        ))}
      </div>

      {/* actions */}
      <div
        style={{
          paddingLeft: "24px",
          paddingTop: "14px",
          borderTop: "1px solid var(--nm-divider)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {deployed ? (
          <>
            <span style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-secondary)" }}>
              {chainLabel}: {truncate(market.onchain.contract)}
            </span>
            <span style={{ ...telegraf, fontSize: "12px", color: "var(--nm-border)" }}>·</span>
            <Link
              href={`/market/${market.id}`}
              style={{
                ...telegraf,
                fontSize: "13px",
                color: "var(--nm-text-primary)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              View market
              <ArrowRight size={12} />
            </Link>
          </>
        ) : (
          <>
            <button
              style={{
                ...telegraf,
                fontSize: "13px",
                color: "var(--nm-text-primary)",
                backgroundColor: "#ffd208",
                border: "none",
                borderRadius: "4px",
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              Deploy to Sepolia
            </button>
            <button
              style={{
                ...telegraf,
                fontSize: "13px",
                color: "var(--nm-text-primary)",
                backgroundColor: "transparent",
                border: "1px solid var(--nm-border)",
                borderRadius: "4px",
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              Deploy to Arc
            </button>
            <Link
              href={`/create?draft=${market.id}`}
              style={{
                ...telegraf,
                fontSize: "13px",
                color: "var(--nm-text-secondary)",
                textDecoration: "none",
                padding: "6px 8px",
              }}
            >
              Edit
            </Link>
            <button
              onClick={() => onDelete(market.id)}
              style={{
                ...telegraf,
                fontSize: "13px",
                color: "#e23939",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px 8px",
              }}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function DraftsConnectPrompt() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "80px 24px",
      }}
    >
      <Wallet size={32} style={{ color: "var(--nm-icon-muted)", marginBottom: "20px" }} />

      <h2
        style={{
          ...telegraf,
          fontSize: "20px",
          color: "var(--nm-text-primary)",
          margin: "0 0 10px 0",
        }}
      >
        Connect your wallet
      </h2>

      <p
        style={{
          ...telegraf,
          fontSize: "14px",
          color: "var(--nm-text-secondary)",
          lineHeight: 1.6,
          maxWidth: "340px",
          margin: 0,
        }}
      >
        Connect to access your saved drafts and deploy markets on-chain.
      </p>
    </div>
  );
}

function DraftsEmpty() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "80px 24px",
      }}
    >
      <FileText size={32} style={{ color: "var(--nm-icon-muted)", marginBottom: "20px" }} />

      <h2
        style={{
          ...telegraf,
          fontSize: "20px",
          color: "var(--nm-text-primary)",
          margin: "0 0 10px 0",
        }}
      >
        No drafts yet
      </h2>

      <p
        style={{
          ...telegraf,
          fontSize: "14px",
          color: "var(--nm-text-secondary)",
          lineHeight: 1.6,
          maxWidth: "340px",
          margin: "0 0 28px 0",
        }}
      >
        Markets you create are saved here before you deploy them on-chain.
        Start by creating a market.
      </p>

      <Link
        href="/create"
        style={{
          ...telegraf,
          fontSize: "14px",
          color: "var(--nm-text-primary)",
          backgroundColor: "#ffd208",
          borderRadius: "4px",
          padding: "8px 20px",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        Create a market
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export function DraftsList({ address }: { address?: string }) {
  const [markets, setMarkets] = useState<CreatedMarket[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!address) return;
    setMarkets(loadCreatedMarkets());
    setLoaded(true);
  }, [address]);

  const handleDelete = (id: string) => {
    deleteCreatedMarket(id);
    setMarkets((prev) => prev.filter((m) => m.id !== id));
  };

  if (!address) {
    return (
      <section style={{ width: "100%", backgroundColor: "var(--nm-bg)", padding: "40px 0 0" }}>
        <div style={{ maxWidth: "1350px", margin: "0 auto", padding: "0 24px" }}>
          <DraftsConnectPrompt />
        </div>
      </section>
    );
  }

  if (!loaded) return null;

  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        padding: "40px 0 0",
      }}
    >
      <div
        style={{
          maxWidth: "1350px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        {markets.length === 0 ? (
          <DraftsEmpty />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {markets.map((m) => (
              <DraftRow key={m.id} market={m} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
