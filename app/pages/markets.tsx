import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { Header } from "../components/Header";
import { MarketRows, NetworkTabs, OracleFormulaVeil } from "../components/OracleVisuals";
import type { Market } from "../lib/mockMarkets";
import { loadCreatedMarkets, type CreatedMarket } from "../lib/marketStorage";
import { useSelectedChain } from "../lib/chains/useSelectedChain";
import { fetchIndexedMarkets, mergeIndexedAndLocalMarkets } from "../lib/marketIndex";

function marketSearchText(market: Market | CreatedMarket, networkName: string) {
  const atomText = "atoms" in market ? market.atoms.map((atom) => `${atom.description} ${atom.resolver} ${atom.uma?.question || ""}`).join(" ") : "";
  return [
    market.title,
    market.category,
    market.icon,
    market.volume,
    market.endDate,
    networkName,
    ...(market.visual?.assets || []).map((asset) => `${asset.label} ${asset.alt}`),
    ...market.outcomes.map((outcome) => outcome.label),
    atomText
  ]
    .join(" ")
    .toLowerCase();
}

export default function MarketsPage() {
  const [createdMarkets, setCreatedMarkets] = useState<CreatedMarket[]>([]);
  const [indexedMarkets, setIndexedMarkets] = useState<CreatedMarket[]>([]);
  const [indexStatus, setIndexStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [indexError, setIndexError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
      return () => {
        cancelled = true;
      };
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
    return () => {
      cancelled = true;
    };
  }, [chain]);

  const displayMarkets = useMemo(() => {
    return mergeIndexedAndLocalMarkets(indexedMarkets, createdMarkets).filter((market) => market.onchain.chainId === chain.id);
  }, [chain.id, createdMarkets, indexedMarkets]);

  const filteredMarkets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return displayMarkets;
    return displayMarkets.filter((market) => marketSearchText(market, chain.shortName).includes(query));
  }, [chain.shortName, displayMarkets, searchQuery]);

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="oracle-page">
      <Header />
      <OracleFormulaVeil />
      <main className="oracle-markets-page">
        <NetworkTabs />

        <section className="oracle-market-board oracle-panel">
          <div className="oracle-board-head">
            <div>
              <p className="oracle-kicker">{chain.shortName} network</p>
              <h1>All Markets</h1>
            </div>
            <div className="oracle-board-actions">
              <div className="oracle-search">
                <Search className="h-4 w-4" />
                <input
                  aria-label="Search markets"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search markets"
                />
                {hasSearch && (
                  <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear market search">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Link href="/create" className="oracle-gold-button compact">
                <Plus className="h-4 w-4" />
                Create
              </Link>
            </div>
          </div>

          <MarketRows
            markets={filteredMarkets}
            chain={chain}
            emptyMessage={hasSearch ? `No ${chain.shortName} markets match this search.` : `No ${chain.shortName} markets yet.`}
            emptyHint={hasSearch ? "Try another title, category, atom, outcome, or network term." : "Create the first real combinatorial market for this network."}
          />

          <div className="oracle-board-foot">
            <span>
              {indexStatus === "loading"
                ? `Loading shared ${chain.shortName} markets from the subgraph...`
                : indexStatus === "error"
                  ? indexError
                  : hasSearch
                ? `${filteredMarkets.length} result${filteredMarkets.length === 1 ? "" : "s"} for "${searchQuery.trim()}".`
                : chain.enabled
                  ? `${chain.name} is configured for beta actions.`
                  : chain.setupMessage}
            </span>
            <span>UMA automation stays attached to each market page.</span>
          </div>
        </section>
      </main>
    </div>
  );
}
