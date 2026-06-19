import Link from "next/link";
import { ArrowRight } from "lucide-react";

const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

const h2Style: React.CSSProperties = {
  ...telegraf,
  fontSize: "22px",
  color: "var(--nm-text-primary)",
  letterSpacing: "-0.3px",
  margin: "0 0 16px 0",
  lineHeight: 1.3,
};

const bodyStyle: React.CSSProperties = {
  ...telegraf,
  fontSize: "15px",
  color: "var(--nm-text-body)",
  lineHeight: 1.7,
  margin: "0 0 14px 0",
};

const groupLabelStyle: React.CSSProperties = {
  ...telegraf,
  fontSize: "11px",
  color: "var(--nm-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  margin: "0 0 8px 0",
};

// ── sidebar ────────────────────────────────────────────

const NAV_GROUPS = [
  {
    heading: "Overview",
    links: [
      { label: "What is NoMarket?", href: "#what-is-nomarket" },
      { label: "Quick start", href: "#quick-start" },
    ],
  },
  {
    heading: "Core concepts",
    links: [
      { label: "Markets and atoms", href: "#markets-and-atoms" },
      { label: "Bet expressions", href: "#bet-expressions" },
      { label: "FHE encryption", href: "#fhe-encryption" },
      { label: "Pricing (LMSR)", href: "#pricing" },
    ],
  },
  {
    heading: "Resolution",
    links: [
      { label: "UMA oracle", href: "#uma-oracle" },
      { label: "Claiming payouts", href: "#claiming-payouts" },
    ],
  },
  {
    heading: "Network",
    links: [
      { label: "Sepolia (Zama)", href: "#sepolia-zama" },
      { label: "Arc testnet", href: "#arc-testnet" },
    ],
  },
  {
    heading: "Subgraph & API",
    links: [{ label: "Subgraph & API", href: "#subgraph" }],
  },
];

function DocsNav() {
  return (
    <aside
      style={{
        width: "240px",
        flexShrink: 0,
        position: "sticky",
        top: "88px",
        alignSelf: "flex-start",
      }}
    >
      <p style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-primary)", margin: "0 0 20px 0" }}>
        On this page
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.heading}>
            <p style={groupLabelStyle}>{group.heading}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {group.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    ...telegraf,
                    fontSize: "13px",
                    color: "var(--nm-text-secondary)",
                    textDecoration: "none",
                    display: "block",
                    transition: "color 160ms ease",
                  }}
                  className="nm-footer-link"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ── content helpers ────────────────────────────────────

function SectionAnchor({ id }: { id: string }) {
  return <div id={id} style={{ scrollMarginTop: "88px" }} />;
}

function GroupDivider({ label }: { label: string }) {
  return (
    <div
      style={{
        borderTop: "1px solid var(--nm-divider)",
        marginTop: "56px",
        paddingTop: "48px",
      }}
    >
      <p style={{ ...groupLabelStyle, marginBottom: "32px" }}>{label}</p>
    </div>
  );
}

function ContentSection({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "48px" }}>
      {children}
    </div>
  );
}

function Bullet({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "0 0 14px 0", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
      {items.map((item) => (
        <li key={item} style={{ ...telegraf, fontSize: "15px", color: "var(--nm-text-body)", lineHeight: 1.6 }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function NumList({ items }: { items: string[] }) {
  return (
    <ol style={{ margin: "0 0 14px 0", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((item, i) => (
        <li key={i} style={{ ...telegraf, fontSize: "15px", color: "var(--nm-text-body)", lineHeight: 1.6 }}>
          {item}
        </li>
      ))}
    </ol>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: "16px",
        padding: "10px 0",
        borderBottom: "1px solid var(--nm-divider)",
      }}
    >
      <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-secondary)" }}>{label}</span>
      <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-primary)" }}>{value}</span>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      style={{
        ...telegraf,
        fontSize: "13px",
        color: "var(--nm-text-primary)",
        backgroundColor: "var(--nm-bg-tint)",
        border: "1px solid var(--nm-border)",
        borderRadius: "6px",
        padding: "16px 20px",
        margin: "0 0 14px 0",
        overflowX: "auto",
        lineHeight: 1.7,
        whiteSpace: "pre-wrap" as const,
      }}
    >
      {children}
    </pre>
  );
}

// ── main content ───────────────────────────────────────

function DocsContent() {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>

      {/* ── OVERVIEW ── */}

      <ContentSection>
        <SectionAnchor id="what-is-nomarket" />
        <h2 style={h2Style}>What is NoMarket?</h2>
        <p style={bodyStyle}>
          NoMarket is a prediction market where your bets are encrypted
          on-chain using Fully Homomorphic Encryption (FHE). Nobody can see
          what you bet on, not other participants, not the contract, not us,
          until after resolution.
        </p>
        <p style={bodyStyle}>
          Markets resolve through UMA's Optimistic Oracle, a decentralised
          dispute system that settles outcome claims on-chain with a liveness
          window.
        </p>
        <p style={{ ...bodyStyle, marginBottom: "8px" }}>
          NoMarket runs on two testnets:
        </p>
        <Bullet items={[
          "Sepolia via the Zama FHE coprocessor",
          "Arc testnet via Circle developer wallets",
        ]} />
      </ContentSection>

      <ContentSection>
        <SectionAnchor id="quick-start" />
        <h2 style={h2Style}>Quick start</h2>
        <NumList items={[
          "Connect your wallet (MetaMask, WalletConnect)",
          "Switch to Sepolia testnet",
          "Browse open markets at /markets",
          "Pick a market and build a bet expression",
          "Submit. Your minterms are encrypted in-browser on Zama chain.",
          "After resolution, visit /history to claim your payout",
        ]} />
        <Link
          href="/markets"
          style={{
            ...telegraf,
            fontSize: "14px",
            color: "var(--nm-text-primary)",
            backgroundColor: "#ffd208",
            borderRadius: "4px",
            padding: "8px 18px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          Open app
          <ArrowRight size={13} />
        </Link>
      </ContentSection>

      {/* ── CORE CONCEPTS ── */}

      <GroupDivider label="Core concepts" />

      <ContentSection>
        <SectionAnchor id="markets-and-atoms" />
        <h2 style={h2Style}>Markets and atoms</h2>
        <p style={bodyStyle}>
          A market is a question that resolves to a set of binary outcomes.
          Each outcome is called an atom.
        </p>
        <CodeBlock>{`Market: "World Cup Final, July 2026"
Atom 1: Brazil wins
Atom 2: Match goes to extra time
Atom 3: Over 2.5 total goals`}</CodeBlock>
        <p style={bodyStyle}>
          Any combination of atoms can be true or false. The contract tracks
          each atom's resolution independently.
        </p>
        <p style={bodyStyle}>
          Markets can have a trading end time, an event occurrence time, or
          neither. Timed markets stop accepting bets when tradingEndTime is
          reached.
        </p>
      </ContentSection>

      <ContentSection>
        <SectionAnchor id="bet-expressions" />
        <h2 style={h2Style}>Bet expressions</h2>
        <p style={bodyStyle}>
          Instead of betting on a single outcome, you build a logical
          expression across atoms.
        </p>
        <p style={{ ...bodyStyle, marginBottom: "8px" }}>Supported combinators:</p>
        <Bullet items={[
          "AND: all selected atoms must be true",
          "OR: at least one must be true",
          "IF-THEN: atom A being true implies atom B",
        ]} />
        <CodeBlock>{`Example expression:
"Brazil wins AND match goes to extra time"`}</CodeBlock>
        <p style={bodyStyle}>
          Expressions compile to minterms, a compact binary representation
          that the contract stores encrypted. You win if the resolved outcome
          vector matches any of your minterms.
        </p>
      </ContentSection>

      <ContentSection>
        <SectionAnchor id="fhe-encryption" />
        <h2 style={h2Style}>FHE encryption</h2>
        <p style={bodyStyle}>
          Before your minterms reach the contract, they are encrypted
          in-browser using Zama's FHEVM SDK. The ciphertext is submitted
          on-chain. The contract never sees the plaintext of your bet.
        </p>
        <p style={bodyStyle}>
          When a market resolves, the contract evaluates all encrypted bets
          homomorphically, computing win/loss without decrypting individual
          bets.
        </p>
        <Bullet items={[
          "Chain: Sepolia (Zama FHE coprocessor)",
          "SDK: @zama-fhe/sdk",
          "Encryption happens: client-side, before tx",
        ]} />
        <p style={bodyStyle}>
          On Arc testnet, bets are submitted in plaintext using the standard
          placeBetMinterms() call.
        </p>
      </ContentSection>

      <ContentSection>
        <SectionAnchor id="pricing" />
        <h2 style={h2Style}>Pricing (LMSR)</h2>
        <p style={bodyStyle}>
          NoMarket uses a Logarithmic Market Scoring Rule to price bets
          continuously. The cost of a bet depends on the current probability
          implied by existing liquidity.
        </p>
        <CodeBlock>{`cost = b x (log(sum e^(si/b) after) - log(sum e^(si/b) before))

b = liquidity parameter set at market creation`}</CodeBlock>
        <p style={{ ...bodyStyle, marginBottom: "8px" }}>
          A protocol fee is added on top:
        </p>
        <Bullet items={[
          "Sepolia fee: 200 bps (2%)",
          "Arc fee: 200 bps (2%)",
        ]} />
        <p style={bodyStyle}>
          The fee is deducted from your stake before the LMSR cost is
          calculated.
        </p>
      </ContentSection>

      {/* ── RESOLUTION ── */}

      <GroupDivider label="Resolution" />

      <ContentSection>
        <SectionAnchor id="uma-oracle" />
        <h2 style={h2Style}>UMA oracle</h2>
        <p style={bodyStyle}>
          Outcomes are resolved through UMA's Optimistic Oracle V3. Anyone
          can propose a resolution by submitting an outcome vector and a
          plain-English claim describing the evidence.
        </p>
        <p style={{ ...bodyStyle, marginBottom: "8px" }}>Resolution flow:</p>
        <NumList items={[
          "Proposer calls proposeResolution() with an outcomeVector (uint256 bitmask) and a claim string",
          "UMA records the assertion on-chain",
          "Liveness window opens: 7200 seconds (2 hours)",
          "Anyone can dispute during the liveness window",
          "If undisputed, the assertion settles",
          "NoMarket finalises the outcome on settlement",
        ]} />
        <p style={bodyStyle}>
          The outcome vector is a bitmask where bit i = 1 means atom i
          resolved true.
        </p>
        <CodeBlock>{`Example: 3 atoms, atoms 1 and 3 are true -> 0b101 (decimal 5)`}</CodeBlock>
      </ContentSection>

      <ContentSection>
        <SectionAnchor id="claiming-payouts" />
        <h2 style={h2Style}>Claiming payouts</h2>
        <p style={bodyStyle}>
          After resolution settles, navigate to /history. Each resolved bet
          shows your payout amount.
        </p>
        <p style={bodyStyle}>
          You can claim bets individually or use "Claim all" to batch claim
          in one transaction. Unclaimed bets do not expire.
        </p>
        <Link
          href="/history"
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
          Go to My Bets
          <ArrowRight size={13} />
        </Link>
      </ContentSection>

      {/* ── NETWORK ── */}

      <GroupDivider label="Network" />

      <ContentSection>
        <SectionAnchor id="sepolia-zama" />
        <h2 style={h2Style}>Sepolia (Zama)</h2>
        <div style={{ marginBottom: "14px" }}>
          <InfoRow label="Chain ID" value="11155111" />
          <InfoRow label="RPC" value="Sepolia public RPC" />
          <InfoRow label="Explorer" value="sepolia.etherscan.io" />
          <InfoRow label="Contract" value="Not deployed" />
          <InfoRow label="Deploy block" value="Not deployed" />
          <InfoRow label="Privacy model" value="FHE-encrypted bets" />
          <InfoRow label="Creation deposit" value="0.002 ETH" />
        </div>
      </ContentSection>

      <ContentSection>
        <SectionAnchor id="arc-testnet" />
        <h2 style={h2Style}>Arc testnet</h2>
        <div style={{ marginBottom: "14px" }}>
          <InfoRow label="Chain ID" value="5042002" />
          <InfoRow label="RPC" value="https://rpc.testnet.arc.network" />
          <InfoRow label="Explorer" value="testnet.arcscan.app" />
          <InfoRow label="Contract" value="Not deployed" />
          <InfoRow label="Deploy block" value="Not deployed" />
          <InfoRow label="Privacy model" value="Plaintext bets" />
          <InfoRow label="Creation deposit" value="5 ARC" />
        </div>
      </ContentSection>

      {/* ── SUBGRAPH ── */}

      <GroupDivider label="Subgraph & API" />

      <ContentSection>
        <SectionAnchor id="subgraph" />
        <h2 style={h2Style}>Subgraph & API</h2>
        <p style={bodyStyle}>
          NoMarket indexes on-chain events through a Graph Protocol subgraph.
          When the subgraph is unavailable, the app falls back to reading logs
          directly from the RPC.
        </p>
        <Bullet items={[
          "Subgraph endpoint (Sepolia): not deployed yet",
          "Subgraph endpoint (Arc): not deployed yet",
        ]} />
        <p style={{ ...bodyStyle, marginBottom: "8px" }}>Indexed entities:</p>
        <Bullet items={[
          "Market: id, title, atoms[], creator, status",
          "Bet: id, marketId, wallet, stake, minterms",
          "Resolution: marketId, outcomeVector, claim",
        ]} />
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginTop: "8px" }}>
          <Link
            href="/subgraph"
            style={{
              ...telegraf,
              fontSize: "14px",
              color: "var(--nm-text-primary)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            Full schema
            <ArrowRight size={13} />
          </Link>
          <a
            href="https://github.com/0xchukss/NoMarket"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...telegraf,
              fontSize: "14px",
              color: "var(--nm-text-secondary)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            Source on GitHub ↗
          </a>
        </div>
      </ContentSection>

    </div>
  );
}

// ── layout wrapper ─────────────────────────────────────

export function DocsLayout() {
  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        padding: "64px 0 96px",
      }}
    >
      <div
        style={{
          maxWidth: "1350px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "flex-start",
          gap: "80px",
        }}
      >
        <DocsNav />
        <DocsContent />
      </div>
    </section>
  );
}
