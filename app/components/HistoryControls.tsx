import { Search, X } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Props = {
  mode: "personal" | "general";
  setMode: (mode: "personal" | "general") => void;
  search: string;
  setSearch: (q: string) => void;
};

export function HistoryControls({ mode, setMode, search, setSearch }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        margin: "20px 0",
      }}
    >
      {(["personal", "general"] as const).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              ...telegraf,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "6px 16px",
              borderRadius: "6px",
              border: active ? "1px solid var(--nm-text-primary)" : "1px solid var(--nm-border)",
              backgroundColor: active ? "var(--nm-text-primary)" : "var(--nm-bg)",
              color: active ? "var(--nm-bg)" : "var(--nm-text-secondary)",
              cursor: "pointer",
            }}
          >
            {m === "personal" ? "My Bets" : "All Activity"}
          </button>
        );
      })}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          border: "1px solid var(--nm-border)",
          borderRadius: "6px",
          padding: "6px 12px",
          flex: 1,
          minWidth: "180px",
          maxWidth: "340px",
        }}
      >
        <Search size={13} style={{ color: "var(--nm-text-muted)", flexShrink: 0 }} />
        <input
          aria-label="Search history"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search market, wallet, expression..."
          className="nm-input"
          style={{
            border: "none",
            borderRadius: 0,
            padding: 0,
            fontSize: "13px",
            width: "100%",
            backgroundColor: "transparent",
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--nm-text-muted)",
              display: "grid",
              placeItems: "center",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
