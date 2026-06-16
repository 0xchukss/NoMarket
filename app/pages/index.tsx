import Link from "next/link";
import { ExternalLink, Lock, ShieldCheck, Zap, CheckCircle2 } from "lucide-react";
import { Header } from "../components/Header";
import { OracleFormulaVeil } from "../components/OracleVisuals";
import { SEED_MARKETS } from "../lib/seedMarkets";

const CONTRACT_ADDRESS = "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD";

const CIPHERTEXT_PREVIEW =
  "0x8f3a91c04e2d7b6f1a0c3e9d5f82b4a1" +
  "7c6e0d4f3a8b2c1e9d7f5a0b3c...7d2b";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Zap,
    title: "Compose combinatorial conditions",
    desc: "Build Boolean logic across any on-chain or off-chain event. Stack as many conditions as you need.",
  },
  {
    step: "02",
    icon: Lock,
    title: "Seal with FHE",
    desc: "Your position is encrypted with Zama FHEVM before it hits the chain. The stake is public. The direction is not.",
  },
  {
    step: "03",
    icon: CheckCircle2,
    title: "Settle with UMA",
    desc: "UMA's optimistic oracle reads the on-chain truth at expiry and settles outcomes without a trusted third party.",
  },
];

export default function Home() {
  return (
    <div className="oracle-page">
      <Header />
      <OracleFormulaVeil />

      <main className="oracle-home">
        {/* HERO */}
        <section className="oracle-hero">
          <div className="oracle-hero-copy">
            <p className="oracle-kicker">Private combinatorial prediction markets</p>
            <h1>Bet in the dark.</h1>
            <p>Everyone sees the stake. No one sees the bet.</p>
            <div className="oracle-hero-actions">
              <Link
                href="/create"
                className="bg-accent rounded-lg font-bold px-6 py-3 text-sm inline-flex items-center gap-2 transition-transform hover:-translate-y-px"
                style={{ color: "#0A0B0D", fontFamily: "var(--oracle-serif)" }}
              >
                Seal your first bet
              </Link>
              <Link href="/markets" className="oracle-quiet-button">
                Browse markets
              </Link>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-20 mb-16">
          <p className="oracle-kicker text-center mb-8">How it works</p>
          <div className="oracle-landing-cards">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="oracle-card">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-accent-2"
                    style={{
                      fontFamily: "var(--oracle-mono)",
                      fontSize: "0.68rem",
                      opacity: 0.7,
                    }}
                  >
                    {step}
                  </span>
                  <Icon className="w-5 h-5 text-accent-2" />
                </div>
                <h3>{title}</h3>
                <p
                  className="text-muted"
                  style={{
                    margin: 0,
                    fontFamily: "var(--oracle-mono)",
                    fontSize: "0.82rem",
                    lineHeight: 1.7,
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT THE CHAIN SEES */}
        <section className="mb-20">
          <p className="oracle-kicker text-center mb-8">What the chain sees</p>
          <div
            className="oracle-panel"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              overflow: "hidden",
            }}
          >
            {/* Left: on-chain encrypted view */}
            <div
              className="border-border"
              style={{
                padding: "28px 24px",
                borderRight: "1px solid rgba(231, 233, 236, 0.12)",
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <Lock className="w-4 h-4 text-accent-2" />
                <span
                  className="text-accent-2"
                  style={{
                    fontFamily: "var(--oracle-mono)",
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  On-chain (encrypted)
                </span>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <span
                    className="text-muted"
                    style={{
                      display: "block",
                      fontFamily: "var(--oracle-mono)",
                      fontSize: "0.64rem",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Stake
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--oracle-mono)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#f4d58d",
                    }}
                  >
                    2.0 ETH
                  </span>
                </div>

                <div>
                  <span
                    className="text-muted"
                    style={{
                      display: "block",
                      fontFamily: "var(--oracle-mono)",
                      fontSize: "0.64rem",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Encrypted position
                  </span>
                  <span
                    className="text-accent-2"
                    style={{
                      display: "block",
                      fontFamily: "var(--oracle-mono)",
                      fontSize: "0.72rem",
                      wordBreak: "break-all",
                      lineHeight: 1.65,
                      opacity: 0.78,
                    }}
                  >
                    {CIPHERTEXT_PREVIEW}
                  </span>
                </div>

                <div
                  style={{
                    padding: "7px 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(124, 92, 255, 0.22)",
                    background: "rgba(124, 92, 255, 0.08)",
                    fontFamily: "var(--oracle-mono)",
                    fontSize: "0.68rem",
                    color: "rgba(124, 92, 255, 0.8)",
                  }}
                >
                  Zama FHEVM ciphertext
                </div>
              </div>
            </div>

            {/* Right: plaintext private view */}
            <div style={{ padding: "28px 24px" }}>
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck className="w-4 h-4" style={{ color: "rgba(198, 242, 78, 0.78)" }} />
                <span
                  style={{
                    fontFamily: "var(--oracle-mono)",
                    fontSize: "0.68rem",
                    color: "rgba(198, 242, 78, 0.78)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Your view (private)
                </span>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <span
                    className="text-muted"
                    style={{
                      display: "block",
                      fontFamily: "var(--oracle-mono)",
                      fontSize: "0.64rem",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Condition
                  </span>
                  <span
                    className="text-foreground"
                    style={{
                      fontFamily: "var(--oracle-serif)",
                      fontSize: "0.96rem",
                      lineHeight: 1.5,
                    }}
                  >
                    Fed cuts rates AND BTC &gt; $100k by Q4 2026
                  </span>
                </div>

                <div className="flex gap-8">
                  <div>
                    <span
                      className="text-muted"
                      style={{
                        display: "block",
                        fontFamily: "var(--oracle-mono)",
                        fontSize: "0.64rem",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Position
                    </span>
                    <span
                      className="text-positive"
                      style={{
                        fontFamily: "var(--oracle-mono)",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                      }}
                    >
                      YES
                    </span>
                  </div>
                  <div>
                    <span
                      className="text-muted"
                      style={{
                        display: "block",
                        fontFamily: "var(--oracle-mono)",
                        fontSize: "0.64rem",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Odds
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--oracle-mono)",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: "#f4d58d",
                      }}
                    >
                      34%
                    </span>
                  </div>
                  <div>
                    <span
                      className="text-muted"
                      style={{
                        display: "block",
                        fontFamily: "var(--oracle-mono)",
                        fontSize: "0.64rem",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Stake
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--oracle-mono)",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: "#f4d58d",
                      }}
                    >
                      2.0 ETH
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "7px 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(52, 211, 153, 0.22)",
                    background: "rgba(52, 211, 153, 0.07)",
                    fontFamily: "var(--oracle-mono)",
                    fontSize: "0.68rem",
                    color: "rgba(52, 211, 153, 0.8)",
                  }}
                >
                  Visible only to you via FHE decryption key
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ACTIVE MARKETS */}
        <section className="mb-20">
          <p className="oracle-kicker text-center mb-8">Active markets</p>
          <div className="oracle-landing-cards">
            {SEED_MARKETS.map((m) => (
              <div key={m.id} className="oracle-card">
                <p
                  className="text-foreground"
                  style={{
                    margin: "0 0 14px",
                    fontFamily: "var(--oracle-serif)",
                    fontSize: "0.96rem",
                    lineHeight: 1.5,
                  }}
                >
                  {m.condition}
                </p>

                <div className="flex gap-5 mb-4">
                  <div>
                    <span
                      className="text-muted"
                      style={{
                        display: "block",
                        fontFamily: "var(--oracle-mono)",
                        fontSize: "0.62rem",
                        textTransform: "uppercase",
                      }}
                    >
                      Staked
                    </span>
                    <strong
                      style={{
                        fontFamily: "var(--oracle-mono)",
                        fontSize: "0.88rem",
                        color: "#f4d58d",
                      }}
                    >
                      {m.ethStaked} ETH
                    </strong>
                  </div>
                  <div>
                    <span
                      className="text-muted"
                      style={{
                        display: "block",
                        fontFamily: "var(--oracle-mono)",
                        fontSize: "0.62rem",
                        textTransform: "uppercase",
                      }}
                    >
                      Odds
                    </span>
                    <strong
                      className="text-accent"
                      style={{
                        fontFamily: "var(--oracle-mono)",
                        fontSize: "0.88rem",
                      }}
                    >
                      {m.odds}%
                    </strong>
                  </div>
                </div>

                <Link href="/create" className="oracle-card-action block text-center">
                  Seal a bet
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer
          className="border-t border-border"
          style={{
            paddingTop: 28,
            paddingBottom: 52,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ display: "grid", gap: 5 }}>
            <span
              className="text-muted"
              style={{
                fontFamily: "var(--oracle-mono)",
                fontSize: "0.64rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Contract
            </span>
            <span
              className="text-foreground"
              style={{ fontFamily: "var(--oracle-mono)", fontSize: "0.8rem" }}
            >
              {CONTRACT_ADDRESS}
            </span>
            <a
              href={`https://etherscan.io/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
              style={{
                fontFamily: "var(--oracle-mono)",
                fontSize: "0.7rem",
                color: "rgba(198, 242, 78, 0.72)",
                marginTop: 2,
              }}
            >
              Verified on Etherscan
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div style={{ display: "grid", gap: 5, textAlign: "right" }}>
            <span
              className="text-muted"
              style={{
                fontFamily: "var(--oracle-mono)",
                fontSize: "0.64rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Settlement oracle
            </span>
            <span
              className="text-foreground"
              style={{ fontFamily: "var(--oracle-mono)", fontSize: "0.8rem" }}
            >
              UMA Optimistic Oracle v3
            </span>
            <span
              className="text-muted"
              style={{ fontFamily: "var(--oracle-mono)", fontSize: "0.7rem" }}
            >
              Dispute window: 2 hours
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
