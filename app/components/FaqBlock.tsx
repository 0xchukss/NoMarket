import Link from "next/link";
import { ArrowRight } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

const FAQS = [
  {
    q: "Can I see other people's bets?",
    a: "No. On the Zama chain, bets are encrypted. You can see that a bet was placed and the stake amount, but not the expression behind it.",
  },
  {
    q: "What happens if nobody resolves a market?",
    a: "Markets stay open until someone proposes an outcome. There is no timeout or auto-resolve. Anyone can propose at any time after the event.",
  },
  {
    q: "Can I cancel a bet?",
    a: "No. Bets are final once the transaction confirms. LMSR pricing reflects this.",
  },
  {
    q: "What is the protocol fee?",
    a: "2% on both Sepolia and Arc. Deducted from your stake before pricing is calculated.",
  },
  {
    q: "What token do I use?",
    a: "ETH on Sepolia. ARC tokens on Arc testnet. Both are testnet tokens with no real value.",
  },
];

export function FaqBlock() {
  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        padding: "80px 0",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <h2
          style={{
            ...telegraf,
            fontSize: "28px",
            color: "var(--nm-text-primary)",
            letterSpacing: "-0.4px",
            margin: "0 0 48px 0",
          }}
        >
          Common questions
        </h2>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {FAQS.map((faq, i) => {
            const isLast = i === FAQS.length - 1;
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "48px",
                  padding: "28px 0",
                  borderBottom: isLast ? "none" : "1px solid var(--nm-divider)",
                }}
              >
                <span
                  style={{
                    ...telegraf,
                    fontSize: "15px",
                    color: "var(--nm-text-primary)",
                    lineHeight: 1.5,
                  }}
                >
                  {faq.q}
                </span>
                <span
                  style={{
                    ...telegraf,
                    fontSize: "15px",
                    color: "var(--nm-text-body)",
                    lineHeight: 1.6,
                  }}
                >
                  {faq.a}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "48px" }}>
          <Link
            href="/docs"
            style={{
              ...telegraf,
              fontSize: "14px",
              color: "var(--nm-text-primary)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Full documentation
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
