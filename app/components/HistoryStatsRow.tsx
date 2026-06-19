import { formatEther } from "viem";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Props = {
  visibleBetCount: number;
  totalStaked: bigint;
  nativeCurrency: string;
  marketCount: number;
};

export function HistoryStatsRow({ visibleBetCount, totalStaked, nativeCurrency, marketCount }: Props) {
  const stats = [
    { label: "Visible Bets", value: String(visibleBetCount) },
    { label: "Visible Stake", value: `${formatEther(totalStaked)} ${nativeCurrency}` },
    { label: "Markets Tracked", value: String(marketCount) },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "10px",
        marginBottom: "20px",
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            border: "1px solid var(--nm-border)",
            borderRadius: "6px",
            padding: "16px",
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
            {stat.label}
          </p>
          <p
            style={{
              ...telegraf,
              fontSize: "28px",
              color: "var(--nm-text-primary)",
              letterSpacing: "-0.4px",
              lineHeight: 1,
              margin: 0,
            }}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
