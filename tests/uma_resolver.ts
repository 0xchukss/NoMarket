import { expect } from "chai";
import { loadCreatedMarkets, makeCreatedMarket, updateCreatedMarket } from "../app/lib/marketStorage";
import {
  buildUmaResolutionClaim,
  formatOutcomeVectorBinary,
  getOutcomeVector,
  normalizeResolutionState,
  type AtomResolutionDraft
} from "../app/lib/resolution";
import { defaultUmaResolver, describeUmaRule } from "../app/lib/switchboardOracle";

describe("UMA resolver flow", () => {
  it("creates markets with UMA resolver metadata", () => {
    const market = makeCreatedMarket({
      title: "BTC above 110k and ETH above 8k",
      category: "Crypto",
      atoms: [
        {
          description: "BTC above 110k",
          resolver: "UMA Optimistic Oracle",
          uma: defaultUmaResolver("BTC is above 110k at expiry")
        },
        {
          description: "ETH above 8k",
          resolver: "UMA Optimistic Oracle",
          uma: defaultUmaResolver("ETH is above 8k at expiry")
        }
      ]
    });

    expect(market.resolutionSource).to.equal("uma");
    expect(market.atoms[0].resolver).to.equal("UMA Optimistic Oracle");
    expect(market.atoms[0].uma?.status).to.equal("watching");
    expect(market.onchain.materialized).to.equal(false);
  });

  it("describes UMA assertion state", () => {
    const resolver = defaultUmaResolver("Outcome vector is 3");
    expect(describeUmaRule(resolver)).to.equal("Outcome vector is 3");
  });

  it("calculates outcome vectors from atom truth values", () => {
    const outcomes: AtomResolutionDraft[] = [
      { outcome: "true", evidence: "A happened" },
      { outcome: "false", evidence: "B did not happen" },
      { outcome: "true", evidence: "C happened" }
    ];

    expect(getOutcomeVector(outcomes)).to.equal(0b101);
    expect(formatOutcomeVectorBinary(0b101, 3)).to.equal("0b101");
  });

  it("builds UMA claims that preserve atom order", () => {
    const atoms = [
      { description: "ETH closes above 4200", uma: defaultUmaResolver("ETH above 4200 at expiry") },
      { description: "BTC closes above 110000", uma: defaultUmaResolver("BTC above 110000 at expiry") }
    ];
    const atomOutcomes: AtomResolutionDraft[] = [
      { outcome: "true", evidence: "Reference price was above threshold." },
      { outcome: "false", evidence: "Reference price was below threshold." }
    ];
    const claim = buildUmaResolutionClaim({
      marketTitle: "ETH and BTC price package",
      networkName: "Zama Sepolia",
      atoms,
      atomOutcomes,
      outcomeVector: getOutcomeVector(atomOutcomes)!
    });

    expect(claim).to.contain("outcome vector: 1 (0b01)");
    expect(claim).to.contain("Atom 0: TRUE");
    expect(claim).to.contain("Atom 1: FALSE");
  });

  it("normalizes missing resolution drafts for stored markets", () => {
    const normalized = normalizeResolutionState(undefined, 3);

    expect(normalized.status).to.equal("draft");
    expect(normalized.atomOutcomes).to.have.length(3);
    expect(normalized.atomOutcomes[0].outcome).to.equal("unknown");
  });

  it("upserts market updates instead of wiping empty browser storage", () => {
    const store = new Map<string, string>();
    const previousWindow = (globalThis as any).window;
    (globalThis as any).window = {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value)
      }
    };

    try {
      const market = makeCreatedMarket({
        title: "Resolution persistence",
        category: "Crypto",
        atoms: [
          { description: "Atom A", resolver: "UMA Optimistic Oracle", uma: defaultUmaResolver("Atom A") },
          { description: "Atom B", resolver: "UMA Optimistic Oracle", uma: defaultUmaResolver("Atom B") }
        ]
      });
      updateCreatedMarket({
        ...market,
        resolution: {
          ...market.resolution,
          status: "ready",
          outcomeVector: 1
        }
      });

      const markets = loadCreatedMarkets();
      expect(markets).to.have.length(1);
      expect(markets[0].id).to.equal(market.id);
      expect(markets[0].resolution.outcomeVector).to.equal(1);
    } finally {
      (globalThis as any).window = previousWindow;
    }
  });
});
