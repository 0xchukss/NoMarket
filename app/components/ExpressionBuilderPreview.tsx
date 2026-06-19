import Link from "next/link";
import { LockKeyhole, ArrowRight } from "lucide-react";
import { useReveal } from "../lib/useReveal";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

const selectStyle: React.CSSProperties = {
  ...telegraf,
  fontSize: "13px",
  color: "var(--nm-text-primary)",
  backgroundColor: "var(--nm-bg-control)",
  border: "1px solid var(--nm-border)",
  borderRadius: "4px",
  padding: "6px 12px",
  minWidth: "90px",
  appearance: "auto" as any,
  cursor: "pointer",
  outline: "none",
};

type AtomRow = {
  number: string;
  question: string;
  defaultValue: string;
  options: string[];
};

const ATOMS: AtomRow[] = [
  { number: "Atom 1", question: "Will ETH break $5k?",    defaultValue: "true",  options: ["true", "false", "any"] },
  { number: "Atom 2", question: "Will BTC break $100k?",  defaultValue: "any",   options: ["true", "false", "any"] },
  { number: "Atom 3", question: "Will SOL break $300?",   defaultValue: "false", options: ["true", "false", "any"] },
];

export function ExpressionBuilderPreview() {
  const ref = useReveal();
  return (
    <section ref={ref as React.RefObject<HTMLDivElement>} className="nm-reveal nm-section-reveal" style={{ width: "100%", backgroundColor: "var(--nm-bg-tint)", padding: "80px 0" }}>
      <div
        style={{
          maxWidth: "800px",
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
            margin: "0 0 40px 0",
          }}
        >
          Build your bet like a statement, not a coin flip
        </h2>

        <div
          style={{
            backgroundColor: "var(--nm-bg)",
            border: "1px solid var(--nm-border)",
            borderRadius: "8px",
            padding: "32px",
          }}
        >
          {ATOMS.map((atom) => (
            <div
              key={atom.number}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ ...telegraf, fontSize: "14px", color: "var(--nm-text-secondary)", flexShrink: 0 }}>
                  {atom.number}
                </span>
                <span style={{ ...telegraf, fontSize: "14px", color: "var(--nm-text-primary)" }}>
                  {atom.question}
                </span>
              </div>

              <select defaultValue={atom.defaultValue} style={selectStyle}>
                {atom.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "12px",
              marginBottom: "20px",
            }}
          >
            <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-secondary)" }}>Logic</span>
            <select defaultValue="AND" style={selectStyle}>
              <option value="AND">AND</option>
              <option value="OR">OR</option>
              <option value="IF-THEN">IF-THEN</option>
            </select>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--nm-divider)", margin: "20px 0" }} />

          <div>
            <p
              style={{
                ...telegraf,
                fontSize: "11px",
                color: "var(--nm-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 6px 0",
              }}
            >
              Expression:
            </p>

            <p style={{ ...telegraf, fontSize: "15px", color: "var(--nm-text-primary)", margin: "0 0 16px 0" }}>
              ETH breaks $5k AND SOL stays below $300
            </p>

            <div style={{ display: "flex", gap: "32px" }}>
              <span style={{ ...telegraf, fontSize: "14px", color: "var(--nm-text-primary)" }}>
                Probability: 18%
              </span>
              <span style={{ ...telegraf, fontSize: "14px", color: "var(--nm-text-body)" }}>
                Cost to bet 0.1 ETH: 0.034 ETH
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "20px",
            }}
          >
            <LockKeyhole size={12} style={{ color: "#ffd208", flexShrink: 0 }} />
            <span style={{ ...telegraf, fontSize: "12px", color: "var(--nm-text-muted)" }}>
              Your minterms are encrypted before submission. The contract sees a ciphertext, not this.
            </span>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <Link
            href="/create"
            style={{
              ...telegraf,
              fontSize: "15px",
              color: "var(--nm-text-on-primary)",
              backgroundColor: "var(--nm-text-primary)",
              borderRadius: "4px",
              padding: "10px 28px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Try it live
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
