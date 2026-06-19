import Link from "next/link";
import { CirclePlus, Binary, ShieldCheck, Scale } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Step = {
  Icon: LucideIcon;
  number: string;
  headline: string;
  body: React.ReactNode;
};

const STEPS: Step[] = [
  {
    Icon: CirclePlus,
    number: "01",
    headline: "A market gets created",
    body: (
      <>
        <p style={{ margin: "0 0 16px 0" }}>
          Anyone can create a market. You give it a title, then define atoms:
          the independent yes/no questions the market resolves around.
        </p>
        <div
          style={{
            backgroundColor: "var(--nm-bg-tint)",
            border: "1px solid var(--nm-border)",
            borderRadius: "6px",
            padding: "16px 20px",
            marginBottom: "16px",
            display: "flex",
            flexDirection: "column" as const,
            gap: "6px",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--nm-text-secondary)" }}>
            Market: "World Cup Final, July 2026"
          </span>
          <span style={{ fontSize: "12px", color: "var(--nm-text-body)" }}>
            Atom 1: Brazil wins
          </span>
          <span style={{ fontSize: "12px", color: "var(--nm-text-body)" }}>
            Atom 2: Match goes to extra time
          </span>
          <span style={{ fontSize: "12px", color: "var(--nm-text-body)" }}>
            Atom 3: Over 2.5 total goals
          </span>
        </div>
        <p style={{ margin: "0 0 24px 0" }}>
          A small creation deposit is required to prevent spam. It is returned
          when the market resolves.
        </p>
        <Link
          href="/create"
          style={{
            ...telegraf,
            fontSize: "14px",
            color: "var(--nm-text-primary)",
            backgroundColor: "#ffd208",
            borderRadius: "4px",
            padding: "8px 18px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Create a market
        </Link>
      </>
    ),
  },
  {
    Icon: Binary,
    number: "02",
    headline: "You build a bet expression",
    body: (
      <>
        <p style={{ margin: "0 0 16px 0" }}>
          You don't just pick yes or no. You build a logical expression across
          atoms using:
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column" as const,
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          {[
            { op: "AND", desc: "all of these must be true" },
            { op: "OR", desc: "at least one must be true" },
            { op: "IF-THEN", desc: "if atom A is true, then atom B is true" },
          ].map(({ op, desc }) => (
            <div key={op} style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <span
                style={{
                  ...telegraf,
                  fontSize: "12px",
                  color: "var(--nm-text-primary)",
                  backgroundColor: "var(--nm-bg-cream)",
                  borderRadius: "3px",
                  padding: "2px 7px",
                  flexShrink: 0,
                }}
              >
                {op}
              </span>
              <span style={{ fontSize: "13px", color: "var(--nm-text-body)" }}>{desc}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            backgroundColor: "var(--nm-bg-tint)",
            border: "1px solid var(--nm-border)",
            borderRadius: "6px",
            padding: "14px 20px",
            marginBottom: "16px",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--nm-text-secondary)" }}>
            Example expression:
          </span>
          <p
            style={{
              ...telegraf,
              fontSize: "14px",
              color: "var(--nm-text-primary)",
              margin: "6px 0 0 0",
            }}
          >
            "Brazil wins AND match goes to extra time"
          </p>
        </div>
        <p style={{ margin: 0 }}>
          Your expression compiles to a set of minterms, compact binary
          patterns that describe exactly which outcome vectors count as a win
          for you. The cost of your bet is set by a pricing curve (LMSR). More
          popular outcomes cost more.
        </p>
      </>
    ),
  },
  {
    Icon: ShieldCheck,
    number: "03",
    headline: "Your bet is encrypted before it leaves your browser",
    body: (
      <>
        <p style={{ margin: "0 0 16px 0" }}>
          On the Zama chain, your minterms are encrypted using Fully
          Homomorphic Encryption before the transaction is submitted. The
          contract stores a ciphertext. It never sees what you bet on.
        </p>
        <p style={{ margin: "0 0 16px 0" }}>
          Nobody can front-run you. Nobody can profile your positions. The
          ledger is public, your bets are not.
        </p>
        <p style={{ margin: 0, color: "var(--nm-text-secondary)" }}>
          On Arc testnet, bets are submitted in plaintext. Same markets,
          different privacy model.
        </p>
      </>
    ),
  },
  {
    Icon: Scale,
    number: "04",
    headline: "UMA resolves the outcome",
    body: (
      <>
        <p style={{ margin: "0 0 16px 0" }}>
          When the event happens, anyone can propose the outcome on-chain with
          a plain-English evidence claim. UMA's Optimistic Oracle opens a
          2-hour liveness window.
        </p>
        <p style={{ margin: "0 0 16px 0" }}>
          If nobody disputes the claim in time, it settles. The contract
          finalises atom outcomes and evaluates all encrypted bets
          homomorphically.
        </p>
        <p style={{ margin: 0 }}>
          Winners can claim their payout from{" "}
          <Link
            href="/history"
            style={{ color: "var(--nm-text-primary)", textDecoration: "underline" }}
          >
            /history
          </Link>
          . Losing bets reveal nothing about what was bet.
        </p>
      </>
    ),
  },
];

export function StepList() {
  return (
    <section style={{ width: "100%", backgroundColor: "var(--nm-bg)" }}>
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <p
          style={{
            ...telegraf,
            fontSize: "13px",
            color: "var(--nm-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: "64px 0 48px 0",
          }}
        >
          Four steps from zero to payout
        </p>

        {STEPS.map((step, i) => {
          const isLast = i === STEPS.length - 1;
          return (
            <div
              key={step.number}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "32px",
                paddingBottom: isLast ? "80px" : "56px",
                marginBottom: isLast ? 0 : "56px",
                borderBottom: isLast ? "none" : "1px solid var(--nm-divider)",
              }}
            >
              {/* left: number + icon */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  paddingTop: "4px",
                  gap: "8px",
                }}
              >
                <step.Icon
                  size={22}
                  style={{ color: "#ffd208", flexShrink: 0 }}
                />
                <span
                  style={{
                    ...telegraf,
                    fontSize: "32px",
                    color: "#ffd208",
                    lineHeight: 1,
                  }}
                >
                  {step.number}
                </span>
              </div>

              {/* right: content */}
              <div>
                <h2
                  style={{
                    ...telegraf,
                    fontSize: "22px",
                    color: "var(--nm-text-primary)",
                    letterSpacing: "-0.3px",
                    margin: "0 0 16px 0",
                    lineHeight: 1.3,
                  }}
                >
                  {step.headline}
                </h2>
                <div
                  style={{
                    ...telegraf,
                    fontSize: "15px",
                    color: "var(--nm-text-body)",
                    lineHeight: 1.7,
                  }}
                >
                  {step.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
