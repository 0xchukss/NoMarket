import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { Header } from "../components/Header";
import { MarketsPageHeader } from "../components/MarketsPageHeader";
import { MarketsNetworkTabs } from "../components/MarketsNetworkTabs";
import { MarketsCategoryFilter } from "../components/MarketsCategoryFilter";
import { MarketsTable } from "../components/MarketsTable";
import { MarketsStatusLine } from "../components/MarketsStatusLine";
import { filterTabs, type Market } from "../lib/mockMarkets";
import { loadCreatedMarkets, type CreatedMarket } from "../lib/marketStorage";
import { useSelectedChain } from "../lib/chains/useSelectedChain";
import { fetchIndexedMarkets, mergeIndexedAndLocalMarkets } from "../lib/marketIndex";
import { isTradingOpen } from "../lib/marketLifecycle";
import type { ChainConfig } from "../lib/chains";

async function fetchUserPositionIds(chain: ChainConfig, address: string): Promise<Set<string>> {
  if (!chain.subgraphUrl) return new Set();
  try {
    const res = await fetch(chain.subgraphUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: `query UserPositions($bettor: String!){bets(where:{bettor:$bettor},first:100){marketId}}`,
        variables: { bettor: address.toLowerCase() },
      }),
    });
    if (!res.ok) return new Set();
    const json = await res.json();
    return new Set<string>((json.data?.bets ?? []).map((b: { marketId: string }) => String(b.marketId)));
  } catch {
    return new Set();
  }
}

const CATEGORY_TABS = filterTabs;

function marketSearchText(market: Market | CreatedMarket, networkName: string) {
  const atomText =
    "atoms" in market
      ? market.atoms
          .map((atom) => `${atom.description} ${atom.resolver} ${atom.uma?.question || ""}`)
          .join(" ")
      : "";
  return [
    market.title,
    market.category,
    market.icon,
    market.volume,
    market.endDate,
    networkName,
    ...(market.visual?.assets || []).map((asset) => `${asset.label} ${asset.alt}`),
    ...market.outcomes.map((outcome) => outcome.label),
    atomText,
  ]
    .join(" ")
    .toLowerCase();
}

export default function MarketsPage() {
  const { address } = useAccount();
  const [createdMarkets, setCreatedMarkets] = useState<CreatedMarket[]>([]);
  const [indexedMarkets, setIndexedMarkets] = useState<CreatedMarket[]>([]);
  const [indexStatus, setIndexStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [indexError, setIndexError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [positionMarketIds, setPositionMarketIds] = useState<Set<string>>(new Set());
  const { chain } = useSelectedChain();

  useEffect(() => {
    setCreatedMarkets(loadCreatedMarkets());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIndexedMarkets([]);
    setIndexError("");
    if (!chain.subgraphUrl || !chain.enabled) {
      setIndexStatus("idle");
      return () => { cancelled = true; };
    }
    setIndexStatus("loading");
    fetchIndexedMarkets(chain)
      .then((markets) => {
        if (cancelled) return;
        setIndexedMarkets(markets);
        setIndexStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setIndexError(error instanceof Error ? error.message : "Unable to load shared markets.");
        setIndexStatus("error");
      });
    return () => { cancelled = true; };
  }, [chain]);

  const displayMarkets = useMemo(() => {
    return mergeIndexedAndLocalMarkets(indexedMarkets, createdMarkets).filter(
      (market) => market.onchain.chainId === chain.id && isTradingOpen(market.lifecycle)
    );
  }, [chain.id, createdMarkets, indexedMarkets]);

  const filteredMarkets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return displayMarkets
      .filter((market) => activeCategory === "All" || market.category === activeCategory)
      .filter((market) => !query || marketSearchText(market, chain.shortName).includes(query));
  }, [activeCategory, chain.shortName, displayMarkets, searchQuery]);

  useEffect(() => {
    if (!address || !chain.subgraphUrl) {
      setPositionMarketIds(new Set());
      return;
    }
    fetchUserPositionIds(chain, address).then(setPositionMarketIds).catch(() => setPositionMarketIds(new Set()));
  }, [address, chain]);

  const hasSearch = searchQuery.trim().length > 0;
  const totalLive = displayMarkets.length;

  return (
    <div style={{ backgroundColor: "var(--nm-bg)", minHeight: "100vh" }}>
      <Header />

      <MarketsPageHeader
        chainShortName={chain.shortName}
        totalLive={totalLive}
        indexStatus={indexStatus}
      />

      <MarketsNetworkTabs />

      <main
        style={{
          width: "min(100%, 1100px)",
          margin: "0 auto",
          padding: "0 20px 80px",
        }}
      >


        <MarketsCategoryFilter
          categories={CATEGORY_TABS}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <MarketsTable
          markets={filteredMarkets}
          chain={chain}
          positionMarketIds={positionMarketIds}
          emptyMessage={
            hasSearch
              ? `No ${chain.shortName} markets match this search.`
              : activeCategory !== "All"
              ? `No ${activeCategory} markets are live on ${chain.shortName}.`
              : `No active markets on ${chain.shortName} yet.`
          }
          emptyHint={
            hasSearch
              ? "Try a different title, category, atom, or outcome term."
              : address
              ? "Ended markets move to History. Create one to start trading."
              : "Connect your wallet, then create a market to start trading."
          }
        />

        <MarketsStatusLine
          indexStatus={indexStatus}
          indexError={indexError}
          hasSearch={hasSearch}
          resultCount={filteredMarkets.length}
          searchQuery={searchQuery}
          chain={chain}
        />
      </main>
    </div>
  );
}
