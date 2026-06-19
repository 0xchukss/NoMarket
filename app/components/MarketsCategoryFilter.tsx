import { Search, X } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Props = {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
};

export function MarketsCategoryFilter({
  categories,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "16px",
      }}
    >
      {/* category pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", flex: 1, minWidth: 0 }}>
        {categories.map((cat) => {
          const active = cat === activeCategory;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              style={{
                ...telegraf,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "5px 10px",
                borderRadius: "4px",
                border: active ? "1px solid var(--nm-text-primary)" : "1px solid var(--nm-border)",
                backgroundColor: active ? "var(--nm-text-primary)" : "var(--nm-bg)",
                color: active ? "var(--nm-bg)" : "var(--nm-text-secondary)",
                cursor: "pointer",
                transition: "background-color 140ms ease, color 140ms ease, border-color 140ms ease",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          border: "1px solid var(--nm-border)",
          borderRadius: "6px",
          padding: "8px 12px",
          minWidth: "200px",
          backgroundColor: "var(--nm-bg)",
        }}
      >
        <Search size={13} style={{ color: "var(--nm-text-muted)", flexShrink: 0 }} />
        <input
          aria-label="Search markets"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search markets..."
          style={{
            ...telegraf,
            fontSize: "13px",
            color: "var(--nm-text-primary)",
            background: "none",
            border: "none",
            outline: "none",
            width: "100%",
          }}
        />
        {searchQuery.trim().length > 0 && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              color: "var(--nm-text-muted)",
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
