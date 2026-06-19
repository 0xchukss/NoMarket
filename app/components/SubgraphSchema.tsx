const telegraf: React.CSSProperties = {
  fontFamily: "'Telegraf', sans-serif",
  fontWeight: 400,
};

type Field = {
  name: string;
  type: string;
  description: string;
};

type Entity = {
  name: string;
  description: string;
  fields: Field[];
};

const ENTITIES: Entity[] = [
  {
    name: "Market",
    description:
      "Created each time someone deploys a market on-chain. Tracks atoms, stake totals, and current status.",
    fields: [
      { name: "id", type: "ID!", description: "Market ID from contract (uint256 as string)" },
      { name: "title", type: "String!", description: "Human-readable market title" },
      { name: "category", type: "String", description: "Optional category tag" },
      { name: "atoms", type: "[String!]!", description: "Ordered list of atom descriptions" },
      { name: "creator", type: "Bytes!", description: "Wallet address that created the market" },
      { name: "stake", type: "BigDecimal!", description: "Total ETH/ARC staked across all bets" },
      { name: "betCount", type: "BigInt!", description: "Total number of bets placed" },
      { name: "status", type: "MarketStatus!", description: "OPEN, CLOSED, or RESOLVED" },
      { name: "createdAt", type: "BigInt!", description: "Block timestamp of creation" },
      { name: "tradingEndTime", type: "BigInt", description: "Unix timestamp when trading closes (nullable)" },
      { name: "eventOccurrenceTime", type: "BigInt", description: "Expected event time (nullable, informational)" },
    ],
  },
  {
    name: "Bet",
    description:
      "One record per placeBet or placeBetMinterms call. Stores the stake, minterms, and claim state.",
    fields: [
      { name: "id", type: "ID!", description: "tx hash + log index" },
      { name: "market", type: "Market!", description: "Parent market entity" },
      { name: "wallet", type: "Bytes!", description: "Bettor's wallet address" },
      { name: "stake", type: "BigDecimal!", description: "Net stake after protocol fee" },
      { name: "minterms", type: "[BigInt!]!", description: "Encoded minterm array (plaintext on Arc, ciphertext on Zama)" },
      { name: "encrypted", type: "Boolean!", description: "True if minterms are FHE-encrypted (Zama chain)" },
      { name: "placedAt", type: "BigInt!", description: "Block timestamp of the bet" },
      { name: "claimed", type: "Boolean!", description: "True once the bettor has claimed their payout" },
      { name: "claimedAt", type: "BigInt", description: "Block timestamp of the claim (nullable)" },
    ],
  },
  {
    name: "Resolution",
    description:
      "Created when someone calls proposeResolution. Tracks the UMA assertion until it settles.",
    fields: [
      { name: "id", type: "ID!", description: "UMA assertion ID (bytes32 as hex string)" },
      { name: "market", type: "Market!", description: "Market being resolved" },
      { name: "outcomeVector", type: "BigInt!", description: "Bitmask where bit i = 1 means atom i resolved true" },
      { name: "claim", type: "String!", description: "Plain-English evidence claim submitted to UMA" },
      { name: "proposer", type: "Bytes!", description: "Wallet that proposed the resolution" },
      { name: "proposedAt", type: "BigInt!", description: "Block timestamp of the proposal" },
      { name: "settled", type: "Boolean!", description: "True once UMA liveness window closed without dispute" },
      { name: "settledAt", type: "BigInt", description: "Block timestamp of settlement (nullable)" },
    ],
  },
];

function FieldRow({ name, type, description, isLast }: Field & { isLast: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 140px 1fr",
        gap: "16px",
        padding: "10px 0",
        borderBottom: isLast ? "none" : "1px solid var(--nm-divider)",
        alignItems: "baseline",
      }}
    >
      <code
        style={{
          ...telegraf,
          fontSize: "13px",
          color: "var(--nm-text-primary)",
        }}
      >
        {name}
      </code>
      <code
        style={{
          ...telegraf,
          fontSize: "12px",
          color: "#ffd208",
          backgroundColor: "var(--nm-bg-tint)",
          border: "1px solid var(--nm-divider)",
          borderRadius: "3px",
          padding: "1px 6px",
          display: "inline-block",
        }}
      >
        {type}
      </code>
      <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-secondary)", lineHeight: 1.5 }}>
        {description}
      </span>
    </div>
  );
}

function EntityBlock({ name, description, fields }: Entity) {
  return (
    <div
      style={{
        border: "1px solid var(--nm-border)",
        borderRadius: "6px",
        overflow: "hidden",
        marginBottom: "24px",
      }}
    >
      {/* entity header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--nm-divider)",
          display: "flex",
          alignItems: "baseline",
          gap: "16px",
        }}
      >
        <span
          style={{
            ...telegraf,
            fontSize: "16px",
            color: "var(--nm-text-primary)",
            letterSpacing: "-0.2px",
          }}
        >
          {name}
        </span>
        <span style={{ ...telegraf, fontSize: "13px", color: "var(--nm-text-muted)" }}>
          {description}
        </span>
      </div>

      {/* column labels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "160px 140px 1fr",
          gap: "16px",
          padding: "8px 24px",
          backgroundColor: "var(--nm-bg-tint)",
          borderBottom: "1px solid var(--nm-divider)",
        }}
      >
        {["Field", "Type", "Description"].map((col) => (
          <span
            key={col}
            style={{
              ...telegraf,
              fontSize: "11px",
              color: "var(--nm-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {col}
          </span>
        ))}
      </div>

      {/* fields */}
      <div style={{ padding: "0 24px" }}>
        {fields.map((field, i) => (
          <FieldRow key={field.name} {...field} isLast={i === fields.length - 1} />
        ))}
      </div>
    </div>
  );
}

export function SubgraphSchema() {
  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "var(--nm-bg)",
        padding: "72px 0",
        borderBottom: "1px solid var(--nm-divider)",
      }}
    >
      <div
        style={{
          maxWidth: "1350px",
          margin: "0 auto",
          padding: "0 24px",
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
          Schema
        </p>

        <h2
          style={{
            ...telegraf,
            fontSize: "28px",
            color: "var(--nm-text-primary)",
            letterSpacing: "-0.4px",
            margin: "0 0 8px 0",
            lineHeight: 1.2,
          }}
        >
          Entity schema
        </h2>

        <p
          style={{
            ...telegraf,
            fontSize: "15px",
            color: "var(--nm-text-body)",
            lineHeight: 1.6,
            margin: "0 0 40px 0",
            maxWidth: "520px",
          }}
        >
          Three top-level entities. All amounts are in ETH or ARC depending on
          the chain. Timestamps are Unix seconds from block headers.
        </p>

        {ENTITIES.map((entity) => (
          <EntityBlock key={entity.name} {...entity} />
        ))}
      </div>
    </section>
  );
}
