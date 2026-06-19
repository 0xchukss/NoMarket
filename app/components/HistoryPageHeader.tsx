import { RefreshCw } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Props = {
  chainShortName: string;
  onRefresh: () => void;
};

export function HistoryPageHeader({ chainShortName, onRefresh }: Props) {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        paddingTop: "80px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <div>
          <p
            style={{
              ...telegraf,
              fontSize: "12px",
              color: "var(--nm-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: "0 0 6px 0",
            }}
          >
            {chainShortName} network
          </p>
          <h1
            style={{
              ...telegraf,
              fontSize: "36px",
              color: "var(--nm-text-primary)",
              letterSpacing: "-0.6px",
              lineHeight: 1,
              margin: 0,
            }}
          >
            Bet History
          </h1>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          style={{
            ...telegraf,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            border: "1px solid var(--nm-border)",
            borderRadius: "6px",
            backgroundColor: "var(--nm-bg)",
            color: "var(--nm-text-secondary)",
            padding: "8px 14px",
            fontSize: "13px",
            cursor: "pointer",
          }}
          className="nm-footer-link"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>
    </div>
  );
}
