import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import { createPublicClient, decodeEventLog, http, type Hex } from "viem";
import { useAccount } from "wagmi";
import { Header } from "../components/Header";
import { HistoryPageHeader } from "../components/HistoryPageHeader";
import { MarketsNetworkTabs } from "../components/MarketsNetworkTabs";
import { HistoryControls } from "../components/HistoryControls";
import { HistoryStatsRow } from "../components/HistoryStatsRow";
import { HistoryBody, resolutionForMarket, type HistoryBet, type ResolutionState } from "../components/HistoryBody";
import { CHAIN_ORDER, getChainConfig, type ChainConfig } from "../lib/chains";
import { useSelectedChain } from "../lib/chains/useSelectedChain";
import { getNoMarketContractAbi, getNoMarketContractAddress, getNoMarketDeployBlock, getNoMarketWriteChain, isPublicNoMarketChain } from "../lib/evm/noMarketChains";
import { fetchIndexedMarkets, mergeIndexedAndLocalMarkets } from "../lib/marketIndex";
import { loadCreatedMarkets, type CreatedMarket } from "../lib/marketStorage";
import { isTradingOpen } from "../lib/marketLifecycle";

const MAX_LOG_BLOCK_RANGE = 9_999n;

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
  const [refreshTick, setRefreshTick] = useState(0);
  const [botKickKey, setBotKickKey] = useState("");

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
  }, [chain, refreshTick]);

  useEffect(() => {
    setBotKickKey("");
  }, [chain.id]);

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
  const pendingEndedMarketCount = visibleEndedMarkets.filter((market) => {
    const resolution = resolutionForMarket(market, resolutions);
    return !resolution.resolved || resolution.outcomeVector === undefined;
  }).length;

  useEffect(() => {
    if (status !== "idle" || pendingEndedMarketCount === 0 || botKickKey === chain.id) return;
    let cancelled = false;
    setBotKickKey(chain.id);
    fetch("/api/uma-bot/run-due-markets", { method: "POST" })
      .then(() => {
        if (!cancelled) {
          window.setTimeout(() => setRefreshTick((value) => value + 1), 5_000);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [botKickKey, chain.id, pendingEndedMarketCount, status]);

  const telegraf: React.CSSProperties = {
    fontFamily: "'Telegraf', sans-serif",
    fontWeight: 400,
  };

  return (
    <div style={{ backgroundColor: "var(--nm-bg)", minHeight: "100vh" }}>
      <Header />
      <HistoryPageHeader
        chainShortName={chain.shortName}
        onRefresh={() => setRefreshTick((v) => v + 1)}
      />
      <MarketsNetworkTabs />
      <main
        style={{
          width: "min(100%, 1100px)",
          margin: "0 auto",
          padding: "0 20px 80px",
        }}
      >
        <HistoryControls
          mode={mode}
          setMode={setMode}
          search={search}
          setSearch={setSearch}
        />
        <HistoryStatsRow
          visibleBetCount={visibleBets.length}
          totalStaked={totalStaked}
          nativeCurrency={chain.nativeCurrency}
          marketCount={markets.length}
        />
        <HistoryBody
          status={status}
          message={message}
          mode={mode}
          address={address}
          visibleBets={visibleBets}
          visibleEndedMarkets={visibleEndedMarkets}
          resolutions={resolutions}
          chain={chain}
        />
        <p
          style={{
            ...telegraf,
            marginTop: "14px",
            fontSize: "12px",
            color: "var(--nm-text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Clock3 size={12} />
          History follows the selected network · {CHAIN_ORDER.map((id) => getChainConfig(id).shortName).join(" / ")}
        </p>
      </main>
    </div>
  );
}
