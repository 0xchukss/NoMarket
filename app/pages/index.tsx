import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Header } from "../components/Header";
import { LandingCards, OracleFormulaVeil, OracleNodeMap } from "../components/OracleVisuals";
import { loadCreatedMarkets, type CreatedMarket } from "../lib/marketStorage";
import { fetchIndexedMarketsForConfiguredChains, mergeIndexedAndLocalMarkets } from "../lib/marketIndex";

export default function Home() {
  const [createdMarkets, setCreatedMarkets] = useState<CreatedMarket[]>([]);
  const [indexedMarkets, setIndexedMarkets] = useState<CreatedMarket[]>([]);

  useEffect(() => {
    setCreatedMarkets(loadCreatedMarkets());
    let cancelled = false;
    fetchIndexedMarketsForConfiguredChains()
      .then((markets) => {
        if (!cancelled) setIndexedMarkets(markets);
      })
      .catch(() => {
        if (!cancelled) setIndexedMarkets([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayMarkets = useMemo(() => {
    return mergeIndexedAndLocalMarkets(indexedMarkets, createdMarkets);
  }, [createdMarkets, indexedMarkets]);

  return (
    <div className="oracle-page">
      <Header />
      <OracleFormulaVeil />
      <main className="oracle-home">
        <section className="oracle-hero">
          <div className="oracle-hero-copy">
            <p className="oracle-kicker">Private prediction markets</p>
            <h1>Private Markets For Combinatorial Outcomes</h1>
            <p>
              Build Boolean claims, encrypt position data, and resolve market outcomes with UMA-backed settlement.
            </p>
            <div className="oracle-hero-actions">
              <Link href="/markets" className="oracle-gold-button">
                All Markets
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/create" className="oracle-quiet-button">
                Create Market
              </Link>
            </div>
          </div>

          <div className="oracle-hero-widget">
            <OracleNodeMap />
          </div>
        </section>

        <section className="oracle-proof-strip" aria-label="NoMarket privacy summary">
          <span><ShieldCheck className="h-4 w-4" /> Zama FHE</span>
          <span>Arc beta</span>
          <span>UMA resolution</span>
        </section>

        <LandingCards markets={displayMarkets} />
      </main>
    </div>
  );
}
