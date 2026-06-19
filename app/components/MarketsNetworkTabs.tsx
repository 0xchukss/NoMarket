import { CHAIN_ORDER, CHAINS } from "../lib/chains";
import { useSelectedChain } from "../lib/chains/useSelectedChain";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

export function MarketsNetworkTabs() {
  const { chainId, setChainId } = useSelectedChain();

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          gap: "8px",
          marginTop: "24px",
          marginBottom: "20px",
        }}
      >
        {CHAIN_ORDER.map((id) => {
          const chain = CHAINS[id];
          const active = chainId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setChainId(id)}
              style={{
                ...telegraf,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "7px 16px",
                borderRadius: "4px",
                border: active ? "1px solid var(--nm-text-primary)" : "1px solid var(--nm-border)",
                backgroundColor: active ? "var(--nm-text-primary)" : "var(--nm-bg)",
                color: active ? "var(--nm-bg)" : "var(--nm-text-secondary)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                transition: "background-color 160ms ease, color 160ms ease, border-color 160ms ease",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: chain.color,
                  opacity: active ? 1 : 0.5,
                  flexShrink: 0,
                  transition: "opacity 160ms ease",
                }}
              />
              {chain.shortName.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
