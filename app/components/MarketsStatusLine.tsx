import type { ChainConfig } from "../lib/chains";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Props = {
  indexStatus: "idle" | "loading" | "ready" | "error";
  indexError: string;
  hasSearch: boolean;
  resultCount: number;
  searchQuery: string;
  chain: ChainConfig;
};

export function MarketsStatusLine({
  indexStatus,
  indexError,
  hasSearch,
  resultCount,
  searchQuery,
  chain,
}: Props) {
  const text =
    indexStatus === "error"
      ? indexError
      : hasSearch
      ? `${resultCount} result${resultCount === 1 ? "" : "s"} for "${searchQuery.trim()}"`
      : chain.enabled
      ? `${chain.name} · beta`
      : chain.setupMessage ?? "";

  const isError = indexStatus === "error";

  return (
    <p
      style={{
        ...telegraf,
        fontSize: "12px",
        color: isError ? "#ef4444" : "var(--nm-text-muted)",
        textAlign: "right",
        margin: "12px 0 0 0",
      }}
    >
      {text}
    </p>
  );
}
