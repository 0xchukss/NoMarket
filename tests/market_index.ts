import { expect } from "chai";
import {
  mergeIndexedAndLocalMarkets,
  parseIndexedMarketRouteId,
  toIndexedMarketRouteId
} from "../app/lib/marketIndex";
import { makeCreatedMarket, type CreatedMarket } from "../app/lib/marketStorage";

function testMarket(id: string, marketId: string, materialized: boolean): CreatedMarket {
  const market = makeCreatedMarket({
    title: `Market ${id}`,
    category: "Crypto",
    atoms: [
      { description: "Atom A", resolver: "UMA Optimistic Oracle" },
      { description: "Atom B", resolver: "UMA Optimistic Oracle" }
    ]
  });
  return {
    ...market,
    id,
    onchain: {
      chainId: "arc",
      marketId,
      contract: "0x0000000000000000000000000000000000000001",
      creator: "0x0000000000000000000000000000000000000002",
      materialized
    }
  };
}

describe("Shared market index", () => {
  it("creates deterministic indexed market route ids", () => {
    const id = toIndexedMarketRouteId("arc", 42);
    expect(id).to.equal("indexed-arc-42");
    expect(parseIndexedMarketRouteId(id)).to.deep.equal({ chainId: "arc", marketId: "42" });
    expect(parseIndexedMarketRouteId("market-local")).to.equal(undefined);
  });

  it("keeps local drafts but dedupes local materialized markets already in the subgraph", () => {
    const indexed = testMarket("indexed-arc-7", "7", true);
    const localDuplicate = testMarket("market-local-copy", "7", true);
    const localDraft = testMarket("market-draft", "", false);

    const merged = mergeIndexedAndLocalMarkets([indexed], [localDuplicate, localDraft]);

    expect(merged.map((market) => market.id)).to.deep.equal(["market-draft", "indexed-arc-7"]);
  });
});
