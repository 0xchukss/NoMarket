import { EyeOff, GitBranch, Gavel, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useReveal } from "../lib/useReveal";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Feature = {
  Icon: LucideIcon;
  headline: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    Icon: EyeOff,
    headline: "Encrypted bets",
    body: "Your bet expression is FHE-encrypted before it leaves your browser. The contract sees a ciphertext, not your prediction.",
  },
  {
    Icon: GitBranch,
    headline: "Combinatorial logic",
    body: "Don't just bet yes or no. Build AND, OR, and IF-THEN expressions across multiple atoms. Precision pays.",
  },
  {
    Icon: Gavel,
    headline: "UMA-resolved outcomes",
    body: "Outcomes are proposed on-chain with evidence and settled through UMA's Optimistic Oracle V3. No admin override, no backdoor.",
  },
  {
    Icon: Layers,
    headline: "Two chains, one UI",
    body: "Bet on Zama with full FHE privacy, or Arc with Circle's developer wallets. Same markets, different privacy models.",
  },
];

function FeatureCard({ Icon, headline, body }: Feature) {
  return (
    <div
      className="nm-reveal nm-card"
      style={{
        backgroundColor: "var(--nm-bg)",
        border: "1px solid var(--nm-border)",
        borderRadius: "8px",
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Icon size={24} style={{ color: "#ffd208", flexShrink: 0, marginBottom: "12px" }} />

      <span
        style={{
          ...telegraf,
          fontSize: "18px",
          color: "var(--nm-text-primary)",
          marginBottom: "8px",
          lineHeight: 1.3,
        }}
      >
        {headline}
      </span>

      <span
        style={{
          ...telegraf,
          fontSize: "14px",
          color: "var(--nm-text-body)",
          lineHeight: 1.6,
        }}
      >
        {body}
      </span>
    </div>
  );
}

export function FeaturesSection() {
  const ref = useReveal(".nm-card");
  return (
    <section ref={ref as React.RefObject<HTMLDivElement>} className="nm-section-reveal" style={{ width: "100%", backgroundColor: "var(--nm-bg)", padding: "80px 0" }}>
      <div
        style={{
          maxWidth: "1350px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <h2
          style={{
            ...telegraf,
            fontSize: "36px",
            color: "var(--nm-text-primary)",
            letterSpacing: "-0.6px",
            textAlign: "center",
            margin: "0 0 48px 0",
          }}
        >
          What makes NoMarket different
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "24px",
          }}
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.headline} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
