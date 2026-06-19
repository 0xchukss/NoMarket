import Link from "next/link";
import { Plus } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Props = {
  chainShortName: string;
  totalLive: number;
  indexStatus: "idle" | "loading" | "ready" | "error";
};

export function MarketsPageHeader({ chainShortName, totalLive, indexStatus }: Props) {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        paddingTop: "96px",
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
        }}
      >
        {/* left: kicker + title */}
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
            Markets
          </h1>
        </div>

        {/* right: live badge + loading + create button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {totalLive > 0 && (
            <span
              style={{
                ...telegraf,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "#22c55e",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: "999px",
                padding: "4px 10px",
                backgroundColor: "rgba(34,197,94,0.05)",
              }}
            >
              <span
                className="nm-dot-pulse"
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              {totalLive} live
            </span>
          )}

          {indexStatus === "loading" && (
            <span
              style={{
                ...telegraf,
                fontSize: "12px",
                color: "var(--nm-text-muted)",
              }}
            >
              Loading chain data...
            </span>
          )}

          <Link
            href="/create"
            style={{
              ...telegraf,
              fontSize: "13px",
              color: "var(--nm-text-primary)",
              backgroundColor: "#ffd208",
              borderRadius: "4px",
              padding: "8px 16px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={13} />
            Create Market
          </Link>
        </div>
      </div>
    </div>
  );
}
