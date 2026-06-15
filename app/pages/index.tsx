import Link from "next/link";
import { ExternalLink, Lock, ShieldCheck, Zap, CheckCircle2 } from "lucide-react";
import { Header } from "../components/Header";
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
    <div className="min-h-screen bg-base text-foreground">
      <Header />

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-12">
        {/* HERO */}
        <section className="text-center py-20">
          <p className="text-muted text-xs tracking-widest uppercase mb-4 font-mono">
            Private combinatorial prediction markets
          </p>
          <h1 className="text-5xl md:text-7xl font-bold font-display mb-6">
            Bet in the dark.
          </h1>
          <p className="text-lg text-muted mb-10 max-w-xl mx-auto">
            Everyone sees the stake. No one sees the bet.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/create"
              className="bg-accent text-base font-bold px-6 py-3 rounded-lg text-sm inline-flex items-center gap-2 transition-transform hover:-translate-y-px"
            >
              Seal your first bet
            </Link>
            <Link
              href="/markets"
              className="border border-border text-muted hover:text-foreground px-6 py-3 rounded-lg text-sm transition-colors"
            >
              Browse markets
            </Link>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-16 mb-20">
          <p className="text-muted text-xs tracking-widest uppercase text-center mb-10 font-mono">
            How it works
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }) => (
              <div
                key={step}
                className="bg-surface border border-border rounded-2xl p-6 hover:shadow-glow transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-accent-2 font-mono text-xs opacity-70">
                    {step}
                  </span>
                  <Icon className="w-5 h-5 text-accent-2" />
                </div>
                <h3 className="text-foreground font-semibold mb-2">{title}</h3>
                <p className="text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT THE CHAIN SEES */}
        <section className="mb-20">
          <p className="text-muted text-xs tracking-widest uppercase text-center mb-10 font-mono">
            What the chain sees
          </p>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
            {/* Left: on-chain encrypted view */}
            <div className="p-7 border-b md:border-b-0 md:border-r border-border">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-4 h-4 text-accent-2" />
                <span className="text-accent-2 font-mono text-xs uppercase tracking-wider">
                  On-chain (encrypted)
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-muted font-mono text-xs uppercase block mb-1">
                    Stake
                  </span>
                  <span className="text-foreground font-mono text-2xl font-bold">
                    2.0 ETH
                  </span>
                </div>

                <div>
                  <span className="text-muted font-mono text-xs uppercase block mb-1">
                    Encrypted position
                  </span>
                  <span className="text-accent-2 font-mono text-sm break-all leading-relaxed opacity-80">
                    {CIPHERTEXT_PREVIEW}
                  </span>
                </div>

                <div className="px-3 py-2 rounded-md border border-accent-2/20 bg-accent-2/10 font-mono text-xs text-accent-2/80">
                  Zama FHEVM ciphertext
                </div>
              </div>
            </div>

            {/* Right: plaintext private view */}
            <div className="p-7">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span className="text-accent font-mono text-xs uppercase tracking-wider">
                  Your view (private)
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-muted font-mono text-xs uppercase block mb-1">
                    Condition
                  </span>
                  <span className="text-foreground text-base leading-relaxed">
                    Fed cuts rates AND BTC &gt; $100k by Q4 2026
                  </span>
                </div>

                <div className="flex gap-8">
                  <div>
                    <span className="text-muted font-mono text-xs uppercase block mb-1">
                      Position
                    </span>
                    <span className="text-positive font-mono text-lg font-bold">
                      YES
                    </span>
                  </div>
                  <div>
                    <span className="text-muted font-mono text-xs uppercase block mb-1">
                      Odds
                    </span>
                    <span className="text-accent font-mono text-lg font-bold">
                      34%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted font-mono text-xs uppercase block mb-1">
                      Stake
                    </span>
                    <span className="text-accent font-mono text-lg font-bold">
                      2.0 ETH
                    </span>
                  </div>
                </div>

                <div className="px-3 py-2 rounded-md border border-positive/20 bg-positive/10 font-mono text-xs text-positive/80">
                  Visible only to you via FHE decryption key
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ACTIVE MARKETS */}
        <section className="mb-20">
          <p className="text-muted text-xs tracking-widest uppercase text-center mb-10 font-mono">
            Active markets
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SEED_MARKETS.map((m) => (
              <div
                key={m.id}
                className="bg-surface border border-border rounded-2xl p-6 hover:shadow-glow transition-shadow"
              >
                <p className="text-foreground text-base leading-relaxed mb-4">
                  {m.condition}
                </p>

                <div className="flex gap-5 mb-5">
                  <div>
                    <span className="text-muted font-mono text-xs uppercase block">
                      Staked
                    </span>
                    <strong className="text-accent font-mono text-sm">
                      {m.ethStaked} ETH
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted font-mono text-xs uppercase block">
                      Odds
                    </span>
                    <strong className="text-accent font-mono text-sm">
                      {m.odds}%
                    </strong>
                  </div>
                </div>

                <Link
                  href="/create"
                  className="block text-center bg-accent text-base font-bold px-4 py-2.5 rounded-lg text-sm transition-transform hover:-translate-y-px"
                >
                  Seal a bet
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-border pt-7 pb-14 flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-1">
            <span className="text-muted font-mono text-xs uppercase tracking-wider">
              Contract
            </span>
            <span className="text-foreground font-mono text-sm">
              {CONTRACT_ADDRESS}
            </span>
            <a
              href={`https://etherscan.io/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent/70 font-mono text-xs mt-1 hover:text-accent transition-colors"
            >
              Verified on Etherscan
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-1 text-right">
            <span className="text-muted font-mono text-xs uppercase tracking-wider">
              Settlement oracle
            </span>
            <span className="text-foreground font-mono text-sm">
              UMA Optimistic Oracle v3
            </span>
            <span className="text-muted font-mono text-xs">
              Dispute window: 2 hours
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
