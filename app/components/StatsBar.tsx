import { BarChart3, ShieldCheck, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useReveal } from "../lib/useReveal";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Stat = {
  Icon: LucideIcon;
  label: string;
  value: string;
};

const STATS: Stat[] = [
  { Icon: BarChart3,   label: "Markets Created", value: "14" },
  { Icon: ShieldCheck, label: "Encrypted Bets",  value: "52" },
  { Icon: Globe,       label: "Chains Live",     value: "2" },
];

function StatItem({ Icon, label, value }: Stat) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Icon size={20} style={{ color: "#ffd208", flexShrink: 0 }} />

      <span
        style={{
          ...telegraf,
          fontSize: "12px",
          color: "var(--nm-text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginTop: "6px",
        }}
      >
        {label}
      </span>

      <span
        style={{
          ...telegraf,
          fontSize: "24px",
          color: "var(--nm-text-primary)",
          marginTop: "2px",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function StatsBar() {
  const ref = useReveal();
  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="nm-reveal nm-section-reveal"
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        padding: "24px 0",
        borderTop: "1px solid var(--nm-divider)",
        borderBottom: "1px solid var(--nm-divider)",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "64px",
        }}
      >
        {STATS.map((s) => (
          <StatItem key={s.label} {...s} />
        ))}
      </div>
    </section>
  );
}
