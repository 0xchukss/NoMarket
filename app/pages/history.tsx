import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3, Search } from "lucide-react";
import { createPublicClient, decodeEventLog, formatEther, http, type Hex } from "viem";
import { useAccount } from "wagmi";
import { Header } from "../components/Header";
import { MarketVisualBadge } from "../components/MarketVisualBadge";
import { NetworkTabs, OracleFormulaVeil } from "../components/OracleVisuals";
import { CHAIN_ORDER, getChainConfig, type ChainConfig } from "../lib/chains";
import { useSelectedChain } from "../lib/chains/useSelectedChain";
import { getNoMarketContractAbi, getNoMarketContractAddress, getNoMarketDeployBlock, getNoMarketWriteChain, isPublicNoMarketChain } from "../lib/evm/noMarketChains";
import { fetchIndexedMarkets, mergeIndexedAndLocalMarkets } from "../lib/marketIndex";
import { loadCreatedMarkets, type CreatedMarket } from "../lib/marketStorage";
import { formatOutcomeVectorBinary } from "../lib/resolution";
import { isTradingOpen } from "../lib/marketLifecycle";

type HistoryBet = {
  market: CreatedMarket;
  betId: bigint;
  bettor: string;
  publicStake: bigint;
  outcomeMask?: bigint;
  careMask?: bigint;
  expression?: string;
  tx: string;
};

type ResolutionState = {
  resolved: boolean;
  outcomeVector?: number;
};

const MAX_LOG_BLOCK_RANGE = 9_999n;

function shortAddress(address: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
}

function resultForBet(bet: HistoryBet, resolution?: ResolutionState) {
  if (!resolution?.resolved || resolution.outcomeVector === undefined) return { label: "Pending result", className: "bg-amber-500/15 text-amber-200" };
  if (bet.outcomeMask === undefined || bet.careMask === undefined) return { label: "Resolved privately", className: "bg-violet-500/15 text-violet-200" };
  const matched = (resolution.outcomeVector & Number(bet.careMask)) === Number(bet.outcomeMask);
  return matched ? { label: "Won", className: "bg-emerald-500/15 text-emerald-300" } : { label: "Lost", className: "bg-red-500/15 text-red-300" };
}

function resolutionForMarket(market: CreatedMarket, resolutions: Map<string, ResolutionState>) {
  const indexed = resolutions.get(market.onchain.marketId);
  if (indexed) return indexed;
  return {
    resolved: market.resolution.status === "resolved",
    outcomeVector: market.resolution.status === "resolved" ? market.resolution.outcomeVector : undefined
  };
}

async function fetchSubgraphBets(chain: ChainConfig, markets: CreatedMarket[]) {
  if (!chain.subgraphUrl) throw new Error("No subgraph configured.");
  const isPublic = isPublicNoMarketChain(chain);
  const query = isPublic
    ? `
      query NoMarketHistory($marketIds: [BigInt!]) {
        bets(where: { marketId_in: $marketIds }, orderBy: betId, orderDirection: desc, first: 200) {
          marketId
          betId
          bettor
          publicStake
          stake
          outcomeMask
          careMask
          expression
          transactionHash
        }
        markets(where: { marketId_in: $marketIds }, first: 200) {
          marketId
          resolved
          outcomeVector
        }
      }
    `
    : `
      query NoMarketHistory($marketIds: [BigInt!]) {
        bets(where: { marketId_in: $marketIds }, orderBy: betId, orderDirection: desc, first: 200) {
          marketId
          betId
          bettor
          publicStake
          stake
          transactionHash
        }
        markets(where: { marketId_in: $marketIds }, first: 200) {
          marketId
          resolved
          outcomeVector
        }
      }
    `;
  const response = await fetch(chain.subgraphUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { marketIds: markets.map((market) => market.onchain.marketId).filter(Boolean) }
    })
  });
  if (!response.ok) throw new Error(`Subgraph HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.errors?.length) throw new Error(payload.errors.map((error: { message: string }) => error.message).join("; "));

  const marketById = new Map(markets.map((market) => [market.onchain.marketId, market]));
  const resolutions = new Map<string, ResolutionState>();
  for (const node of payload.data?.markets || []) {
    resolutions.set(String(node.marketId), {
      resolved: Boolean(node.resolved),
      outcomeVector: Number.isFinite(Number(node.outcomeVector)) ? Number(node.outcomeVector) : undefined
    });
  }
  const bets: HistoryBet[] = (payload.data?.bets || []).flatMap((node: any) => {
    const market = marketById.get(String(node.marketId));
    if (!market) return [];
    return [{
      market,
      betId: BigInt(node.betId || 0),
      bettor: String(node.bettor || ""),
      publicStake: BigInt(node.publicStake || node.stake || 0),
      outcomeMask: node.outcomeMask ? BigInt(node.outcomeMask) : undefined,
      careMask: node.careMask ? BigInt(node.careMask) : undefined,
      expression: isPublic ? node.expression : undefined,
      tx: String(node.transactionHash || "")
    }];
  });
  return { bets, resolutions };
}

async function fetchRpcBets(chain: ChainConfig, markets: CreatedMarket[]) {
  const viemChain = getNoMarketWriteChain(chain);
  const address = getNoMarketContractAddress(chain);
  if (!viemChain || !address || !chain.rpcUrl) throw new Error(`${chain.shortName} RPC is not configured.`);
  const publicClient = createPublicClient({ chain: viemChain, transport: http(chain.rpcUrl) });
  const latestBlock = await publicClient.getBlockNumber();
  const startBlock = getNoMarketDeployBlock(chain) > 0n ? getNoMarketDeployBlock(chain) : latestBlock;
  const abi = getNoMarketContractAbi(chain);
  const marketById = new Map(markets.map((market) => [market.onchain.marketId, market]));
  const bets: HistoryBet[] = [];
  const resolutions = new Map<string, ResolutionState>();

  for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += MAX_LOG_BLOCK_RANGE + 1n) {
    const toBlock = fromBlock + MAX_LOG_BLOCK_RANGE > latestBlock ? latestBlock : fromBlock + MAX_LOG_BLOCK_RANGE;
    const logs = await publicClient.getLogs({ address, fromBlock, toBlock });
    for (const log of logs) {
      try {
        const event = decodeEventLog({ abi, data: log.data as Hex, topics: log.topics as [Hex, ...Hex[]] }) as any;
        const marketId = String(event.args?.marketId || "");
        const market = marketById.get(marketId);
        if (!market) continue;
        if (event.eventName === "BetPlaced") {
          const publicChain = isPublicNoMarketChain(chain);
          bets.push({
            market,
            betId: event.args.betId,
            bettor: event.args.bettor,
            publicStake: publicChain ? event.args.stake : event.args.publicStake,
            outcomeMask: publicChain ? event.args.outcomeMask : undefined,
            careMask: publicChain ? event.args.careMask : undefined,
            expression: publicChain ? event.args.expression : undefined,
            tx: log.transactionHash
          });
        }
        if (event.eventName === "MarketResolved") {
          resolutions.set(marketId, { resolved: true, outcomeVector: Number(event.args.outcomeVector) });
        }
        if (event.eventName === "UmaResolutionProposed" && !resolutions.has(marketId)) {
          resolutions.set(marketId, { resolved: false, outcomeVector: Number(event.args.outcomeVector) });
        }
      } catch {
        continue;
      }
    }
  }
  return { bets, resolutions };
}

export default function HistoryPage() {
  const { address } = useAccount();
  const { chain } = useSelectedChain();
  const [mode, setMode] = useState<"personal" | "general">("personal");
  const [search, setSearch] = useState("");
  const [markets, setMarkets] = useState<CreatedMarket[]>([]);
  const [bets, setBets] = useState<HistoryBet[]>([]);
  const [resolutions, setResolutions] = useState<Map<string, ResolutionState>>(new Map());
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      setStatus("loading");
      setMessage("");
      try {
        const localMarkets = loadCreatedMarkets().filter((market) => market.onchain.chainId === chain.id);
        const indexedMarkets = await fetchIndexedMarkets(chain).catch(() => []);
        const nextMarkets = mergeIndexedAndLocalMarkets(indexedMarkets, localMarkets).filter((market) => market.onchain.materialized && market.onchain.marketId);
        if (cancelled) return;
        setMarkets(nextMarkets);
        if (nextMarkets.length === 0) {
          setBets([]);
          setResolutions(new Map());
          setStatus("idle");
          return;
        }
        const history = await fetchSubgraphBets(chain, nextMarkets).catch(() => fetchRpcBets(chain, nextMarkets));
        if (cancelled) return;
        setBets(history.bets);
        setResolutions(history.resolutions);
        setStatus("idle");
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : `Unable to load ${chain.shortName} history.`);
        }
      }
    }
    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [chain]);

  const visibleBets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bets
      .filter((bet) => mode === "general" || (address && bet.bettor.toLowerCase() === address.toLowerCase()))
      .filter((bet) => {
        if (!query) return true;
        return [bet.market.title, bet.market.category, bet.expression || "", bet.bettor, bet.tx].join(" ").toLowerCase().includes(query);
      });
  }, [address, bets, mode, search]);

  const visibleEndedMarkets = useMemo(() => {
    const query = search.trim().toLowerCase();
    const personalMarketIds = new Set(
      bets
        .filter((bet) => address && bet.bettor.toLowerCase() === address.toLowerCase())
        .map((bet) => bet.market.onchain.marketId)
    );
    return markets
      .filter((market) => !isTradingOpen(market.lifecycle))
      .filter((market) => mode === "general" || personalMarketIds.has(market.onchain.marketId) || market.onchain.creator.toLowerCase() === address?.toLowerCase())
      .filter((market) => {
        if (!query) return true;
        return [market.title, market.category, market.onchain.marketId, market.volume].join(" ").toLowerCase().includes(query);
      });
  }, [address, bets, markets, mode, search]);

  const totalStaked = visibleBets.reduce((sum, bet) => sum + bet.publicStake, 0n);

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
              <h1>History</h1>
            </div>
            <div className="oracle-board-actions">
              <div className="oracle-search">
                <Search className="h-4 w-4" />
                <input aria-label="Search history" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search history" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setMode("personal")} className={`h-9 rounded-full px-4 text-xs font-black ${mode === "personal" ? "bg-blue-500 text-white" : "bg-white/[0.04] text-slate-500"}`}>
              Personal History
            </button>
            <button type="button" onClick={() => setMode("general")} className={`h-9 rounded-full px-4 text-xs font-black ${mode === "general" ? "bg-blue-500 text-white" : "bg-white/[0.04] text-slate-500"}`}>
              NoMarket General History
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/7 bg-[#0b1219] p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">Visible bets</p>
              <p className="mt-1 text-lg font-black text-white">{visibleBets.length}</p>
            </div>
            <div className="rounded-xl border border-white/7 bg-[#0b1219] p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">Visible stake</p>
              <p className="mt-1 text-lg font-black text-white">{formatEther(totalStaked)} {chain.nativeCurrency}</p>
            </div>
            <div className="rounded-xl border border-white/7 bg-[#0b1219] p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">Markets tracked</p>
              <p className="mt-1 text-lg font-black text-white">{markets.length}</p>
            </div>
          </div>

          {status === "loading" ? (
            <div className="mt-4 rounded-xl border border-white/7 bg-[#0b1219] p-6 text-center text-xs font-bold text-slate-500">Loading history...</div>
          ) : status === "error" ? (
            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-xs font-bold text-amber-100">{message}</div>
          ) : mode === "personal" && !address ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-6 text-center text-xs font-bold text-slate-500">Connect your wallet to see your personal old placed bets.</div>
          ) : visibleBets.length === 0 && visibleEndedMarkets.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-6 text-center text-xs font-bold text-slate-500">No history found for this view.</div>
          ) : (
            <>
              {visibleEndedMarkets.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-xl border border-white/7">
                  <div className="grid gap-3 border-b border-white/7 bg-white/[0.025] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-600 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
                    <span>Ended market</span>
                    <span>Outcome</span>
                    <span>Volume</span>
                    <span className="text-right">Action</span>
                  </div>
                  <div className="divide-y divide-white/7">
                    {visibleEndedMarkets.map((market) => {
                      const resolution = resolutionForMarket(market, resolutions);
                      return (
                        <div key={market.id} className="grid gap-3 bg-[#0b1219] px-3 py-3 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto] md:items-center">
                          <div className="grid grid-cols-[36px_1fr] items-center gap-3">
                            <MarketVisualBadge market={market} size="sm" />
                            <div>
                              <p className="line-clamp-2 text-xs font-black text-white">{market.title}</p>
                              <p className="mt-1 text-[10px] font-bold uppercase text-slate-600">{market.category} / Market #{market.onchain.marketId}</p>
                            </div>
                          </div>
                          <div>
                            <span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-black ${resolution.resolved && resolution.outcomeVector !== undefined ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-200"}`}>
                              {resolution.resolved && resolution.outcomeVector !== undefined ? "Confirmed" : "Pending"}
                            </span>
                            <p className="mt-1 font-mono text-[10px] text-slate-600">{formatOutcomeVectorBinary(resolution.outcomeVector, market.atoms.length)}</p>
                          </div>
                          <p className="text-xs font-bold text-slate-200">{market.volume.replace("$", "")}</p>
                          <Link href={`/market/${market.id}`} className="oracle-row-action justify-self-start md:justify-self-end">
                            Open <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {visibleBets.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/7">
              <div className="grid gap-3 border-b border-white/7 bg-white/[0.025] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-600 md:grid-cols-[1.35fr_0.75fr_1fr_auto]">
                <span>Market</span>
                <span>Wallet / stake</span>
                <span>Outcome</span>
                <span className="text-right">Result</span>
              </div>
              <div className="divide-y divide-white/7">
                {visibleBets.map((bet) => {
                  const result = resultForBet(bet, resolutions.get(bet.market.onchain.marketId));
                  return (
                    <Link key={`${bet.market.id}-${bet.tx}-${bet.betId}`} href={`/market/${bet.market.id}`} className="grid gap-3 bg-[#0b1219] px-3 py-3 hover:bg-white/[0.025] md:grid-cols-[1.35fr_0.75fr_1fr_auto] md:items-center">
                      <div className="grid grid-cols-[36px_1fr] items-center gap-3">
                        <MarketVisualBadge market={bet.market} size="sm" />
                        <div>
                          <p className="line-clamp-2 text-xs font-black text-white">{bet.market.title}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase text-slate-600">{bet.market.category} / Bet #{bet.betId.toString()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="font-mono text-xs font-bold text-slate-200">{shortAddress(bet.bettor)}</p>
                        <p className="mt-1 text-[10px] text-slate-500">{formatEther(bet.publicStake)} {chain.nativeCurrency}</p>
                      </div>
                      <div>
                        <p className="line-clamp-2 text-xs text-slate-300">{bet.expression || "Private or indexed expression"}</p>
                        <p className="mt-1 font-mono text-[10px] text-slate-600">{formatOutcomeVectorBinary(resolutions.get(bet.market.onchain.marketId)?.outcomeVector, bet.market.atoms.length)}</p>
                      </div>
                      <span className={`justify-self-start rounded-lg px-2 py-1 text-[10px] font-black md:justify-self-end ${result.className}`}>{result.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
              )}
            </>
          )}

          <div className="oracle-board-foot">
            <span><Clock3 className="inline h-3.5 w-3.5" /> History follows the selected network.</span>
            <span>{CHAIN_ORDER.map((id) => getChainConfig(id).shortName).join(" / ")}</span>
          </div>
        </section>
      </main>
    </div>
  );
}
