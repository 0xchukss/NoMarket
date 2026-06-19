import Link from "next/link";
import { LockKeyhole, ArrowRight } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

const selectStyle: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
  fontSize: "13px",
  color: "var(--nm-text-primary)",
  backgroundColor: "var(--nm-bg-control)",
  border: "1px solid var(--nm-border)",
  borderRadius: "4px",
  padding: "6px 12px",
  minWidth: "80px",
  appearance: "auto" as any,
  cursor: "pointer",
  outline: "none",
};

const ATOMS = [
  { label: "Atom 1", question: "Brazil wins", defaultValue: "true",  options: ["true", "false", "any"] },
  { label: "Atom 2", question: "Match goes to ET", defaultValue: "any",   options: ["true", "false", "any"] },
  { label: "Atom 3", question: "Over 2.5 goals",   defaultValue: "false", options: ["true", "false", "any"] },
];

export function ExpressionExplainer() {
  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg-tint)",
        padding: "80px 0",
        borderTop: "1px solid var(--nm-divider)",
        borderBottom: "1px solid var(--nm-divider)",
      }}
    >
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
            fontSize: "28px",
            color: "var(--nm-text-primary)",
            letterSpacing: "-0.4px",
            textAlign: "center",
            margin: "0 0 40px 0",
          }}
        >
          What a bet expression looks like
        </h2>

        <div
          style={{
            backgroundColor: "var(--nm-bg)",
            border: "1px solid var(--nm-border)",
            borderRadius: "8px",
            padding: "32px",
          }}
        >
          {/* atom rows */}
          {ATOMS.map((atom) => (
            <div
              key={atom.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-secondary)", flexShrink: 0, width: "48px" }}>
                  {atom.label}
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

          {/* logic combinator */}
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

          {/* result */}
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
              Brazil wins AND Under 2.5 goals
            </p>

            <div style={{ display: "flex", gap: "32px" }}>
              <span style={{ ...telegraf, fontSize: "14px", color: "var(--nm-text-primary)" }}>
                Probability: 14%
              </span>
              <span style={{ ...telegraf, fontSize: "14px", color: "var(--nm-text-body)" }}>
                Cost to bet 0.1 ETH: 0.028 ETH
              </span>
            </div>
          </div>

          {/* encryption notice */}
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
              Encrypted before submission on Zama chain
            </span>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <Link
            href="/markets"
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
            Try it on a live market
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
