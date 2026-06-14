import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEncrypt } from "@zama-fhe/react-sdk";
import { Bookmark, ChevronDown, ChevronLeft, Clock, Lock, Share2 } from "lucide-react";
import { bytesToHex, decodeEventLog, formatEther, parseEther, type Hex } from "viem";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import type { Market, Outcome } from "../lib/mockMarkets";
import { loadCreatedMarkets, updateCreatedMarket, type CreatedAtom, type CreatedMarket } from "../lib/marketStorage";
import { costOfBet, expressionProbability, type Minterm } from "../lib/expression";
import { ExpressionBuilderUI } from "./ExpressionBuilderUI";
import { noMarketAbi, shortAddress } from "../lib/evm/noMarketContract";
import { arcNoMarketAbi } from "../lib/evm/arcNoMarketContract";
import {
  getNoMarketContractAbi,
  getNoMarketContractAddress,
  getNoMarketDeployBlock,
  getNoMarketWriteChain,
  isLiveNoMarketChain,
  isPublicNoMarketChain,
  requireNoMarketContractAddress
} from "../lib/evm/noMarketChains";
import { describeUmaRule } from "../lib/switchboardOracle";
import { Header } from "./Header";
import { MarketVisualBadge } from "./MarketVisualBadge";
import { OracleFormulaVeil, OraclePriceChart, OracleStatLedger, OracleSummaryModules, ProbabilityInputCard } from "./OracleVisuals";
import { WalletConnect } from "./WalletConnect";
import { getChainConfig, privacyLabel } from "../lib/chains";
import { useSelectedChain } from "../lib/chains/useSelectedChain";
import {
  fetchIndexedMarketByRouteId,
  fetchIndexedMarketsForConfiguredChains,
  mergeIndexedAndLocalMarkets,
  parseIndexedMarketRouteId
} from "../lib/marketIndex";
import {
  formatOutcomeVectorBinary
} from "../lib/resolution";
import {
  buildOnchainMarketMetadata,
  formatLifecycleDate,
  getCreationDepositWeiForChain,
  getLifecyclePhase,
  isResolutionReady,
  isTradingOpen,
  lifecycleToUnixSeconds,
  normalizeMarketLifecycle,
  supportsTimedMarketCreation
} from "../lib/marketLifecycle";

type MarketDetail = {
  title: string;
  category?: string;
  volume: string;
  endDate: string;
  source: string;
  outcomes: Outcome[];
  atoms?: CreatedAtom[];
};

type BetHistoryItem = {
  betId: bigint;
  bettor: string;
  publicStake: bigint;
  encryptedStakeHandle?: string;
  encryptedOutcomeMaskHandle?: string;
  encryptedCareMaskHandle?: string;
  outcomeMask?: bigint;
  careMask?: bigint;
  expression?: string;
  transactionHash: string;
  blockTimestamp?: string;
};

type SubgraphBetNode = {
  betId: string;
  bettor: string;
  publicStake?: string;
  stake?: string;
  encryptedStakeHandle?: string;
  encryptedOutcomeMaskHandle?: string;
  encryptedCareMaskHandle?: string;
  outcomeMask?: string;
  careMask?: string;
  expression?: string;
  transactionHash?: string;
  blockTimestamp?: string;
};

type ResolutionProposalNode = {
  assertionId: string;
  outcomeVector: string;
  claim: string;
  transactionHash: string;
  blockTimestamp: string;
};

type MarketResolutionNode = {
  outcomeVector: string;
  transactionHash: string;
  blockTimestamp: string;
};

type ResolutionHistoryState = {
  proposal?: ResolutionProposalNode;
  resolution?: MarketResolutionNode;
  resolved: boolean;
  assertionId?: string;
  outcomeVector?: number;
};

const MAX_LOG_BLOCK_RANGE = 9_999n;

const zamaBetHistorySubgraphQuery = `
  query NoMarketZamaBetHistory($marketId: BigInt!) {
    bets(where: { marketId: $marketId }, orderBy: betId, orderDirection: desc) {
      betId
      bettor
      publicStake
      stake
      encryptedStakeHandle
      encryptedOutcomeMaskHandle
      encryptedCareMaskHandle
      outcomeMask
      careMask
      expression
      transactionHash
      blockTimestamp
    }
  }
`;

const publicBetHistorySubgraphQuery = `
  query NoMarketPublicBetHistory($marketId: BigInt!) {
    bets(where: { marketId: $marketId }, orderBy: betId, orderDirection: desc) {
      betId
      bettor
      publicStake
      stake
      outcomeMask
      careMask
      expression
      transactionHash
      blockTimestamp
    }
  }
`;

const resolutionSubgraphQuery = `
  query NoMarketResolution($marketId: BigInt!) {
    markets(where: { marketId: $marketId }, first: 1) {
      resolved
      outcomeVector
      assertionId
    }
    resolutionProposals(where: { marketId: $marketId }, orderBy: blockTimestamp, orderDirection: desc, first: 1) {
      assertionId
      outcomeVector
      claim
      transactionHash
      blockTimestamp
    }
    marketResolutions(where: { marketId: $marketId }, orderBy: blockTimestamp, orderDirection: desc, first: 1) {
      outcomeVector
      transactionHash
      blockTimestamp
    }
  }
`;

function mapSubgraphBet(node: SubgraphBetNode, isPublicChain: boolean): BetHistoryItem {
  return {
    betId: BigInt(node.betId || 0),
    bettor: node.bettor,
    publicStake: BigInt(node.publicStake || node.stake || 0),
    encryptedStakeHandle: node.encryptedStakeHandle,
    encryptedOutcomeMaskHandle: node.encryptedOutcomeMaskHandle,
    encryptedCareMaskHandle: node.encryptedCareMaskHandle,
    outcomeMask: node.outcomeMask ? BigInt(node.outcomeMask) : undefined,
    careMask: node.careMask ? BigInt(node.careMask) : undefined,
    expression: isPublicChain ? node.expression : undefined,
    transactionHash: node.transactionHash || "0x0000000000000000000000000000000000000000000000000000000000000000",
    blockTimestamp: node.blockTimestamp
  };
}

async function fetchSubgraphBetHistory(subgraphUrl: string, marketId: string, isPublicChain: boolean) {
  const response = await fetch(subgraphUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: isPublicChain ? publicBetHistorySubgraphQuery : zamaBetHistorySubgraphQuery,
      variables: { marketId }
    })
  });
  if (!response.ok) {
    throw new Error(`Subgraph request failed with HTTP ${response.status}.`);
  }
  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error: { message: string }) => error.message).join("; "));
  }
  return ((payload.data?.bets || []) as SubgraphBetNode[]).map((bet) => mapSubgraphBet(bet, isPublicChain));
}

async function fetchSubgraphResolutionState(subgraphUrl: string, marketId: string): Promise<ResolutionHistoryState> {
  const response = await fetch(subgraphUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: resolutionSubgraphQuery,
      variables: { marketId }
    })
  });
  if (!response.ok) {
    throw new Error(`Subgraph request failed with HTTP ${response.status}.`);
  }
  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error: { message: string }) => error.message).join("; "));
  }

  const indexedMarket = payload.data?.markets?.[0];
  const proposal = payload.data?.resolutionProposals?.[0] as ResolutionProposalNode | undefined;
  const resolution = payload.data?.marketResolutions?.[0] as MarketResolutionNode | undefined;
  const outcomeVector = Number(resolution?.outcomeVector ?? proposal?.outcomeVector ?? indexedMarket?.outcomeVector);
  const assertionId = proposal?.assertionId || indexedMarket?.assertionId;
  return {
    proposal,
    resolution,
    resolved: Boolean(resolution || indexedMarket?.resolved),
    assertionId: assertionId && !/^0x0+$/.test(assertionId) ? assertionId : undefined,
    outcomeVector: Number.isFinite(outcomeVector) ? outcomeVector : undefined
  };
}

function formatNativeAmount(value: bigint) {
  const formatted = formatEther(value);
  const numeric = Number(formatted);
  if (!Number.isFinite(numeric)) return formatted;
  if (numeric === 0) return "0";
  return numeric.toLocaleString(undefined, {
    maximumFractionDigits: numeric >= 1 ? 4 : 8
  });
}

function formatMarketVolume(totalStaked: bigint, nativeCurrency: string) {
  return `${formatNativeAmount(totalStaked)} ${nativeCurrency}`;
}

function parseMarketVolumeToWei(volume: string | undefined) {
  const amount = volume?.replace(/,/g, "").match(/^([0-9]+(?:\.[0-9]+)?)/)?.[1];
  if (!amount) return 0n;
  try {
    return parseEther(amount);
  } catch {
    return 0n;
  }
}

async function fetchRpcResolutionState(input: {
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>;
  market: CreatedMarket;
}): Promise<ResolutionHistoryState> {
  const chain = getChainConfig(input.market.onchain.chainId);
  const latestBlock = await input.publicClient.getBlockNumber();
  const startBlock = getNoMarketDeployBlock(chain) > 0n ? getNoMarketDeployBlock(chain) : latestBlock;
  const address = requireNoMarketContractAddress(chain);
  const abi = getNoMarketContractAbi(chain);
  const logs = [];

  for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += MAX_LOG_BLOCK_RANGE + 1n) {
    const toBlock = fromBlock + MAX_LOG_BLOCK_RANGE > latestBlock ? latestBlock : fromBlock + MAX_LOG_BLOCK_RANGE;
    logs.push(
      ...(await input.publicClient.getLogs({
        address,
        fromBlock,
        toBlock
      }))
    );
  }

  let proposal: ResolutionProposalNode | undefined;
  let resolution: MarketResolutionNode | undefined;
  for (const log of logs) {
    try {
      const rawLog = log as unknown as { data: Hex; topics: [Hex, ...Hex[]] };
      const event = decodeEventLog({ abi, data: rawLog.data, topics: rawLog.topics }) as any;
      if (String(event.args.marketId) !== input.market.onchain.marketId) continue;
      if (event.eventName === "UmaResolutionProposed") {
        proposal = {
          assertionId: event.args.assertionId,
          outcomeVector: String(event.args.outcomeVector),
          claim: event.args.claim,
          transactionHash: log.transactionHash,
          blockTimestamp: "0"
        };
      }
      if (event.eventName === "MarketResolved") {
        resolution = {
          outcomeVector: String(event.args.outcomeVector),
          transactionHash: log.transactionHash,
          blockTimestamp: "0"
        };
      }
    } catch {
      continue;
    }
  }

  const outcomeVector = Number(resolution?.outcomeVector ?? proposal?.outcomeVector);
  return {
    proposal,
    resolution,
    resolved: Boolean(resolution),
    assertionId: proposal?.assertionId,
    outcomeVector: Number.isFinite(outcomeVector) ? outcomeVector : undefined
  };
}

async function fetchRpcBetHistory(input: {
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>;
  market: CreatedMarket;
  isPublicLive: boolean;
}) {
  const chain = getChainConfig(input.market.onchain.chainId);
  const latestBlock = await input.publicClient.getBlockNumber();
  const deployBlock = getNoMarketDeployBlock(chain);
  const startBlock = deployBlock > 0n ? deployBlock : latestBlock;
  const contractAddress = requireNoMarketContractAddress(chain);
  const abi = getNoMarketContractAbi(chain);
  const logs = [];
  for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += MAX_LOG_BLOCK_RANGE + 1n) {
    const toBlock = fromBlock + MAX_LOG_BLOCK_RANGE > latestBlock ? latestBlock : fromBlock + MAX_LOG_BLOCK_RANGE;
    logs.push(
      ...(await input.publicClient.getLogs({
        address: contractAddress,
        fromBlock,
        toBlock
      }))
    );
  }
  return logs.flatMap((log) => {
    try {
      const rawLog = log as unknown as { data: Hex; topics: [Hex, ...Hex[]] };
      const event = decodeEventLog({ abi, data: rawLog.data, topics: rawLog.topics }) as any;
      if (event.eventName !== "BetPlaced") return [];
      if (String(event.args.marketId) !== input.market.onchain.marketId) return [];
      return [
        input.isPublicLive
          ? {
              betId: event.args.betId,
              bettor: event.args.bettor,
              publicStake: event.args.stake,
              outcomeMask: event.args.outcomeMask,
              careMask: event.args.careMask,
              expression: event.args.expression,
              transactionHash: log.transactionHash
            }
          : {
              betId: event.args.betId,
              bettor: event.args.bettor,
              publicStake: event.args.publicStake,
              encryptedStakeHandle: event.args.encryptedStakeHandle,
              encryptedOutcomeMaskHandle: event.args.encryptedOutcomeMaskHandle,
              encryptedCareMaskHandle: event.args.encryptedCareMaskHandle,
              transactionHash: log.transactionHash
            }
      ] satisfies BetHistoryItem[];
    } catch {
      return [];
    }
  });
}

function formatBetTimestamp(timestamp: string | undefined) {
  const seconds = Number(timestamp || 0);
  if (!Number.isFinite(seconds) || seconds <= 0) return "Confirmed on-chain";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(seconds * 1000));
}

function getBetResultLabel(input: {
  bet: BetHistoryItem;
  resolution?: ResolutionHistoryState;
  isPublicLive: boolean;
}) {
  const vector = input.resolution?.outcomeVector;
  if (vector === undefined) {
    return { label: "Pending result", tone: "pending" as const };
  }
  if (!input.isPublicLive || input.bet.outcomeMask === undefined || input.bet.careMask === undefined) {
    return { label: "Resolved privately", tone: "private" as const };
  }
  const outcomeMask = Number(input.bet.outcomeMask);
  const careMask = Number(input.bet.careMask);
  const matched = (vector & careMask) === outcomeMask;
  return matched ? { label: "Won", tone: "won" as const } : { label: "Lost", tone: "lost" as const };
}

function getBetPositionSummary(bet: BetHistoryItem, isPublicLive: boolean) {
  if (!isPublicLive) return "Encrypted position";
  if (bet.expression) return bet.expression;
  return `Outcome mask ${bet.outcomeMask?.toString() || "0"} / care mask ${bet.careMask?.toString() || "0"}`;
}

function betResultClass(tone: ReturnType<typeof getBetResultLabel>["tone"]) {
  if (tone === "won") return "bg-emerald-500/15 text-emerald-300";
  if (tone === "lost") return "bg-red-500/15 text-red-300";
  if (tone === "private") return "bg-violet-500/15 text-violet-200";
  return "bg-amber-500/15 text-amber-200";
}

const fallbackMarketDetail: MarketDetail = {
  title: "Untitled combinatorial market",
  volume: "$0 Vol.",
  endDate: "Draft",
  source: "NoMarket",
  outcomes: [
    { label: "Yes", probability: 19, tone: "yes" },
    { label: "No", probability: 81, tone: "no" },
    { label: "Later review", probability: 40, tone: "neutral" }
  ]
};

const faqItems = [
  {
    question: "What is this combinatorial market?",
    answer: "It is a market for expressing a forecast as a Boolean or conditional claim that can later be resolved from a defined event set."
  },
  {
    question: "How much trading activity has this market generated?",
    answer: "Trading activity is read from confirmed chain events. Wallet and stake visibility follow the selected network adapter."
  },
  {
    question: "How do I trade this market?",
    answer: "Build a Boolean expression, enter a stake, then sign the network transaction shown by your wallet."
  },
  {
    question: "What are the current odds?",
    answer: "The odds are calculated from the market outcome probabilities and will update as the market data changes."
  },
  {
    question: "How will this market be resolved?",
    answer: "The market resolves when an UMA Optimistic Oracle assertion for the combinatorial outcome vector passes its challenge window."
  }
];

const relatedTabs = ["All", "Policy", "Tech", "Crypto"];

function relatedMarketMatchesTab(market: CreatedMarket, activeTab: string) {
  if (activeTab === "All") return true;
  const category = market.category.toLowerCase();
  const text = [
    market.title,
    market.category,
    ...market.atoms.map((atom) => `${atom.description} ${atom.uma?.question || ""}`)
  ]
    .join(" ")
    .toLowerCase();

  if (activeTab === "Policy") {
    return /\b(policy|politics|political|election|president|senate|congress|minister|vote|geopolitics)\b/.test(`${category} ${text}`);
  }
  if (activeTab === "Tech") {
    return /\b(tech|ai|launch|rollup|mainnet|protocol|software|network|zk|fhe)\b/.test(`${category} ${text}`);
  }
  if (activeTab === "Crypto") {
    return /\b(crypto|eth|btc|bitcoin|token|usd|usdc|solana|ethereum|zama|arc)\b/.test(`${category} ${text}`);
  }
  return category === activeTab.toLowerCase();
}

function hasCreatedAtoms(market: unknown): market is CreatedMarket {
  return Boolean(market && typeof market === "object" && "atoms" in market && Array.isArray((market as CreatedMarket).atoms));
}

export function MarketDetailPage() {
  const router = useRouter();
  const { chain: selectedChain } = useSelectedChain();
  const [createdMarkets, setCreatedMarkets] = useState<CreatedMarket[]>([]);
  const [indexedMarket, setIndexedMarket] = useState<CreatedMarket | undefined>();
  const [indexedStatus, setIndexedStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [indexedError, setIndexedError] = useState("");
  const [liveVolume, setLiveVolume] = useState("");
  const [liveTotalStaked, setLiveTotalStaked] = useState<bigint | undefined>();

  useEffect(() => setCreatedMarkets(loadCreatedMarkets()), []);
  useEffect(() => {
    const id = typeof router.query.id === "string" ? router.query.id : "";
    let cancelled = false;
    setIndexedMarket(undefined);
    setIndexedError("");
    if (!parseIndexedMarketRouteId(id)) {
      setIndexedStatus("idle");
      return () => {
        cancelled = true;
      };
    }
    setIndexedStatus("loading");
    fetchIndexedMarketByRouteId(id)
      .then((market) => {
        if (cancelled) return;
        setIndexedMarket(market);
        setIndexedStatus(market ? "ready" : "error");
        setIndexedError(market ? "" : "This indexed market was not found in the configured subgraph.");
      })
      .catch((error) => {
        if (cancelled) return;
        setIndexedStatus("error");
        setIndexedError(error instanceof Error ? error.message : "Unable to load this indexed market.");
      });
    return () => {
      cancelled = true;
    };
  }, [router.query.id]);
  useEffect(() => {
    setLiveVolume("");
    setLiveTotalStaked(undefined);
  }, [router.query.id]);

  const selectedMarket = useMemo(() => {
    const id = typeof router.query.id === "string" ? router.query.id : "";
    return createdMarkets.find((market) => market.id === id) || (indexedMarket?.id === id ? indexedMarket : undefined);
  }, [createdMarkets, indexedMarket, router.query.id]);
  const selectedCreatedMarket = hasCreatedAtoms(selectedMarket) ? selectedMarket : undefined;
  const marketChain = selectedCreatedMarket ? getChainConfig(selectedCreatedMarket.onchain.chainId) : selectedChain;
  const selectedMarketId = typeof router.query.id === "string" ? router.query.id : "";
  const marketDetail: MarketDetail = selectedMarket
    ? {
        title: selectedMarket.title,
        category: selectedMarket.category,
        volume: liveVolume || selectedMarket.volume,
        endDate: selectedCreatedMarket ? formatLifecycleDate(selectedCreatedMarket.lifecycle.tradingEndTime) : selectedMarket.endDate,
        source: "NoMarket",
        outcomes: selectedMarket.outcomes,
        atoms: hasCreatedAtoms(selectedMarket) ? selectedMarket.atoms : undefined
      }
    : fallbackMarketDetail;
  const displayMarket = selectedMarket && liveVolume ? { ...selectedMarket, volume: liveVolume } : selectedMarket;
  const handleVolumeChange = useCallback(
    (volume: string, totalStaked: bigint) => {
      setLiveVolume(volume);
      setLiveTotalStaked(totalStaked);
      if (selectedCreatedMarket && volume !== selectedCreatedMarket.volume) {
        updateCreatedMarket({ ...selectedCreatedMarket, volume });
        setCreatedMarkets(loadCreatedMarkets());
      }
    },
    [selectedCreatedMarket]
  );
  const handleBetConfirmed = useCallback(
    (stakeWei: bigint) => {
      if (!selectedCreatedMarket) return;
      const baseTotal = liveTotalStaked ?? parseMarketVolumeToWei(selectedCreatedMarket.volume);
      const nextTotal = baseTotal + stakeWei;
      handleVolumeChange(formatMarketVolume(nextTotal, marketChain.nativeCurrency), nextTotal);
    },
    [handleVolumeChange, liveTotalStaked, marketChain.nativeCurrency, selectedCreatedMarket]
  );

  return (
    <div className="oracle-page">
      <Header />
      <OracleFormulaVeil />
      <main className="oracle-detail-page">
        <Link href="/markets" className="oracle-back-link">
          <ChevronLeft className="h-4 w-4" />
          All markets
        </Link>

        {selectedMarket ? (
          <>
            <header className="oracle-detail-title">
              <p className="oracle-kicker">{marketChain.shortName} market</p>
              <h1>{marketDetail.title}</h1>
            </header>

            <section className="oracle-detail-shell oracle-panel">
              <div className="oracle-detail-left">
                <OraclePriceChart market={displayMarket as Market} />
                {selectedCreatedMarket ? (
                  <>
                    <MarketLifecyclePanel market={selectedCreatedMarket} />
                    <AtomList
                      market={selectedCreatedMarket}
                      onChange={(updatedMarket) => {
                        updateCreatedMarket(updatedMarket);
                        setCreatedMarkets(loadCreatedMarkets());
                      }}
                    />
                    <BetHistory
                      market={selectedCreatedMarket}
                      onVolumeChange={handleVolumeChange}
                    />
                    <UmaResolutionPanel
                      market={selectedCreatedMarket}
                      onChange={(updatedMarket) => {
                        updateCreatedMarket(updatedMarket);
                        setCreatedMarkets(loadCreatedMarkets());
                      }}
                    />
                  </>
                ) : (
                  <OracleStatLedger />
                )}
                <RulesSection chain={marketChain} />
              </div>

              <aside className="oracle-detail-right">
                <OracleSummaryModules market={displayMarket as Market} />
                {marketDetail.atoms?.length ? (
                  <CombiTradePanel
                    market={selectedCreatedMarket}
                    atoms={marketDetail.atoms}
                    marketTitle={marketDetail.title}
                    onBetConfirmed={handleBetConfirmed}
                  />
                ) : (
                  <ProbabilityInputCard market={selectedMarket as Market} />
                )}
                <RelatedMarkets />
              </aside>
            </section>
          </>
        ) : (
          <NoMarketsAvailable
            message={
              indexedStatus === "loading"
                ? "loading indexed market"
                : indexedStatus === "error"
                  ? indexedError
                  : "no markets available"
            }
          />
        )}
      </main>
    </div>
  );
}

function NoMarketsAvailable({ message = "no markets available" }: { message?: string }) {
  return (
    <section className="grid min-h-[44vh] place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-8 text-center shadow-panel">
      <p className="text-lg font-black lowercase text-slate-100">{message}</p>
    </section>
  );
}

function MarketLifecyclePanel({ market }: { market: CreatedMarket }) {
  const chain = getChainConfig(market.onchain.chainId);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const phase = getLifecyclePhase(market.lifecycle, now);
  const phaseLabel =
    phase === "trading"
      ? "Trading open"
      : phase === "event"
        ? "Event running"
        : phase === "buffer"
          ? "Resolution buffer"
          : "Resolver ready";
  const deposit = BigInt(market.lifecycle.creationDepositWei || "0");

  return (
    <section className="mt-5 rounded-2xl border border-white/8 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-white">Market timing</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            The resolver bot uses this schedule before it asks UMA to settle the combinatorial outcome vector.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[10px] font-black uppercase text-amber-100">
          <Clock className="h-3.5 w-3.5" />
          {phaseLabel}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/7 bg-[#0b1219] p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">Trading closes</p>
          <p className="mt-1 text-sm font-black text-white">{formatLifecycleDate(market.lifecycle.tradingEndTime)}</p>
        </div>
        <div className="rounded-xl border border-white/7 bg-[#0b1219] p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">Event completes</p>
          <p className="mt-1 text-sm font-black text-white">{formatLifecycleDate(market.lifecycle.eventOccurrenceTime)}</p>
        </div>
        <div className="rounded-xl border border-white/7 bg-[#0b1219] p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">Bot may resolve</p>
          <p className="mt-1 text-sm font-black text-white">{formatLifecycleDate(market.lifecycle.resolutionTime)}</p>
          <p className="mt-2 text-[11px] text-slate-500">{market.lifecycle.resolutionBufferMinutes} minute buffer</p>
        </div>
        <div className="rounded-xl border border-white/7 bg-[#0b1219] p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">Creation deposit</p>
          <p className="mt-1 text-sm font-black text-white">
            {deposit > 0n ? `${deposit.toString()} wei` : "Not required"}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            {deposit > 0n ? `Refunded on clean ${chain.shortName} resolution.` : `${chain.shortName} currently has no deposit configured.`}
          </p>
        </div>
      </div>
    </section>
  );
}

export function AtomList({ market, onChange }: { market: CreatedMarket; onChange: (market: CreatedMarket) => void }) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const chain = getChainConfig(market.onchain.chainId);
  const publicClient = usePublicClient({ chainId: chain.chainId });
  const isLiveEvmChain = isLiveNoMarketChain(chain);
  const isPublicLive = isLiveEvmChain && isPublicNoMarketChain(chain);
  const [materializeStatus, setMaterializeStatus] = useState<"idle" | "loading" | "done" | "error">(
    market.onchain.materialized ? "done" : "idle"
  );
  const [materializeMessage, setMaterializeMessage] = useState("");

  async function materializeMarket() {
    setMaterializeStatus("loading");
    setMaterializeMessage("");
    try {
      if (!isLiveEvmChain) {
        throw new Error(chain.setupMessage || `${chain.name} beta adapter is scaffolded but not configured for live market creation yet.`);
      }
      const writeChain = getNoMarketWriteChain(chain);
      if (!writeChain || !publicClient) {
        throw new Error(`${chain.name} wallet/RPC client is not available yet.`);
      }
      const lifecycle = normalizeMarketLifecycle(
        {
          ...market.lifecycle,
          creationDepositWei: getCreationDepositWeiForChain(chain.id).toString()
        },
        market.createdAt,
        chain.id
      );
      const metadata = buildOnchainMarketMetadata({ title: market.title, atoms: market.atoms, lifecycle, visual: market.visual });
      if (isPublicLive) {
        const contract = requireNoMarketContractAddress(chain);
        const hash = supportsTimedMarketCreation(chain.id)
          ? await writeContractAsync({
              address: contract,
              abi: arcNoMarketAbi,
              functionName: "createTimedMarket",
              args: [
                market.title,
                metadata,
                market.atoms.length,
                lifecycleToUnixSeconds(lifecycle.tradingEndTime),
                lifecycleToUnixSeconds(lifecycle.eventOccurrenceTime),
                BigInt(Math.floor(lifecycle.resolutionBufferMinutes * 60))
              ],
              value: BigInt(lifecycle.creationDepositWei || "0"),
              chain: writeChain,
              account: address
            })
          : await writeContractAsync({
              address: contract,
              abi: arcNoMarketAbi,
              functionName: "createMarket",
              args: [market.title, metadata, market.atoms.length],
              chain: writeChain,
              account: address
            });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        const createdLog = receipt?.logs
          .map((log) => {
            try {
              const rawLog = log as unknown as { data: Hex; topics: [Hex, ...Hex[]] };
              return decodeEventLog({ abi: arcNoMarketAbi, data: rawLog.data, topics: rawLog.topics });
            } catch {
              return undefined;
            }
          })
          .find((event: any) => event?.eventName === "MarketCreated") as any;
        const updated = {
          ...market,
          lifecycle,
          endDate: formatLifecycleDate(lifecycle.tradingEndTime),
          onchain: {
            ...market.onchain,
            chainId: chain.id,
            marketId: createdLog?.eventName === "MarketCreated" ? String(createdLog.args.marketId) : market.onchain.marketId,
            contract,
            creator: address || "",
            materialized: true
          }
        };
        onChange(updated);
        setMaterializeStatus("done");
        setMaterializeMessage(`Submitted to ${chain.name}: ${hash}`);
        return;
      }
      const contract = requireNoMarketContractAddress(chain);
      const hash = await writeContractAsync({
        address: contract,
        abi: noMarketAbi,
        functionName: "createMarket",
        args: [market.title, metadata, market.atoms.length],
        chain: writeChain,
        account: address
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const createdLog = receipt?.logs
        .map((log) => {
          try {
            const rawLog = log as unknown as { data: Hex; topics: [Hex, ...Hex[]] };
            return decodeEventLog({ abi: noMarketAbi, data: rawLog.data, topics: rawLog.topics });
          } catch {
            return undefined;
          }
        })
        .find((event: any) => event?.eventName === "MarketCreated") as any;
      const updated = {
        ...market,
        lifecycle,
        endDate: formatLifecycleDate(lifecycle.tradingEndTime),
        onchain: {
          ...market.onchain,
          chainId: chain.id,
          marketId: createdLog?.eventName === "MarketCreated" ? String(createdLog.args.marketId) : market.onchain.marketId,
          contract,
          creator: address || "",
          materialized: true
        }
      };
      onChange(updated);
      setMaterializeStatus("done");
      setMaterializeMessage(`Submitted to ${chain.name}: ${hash}`);
    } catch (error) {
      setMaterializeStatus("error");
      setMaterializeMessage(error instanceof Error ? error.message : `Unable to create market on ${chain.name}.`);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-white/8 bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-white">Market atoms</h2>
        <span className="rounded-full border border-blue-400/20 bg-blue-400/8 px-2 py-1 text-[11px] font-black text-blue-200">
          {market.atoms.length} atoms
        </span>
      </div>
      <div className="mt-3 rounded-xl border border-blue-400/15 bg-blue-400/8 p-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-blue-300">{chain.shortName} status</p>
        {market.onchain.materialized ? (
          <p className="mt-1 text-xs font-bold leading-5 text-emerald-300">
            This market is live on {chain.name} through the configured NoMarket contract.
          </p>
        ) : (
          <p className="mt-2 text-[11px] leading-5 text-amber-200/80">
            {isLiveEvmChain ? "This market needs an EVM contract market before bets can be placed." : chain.setupMessage}
          </p>
        )}
        {!market.onchain.materialized && (
          <button
            type="button"
            onClick={materializeMarket}
            disabled={materializeStatus === "loading" || !isLiveEvmChain}
            className="mt-3 h-9 rounded-lg bg-blue-500 px-3 text-xs font-black text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {materializeStatus === "loading" ? "Creating..." : `Create on ${chain.shortName}`}
          </button>
        )}
        {materializeMessage && (
          <p className={materializeStatus === "error" ? "mt-2 text-xs leading-5 text-red-300" : "mt-2 break-all text-xs leading-5 text-slate-400"}>
            {materializeMessage}
          </p>
        )}
      </div>
      <div className="mt-3 grid gap-2">
        {market.atoms.map((atom, index) => (
          <div key={`${atom.description}-${index}`} className="rounded-xl border border-white/7 bg-[#0b1219] p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-600">Atom {index}</p>
                <p className="mt-1 text-sm font-bold text-slate-100">{atom.description}</p>
              </div>
              <span className="rounded-lg bg-white/[0.04] px-2 py-1 text-[11px] font-bold text-slate-400">
                UMA resolver
              </span>
            </div>
            <div className="mt-3 rounded-lg border border-blue-400/15 bg-blue-400/8 p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-blue-300">Resolution rule</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-200">{describeUmaRule(atom.uma)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BetHistory({ market, onVolumeChange }: { market: CreatedMarket; onVolumeChange?: (volume: string, totalStaked: bigint) => void }) {
  const { address } = useAccount();
  const chain = getChainConfig(market.onchain.chainId);
  const publicClient = usePublicClient({ chainId: chain.chainId });
  const isLiveEvmChain = isLiveNoMarketChain(chain);
  const isPublicLive = isLiveEvmChain && isPublicNoMarketChain(chain);
  const [bets, setBets] = useState<BetHistoryItem[]>([]);
  const [resolutionState, setResolutionState] = useState<ResolutionHistoryState | undefined>();
  const [historyTab, setHistoryTab] = useState<"personal" | "general">("personal");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function refreshHistory() {
      if (!isLiveEvmChain) {
        setBets([]);
        setResolutionState(undefined);
        setStatus("idle");
        setMessage(chain.setupMessage || `${chain.name} history will be available after the beta adapter is deployed.`);
        onVolumeChange?.(formatMarketVolume(0n, chain.nativeCurrency), 0n);
        return;
      }
      if (!market.onchain.materialized || !market.onchain.marketId) {
        setBets([]);
        setResolutionState(undefined);
        onVolumeChange?.(formatMarketVolume(0n, chain.nativeCurrency), 0n);
        return;
      }
      try {
        setStatus("loading");
        if (chain.subgraphUrl) {
          const [subgraphBets, nextResolutionState] = await Promise.all([
            fetchSubgraphBetHistory(chain.subgraphUrl, market.onchain.marketId, isPublicLive).catch(async (error) => {
              if (!publicClient) throw error;
              return fetchRpcBetHistory({ publicClient, market, isPublicLive });
            }),
            fetchSubgraphResolutionState(chain.subgraphUrl, market.onchain.marketId).catch(async () =>
              publicClient ? fetchRpcResolutionState({ publicClient, market }).catch(() => undefined) : undefined
            )
          ]);
          if (!cancelled) {
            setBets(subgraphBets);
            setResolutionState(nextResolutionState);
            setStatus("idle");
            setMessage("");
            const total = subgraphBets.reduce((sum, bet) => sum + bet.publicStake, 0n);
            onVolumeChange?.(formatMarketVolume(total, chain.nativeCurrency), total);
          }
          return;
        }
        if (!publicClient) {
          setBets([]);
          setResolutionState(undefined);
          setStatus("idle");
          setMessage(`${chain.name} RPC client is not available yet.`);
          return;
        }
        const decoded = await fetchRpcBetHistory({ publicClient, market, isPublicLive });
        if (!cancelled) {
          setBets(decoded);
          setResolutionState(await fetchRpcResolutionState({ publicClient, market }).catch(() => undefined));
          setStatus("idle");
          setMessage("");
          const total = decoded.reduce((sum, bet) => sum + bet.publicStake, 0n);
          onVolumeChange?.(formatMarketVolume(total, chain.nativeCurrency), total);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : `Unable to load ${chain.name} bet history.`);
        }
      }
    }
    void refreshHistory();
    const timer = setInterval(refreshHistory, 12_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [chain, chain.name, chain.nativeCurrency, chain.setupMessage, chain.subgraphUrl, isLiveEvmChain, isPublicLive, market.onchain.marketId, market.onchain.materialized, onVolumeChange, publicClient]);

  const personalBets = useMemo(
    () => bets.filter((bet) => address && bet.bettor.toLowerCase() === address.toLowerCase()),
    [address, bets]
  );
  const visibleBets = historyTab === "personal" ? personalBets : bets;
  const totalStaked = bets.reduce((sum, bet) => sum + bet.publicStake, 0n);
  const personalStaked = personalBets.reduce((sum, bet) => sum + bet.publicStake, 0n);
  const outcomeText = resolutionState?.outcomeVector !== undefined
    ? `Outcome vector ${resolutionState.outcomeVector ?? "resolved"}`
    : resolutionState?.assertionId
      ? "UMA result pending"
      : "Awaiting outcome";

  return (
    <section className="mt-5 rounded-2xl border border-white/8 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-white">Bet history</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            See your old placed bets separately from the full NoMarket market history. Outcomes update after UMA resolution.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">Total staked</p>
          <p className="mt-1 text-sm font-black text-blue-300">{formatMarketVolume(totalStaked, chain.nativeCurrency)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/7 bg-[#0b1219] p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">Personal stake</p>
          <p className="mt-1 text-sm font-black text-white">{formatMarketVolume(personalStaked, chain.nativeCurrency)}</p>
        </div>
        <div className="rounded-xl border border-white/7 bg-[#0b1219] p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">Market result</p>
          <p className="mt-1 text-sm font-black text-white">{outcomeText}</p>
          <p className="mt-2 font-mono text-[11px] text-slate-500">{formatOutcomeVectorBinary(resolutionState?.outcomeVector, market.atoms.length)}</p>
        </div>
        <div className="rounded-xl border border-white/7 bg-[#0b1219] p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">History source</p>
          <p className="mt-1 text-sm font-black text-white">{chain.subgraphUrl ? "Subgraph indexed" : "RPC logs"}</p>
          <p className="mt-2 text-[11px] text-slate-500">{chain.shortName} privacy rules apply.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setHistoryTab("personal")}
          aria-pressed={historyTab === "personal"}
          className={`h-8 rounded-full px-3 text-[11px] font-black transition ${historyTab === "personal" ? "bg-blue-500 text-white" : "bg-white/[0.04] text-slate-500 hover:bg-white/[0.08] hover:text-slate-200"}`}
        >
          Personal History ({personalBets.length})
        </button>
        <button
          type="button"
          onClick={() => setHistoryTab("general")}
          aria-pressed={historyTab === "general"}
          className={`h-8 rounded-full px-3 text-[11px] font-black transition ${historyTab === "general" ? "bg-blue-500 text-white" : "bg-white/[0.04] text-slate-500 hover:bg-white/[0.08] hover:text-slate-200"}`}
        >
          NoMarket General History ({bets.length})
        </button>
      </div>

      {!isLiveEvmChain ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-5 text-center">
          <p className="text-xs font-bold text-slate-500">{message || `${chain.name} history is setup-pending.`}</p>
        </div>
      ) : !market.onchain.materialized ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-5 text-center">
          <p className="text-xs font-bold text-slate-500">Create this market on {chain.name} to show confirmed bets.</p>
        </div>
      ) : status === "loading" && bets.length === 0 ? (
        <div className="mt-4 rounded-xl border border-white/7 bg-[#0b1219] p-5 text-center">
          <p className="text-xs font-bold text-slate-500">Loading confirmed bets...</p>
        </div>
      ) : historyTab === "personal" && !address ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-5 text-center">
          <p className="text-xs font-bold text-slate-500">Connect your wallet to see your old placed bets on this market.</p>
        </div>
      ) : visibleBets.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-5 text-center">
          <p className="text-xs font-bold text-slate-500">
            {historyTab === "personal" ? "No confirmed bets from your wallet yet." : "No confirmed bets yet."}
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-white/7">
          <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/7 bg-white/[0.025] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-600 sm:grid-cols-[1.1fr_0.65fr_1fr_auto]">
            <span>Wallet</span>
            <span className="text-right sm:text-left">Stake</span>
            <span className="hidden sm:block">Position / outcome</span>
            <span className="hidden text-right sm:block">Result</span>
          </div>
          <div className="divide-y divide-white/7">
            {visibleBets.map((bet) => {
              const result = getBetResultLabel({ bet, resolution: resolutionState, isPublicLive });
              return (
                <div key={`${bet.transactionHash}-${bet.betId}`} className="grid grid-cols-[1fr_auto] gap-3 bg-[#0b1219] px-3 py-3 sm:grid-cols-[1.1fr_0.65fr_1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-slate-100">{shortAddress(bet.bettor)}</p>
                    <p className="mt-1 break-all text-[10px] text-slate-600">
                      Bet #{bet.betId.toString()} / {formatBetTimestamp(bet.blockTimestamp)}
                    </p>
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="text-xs font-black text-white">{formatEther(bet.publicStake)} {chain.nativeCurrency}</p>
                    <p className="mt-1 text-[10px] text-slate-600">{bet.publicStake.toString()} wei</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs font-black text-blue-300">{isPublicLive ? `${chain.shortName} public expression` : "Private encrypted position"}</p>
                    <p className="mt-1 line-clamp-2 text-[10px] text-slate-500">{getBetPositionSummary(bet, isPublicLive)}</p>
                    <p className="mt-1 break-all font-mono text-[10px] text-slate-600">
                      {isPublicLive
                        ? `mask ${bet.outcomeMask?.toString() || "0"} / care ${bet.careMask?.toString() || "0"}`
                        : shortAddress(bet.encryptedOutcomeMaskHandle || "0x0000000000000000000000000000000000000000")}
                    </p>
                  </div>
                  <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:justify-end">
                    <span className={`rounded-lg px-2 py-1 text-[10px] font-black ${betResultClass(result.tone)}`}>{result.label}</span>
                    <span className="rounded-lg bg-emerald-500/15 px-2 py-1 text-[10px] font-black text-emerald-300">Bet confirmed</span>
                    <span className="font-mono text-[10px] text-slate-600">{shortAddress(bet.transactionHash)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {status === "error" && <p className="mt-3 text-xs font-bold leading-5 text-amber-200">{message}</p>}
    </section>
  );
}

export function UmaResolutionPanel({ market, onChange }: { market: CreatedMarket; onChange: (market: CreatedMarket) => void }) {
  const chain = getChainConfig(market.onchain.chainId);
  const publicClient = usePublicClient({ chainId: chain.chainId });
  const isLiveEvmChain = isLiveNoMarketChain(chain);
  const isPublicLive = isLiveEvmChain && isPublicNoMarketChain(chain);
  const marketId = market.onchain.marketId ? BigInt(market.onchain.marketId) : undefined;
  const contractAddress = getNoMarketContractAddress(chain);
  const [indexedState, setIndexedState] = useState<ResolutionHistoryState | undefined>();
  const [botMessage, setBotMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  const marketRead = useReadContract({
    address: contractAddress,
    abi: isPublicLive ? arcNoMarketAbi : noMarketAbi,
    functionName: "markets",
    args: marketId ? [marketId] : undefined,
    query: {
      enabled: Boolean(isLiveEvmChain && marketId && contractAddress)
    }
  });

  const chainMarket = marketRead.data as any;
  const chainAssertionId = (isPublicLive ? chainMarket?.[6] : chainMarket?.[9]) as string | undefined;
  const chainResolved = Boolean(isPublicLive ? chainMarket?.[4] : chainMarket?.[5]);
  const chainOutcomeVectorRaw = isPublicLive ? chainMarket?.[5] : chainMarket?.[6];
  const chainOutcomeVector = chainOutcomeVectorRaw !== undefined ? Number(chainOutcomeVectorRaw) : undefined;
  const activeAssertionId =
    indexedState?.assertionId ||
    market.resolution.assertionId ||
    (chainAssertionId && !/^0x0+$/.test(chainAssertionId) ? chainAssertionId : "");
  const resolved = Boolean(chainResolved || indexedState?.resolved || market.resolution.status === "resolved");
  const displayedVector = indexedState?.outcomeVector ?? chainOutcomeVector ?? market.resolution.outcomeVector;
  const proposalTx = indexedState?.proposal?.transactionHash || market.resolution.proposalTx;
  const resolvedTx = indexedState?.resolution?.transactionHash || market.resolution.resolvedTx || market.resolution.settlementTx;
  const resolutionReady = isResolutionReady(market.lifecycle, now);
  const botStatus = resolved ? "resolved" : activeAssertionId ? "proposed" : market.onchain.materialized ? (resolutionReady ? "watching" : "scheduled") : "waiting";
  const botStatusLabel =
    botStatus === "resolved"
      ? "Resolved"
      : botStatus === "proposed"
        ? "UMA window"
        : botStatus === "watching"
          ? "Bot watching"
          : botStatus === "scheduled"
            ? "Scheduled"
            : "Waiting for chain";

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function refreshResolution() {
      if (!isLiveEvmChain || !market.onchain.materialized || !market.onchain.marketId) {
        setIndexedState(undefined);
        return;
      }

      try {
        const nextState = chain.subgraphUrl
          ? await fetchSubgraphResolutionState(chain.subgraphUrl, market.onchain.marketId)
          : publicClient
            ? await fetchRpcResolutionState({ publicClient, market })
            : undefined;
        if (!cancelled) {
          setIndexedState(nextState);
        }
      } catch {
        if (!cancelled) {
          setIndexedState(undefined);
        }
      }
    }

    void refreshResolution();
    const timer = setInterval(refreshResolution, 15_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [chain.subgraphUrl, isLiveEvmChain, market, market.onchain.marketId, market.onchain.materialized, publicClient]);

  useEffect(() => {
    if (!activeAssertionId && !resolved) return;
    const nextStatus = resolved ? "resolved" : "proposed";
    if (
      market.resolution.status === nextStatus &&
      market.resolution.assertionId === activeAssertionId &&
      market.resolution.outcomeVector === displayedVector
    ) {
      return;
    }
    onChange({
      ...market,
      resolution: {
        ...market.resolution,
        status: nextStatus,
        assertionId: activeAssertionId || market.resolution.assertionId,
        outcomeVector: displayedVector,
        proposalTx,
        resolvedTx,
        updatedAt: new Date().toISOString()
      }
    });
  }, [activeAssertionId, displayedVector, market, onChange, proposalTx, resolved, resolvedTx]);

  useEffect(() => {
    let cancelled = false;
    async function queueBot() {
      if (!isLiveEvmChain || !market.onchain.materialized || !market.onchain.marketId || resolved) {
        return;
      }
      if (!activeAssertionId && !isResolutionReady(market.lifecycle)) {
        setBotMessage(`Resolver bot is scheduled for ${formatLifecycleDate(market.lifecycle.resolutionTime)}.`);
        return;
      }
      try {
        const response = await fetch("/api/uma-bot/queue-resolution", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            chainId: market.onchain.chainId,
            market: {
              id: market.id,
              title: market.title,
              atoms: market.atoms,
              lifecycle: market.lifecycle,
              onchain: market.onchain
            },
            assertionId: activeAssertionId || undefined
          })
        });
        const data = (await response.json()) as { status?: string; message?: string };
        if (!cancelled) {
          setBotMessage(data.message || (response.ok ? "Resolver bot is monitoring this market." : ""));
        }
      } catch {
        if (!cancelled) setBotMessage("Resolver bot is monitoring this market.");
      }
    }

    void queueBot();
    const timer = setInterval(queueBot, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeAssertionId, isLiveEvmChain, market, market.onchain.chainId, market.onchain.materialized, market.onchain.marketId, resolved]);

  return null;
}

export function MarketHeader({ market, marketId, chainName }: { market: MarketDetail; marketId: string; chainName: string }) {
  const metaItems = [market.category, market.volume, market.endDate].filter(Boolean);
  return (
    <section className="rounded-2xl border border-white/8 bg-card p-4 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
            {metaItems.map((item, index) => (
              <span key={item} className="inline-flex items-center gap-2">
                {index > 0 && <span className="h-1 w-1 rounded-full bg-slate-700" />}
                {item}
              </span>
            ))}
          </div>
          <h1 className="mt-3 max-w-3xl text-2xl font-black leading-tight text-white sm:text-3xl">{market.title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-slate-500">
          <span className="hidden text-xs font-bold sm:inline">{market.source} / {chainName}</span>
          <Share2 className="h-4 w-4" />
          <Bookmark className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-6 divide-y divide-white/7 rounded-xl border border-white/7 bg-[#0b1219]">
        {market.outcomes.map((outcome, index) => (
          <OutcomeRow key={outcome.label} outcome={outcome} marketId={marketId} showButtons={index < 2} />
        ))}
      </div>
    </section>
  );
}

export function OutcomeRow({ outcome, marketId, showButtons }: { outcome: Outcome; marketId: string; showButtons?: boolean }) {
  return (
    <div className="grid gap-3 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
      <div>
        <p className="text-sm font-black text-white">{outcome.label}</p>
        <p className="mt-1 text-[11px] text-slate-500">Market outcome</p>
      </div>
      <div className="flex items-end gap-2 sm:justify-end">
        <span className="text-2xl font-black text-slate-100">{outcome.probability}%</span>
        <span className={outcome.tone === "no" ? "pb-1 text-[11px] font-bold text-red-400" : "pb-1 text-[11px] font-bold text-emerald-400"}>
          {outcome.probability}c
        </span>
      </div>
      {showButtons && (
        <div className="grid grid-cols-2 gap-2 sm:w-48">
          <Link href={`/market/${marketId}?side=yes`} className="grid h-9 place-items-center rounded-lg bg-emerald-500/20 text-xs font-black text-emerald-300 hover:bg-emerald-500/28">Buy Yes</Link>
          <Link href={`/market/${marketId}?side=no`} className="grid h-9 place-items-center rounded-lg bg-red-500/18 text-xs font-black text-red-300 hover:bg-red-500/26">Buy No</Link>
        </div>
      )}
    </div>
  );
}

export function RulesSection({ chain }: { chain: ReturnType<typeof getChainConfig> }) {
  const isZama = chain.id === "zama";
  const privacyText = isZama
    ? "Bet expression data is encrypted with Zama FHE while the wallet transaction still shows the public stake and gas."
    : `${chain.shortName} beta records the public expression masks and stake supported by that network.`;

  return (
    <section className="mt-5 rounded-2xl border border-white/8 bg-card p-4">
      <div className="flex gap-5 border-b border-white/7 pb-3 text-xs font-black">
        <button className="text-white">Rules</button>
        <button className="text-slate-500 hover:text-slate-300">Market Context</button>
      </div>
      <div className="mt-4 space-y-3 text-xs leading-6 text-slate-300">
        <p>This market runs on {chain.name} and resolves through the automated UMA optimistic resolver bot.</p>
        <p>
          Bets can be expressed as Boolean combinations across atoms. {privacyText}
          <button className="ml-1 font-bold text-blue-300 hover:text-blue-200">Show more</button>
        </p>
      </div>
    </section>
  );
}

export function FAQAccordion() {
  return (
    <section className="mt-5 rounded-2xl border border-white/8 bg-card p-4">
      <h2 className="text-sm font-black text-white">Frequently Asked Questions</h2>
      <div className="mt-3 divide-y divide-white/7">
        {faqItems.map((item, index) => (
          <details key={item.question} className="group py-3" open={index === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-black text-slate-100">
              {item.question}
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-xs leading-5 text-slate-400">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildInitialLmsrState(marketTitle: string, atomCount: number) {
  const slots = 1 << Math.min(atomCount, 8);
  return Array.from({ length: slots }, (_, slot) => 20 + (hashString(`${marketTitle}:${slot}`) % 80));
}

function mergeMinterms(minterms: Minterm[]) {
  return minterms.reduce(
    (current, minterm) => ({
      outcomeMask: current.outcomeMask | minterm.outcomeMask,
      careMask: current.careMask | minterm.careMask
    }),
    { outcomeMask: 0, careMask: 0 }
  );
}

export function CombiTradePanel({
  atoms,
  market,
  marketTitle,
  onBetConfirmed
}: {
  atoms: CreatedAtom[];
  market?: CreatedMarket;
  marketTitle: string;
  onBetConfirmed?: (stakeWei: bigint) => void;
}) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { writeContractAsync, data: txHash } = useWriteContract();
  const encrypt = useEncrypt();
  const chain = getChainConfig(market?.onchain.chainId || "zama");
  const isLiveEvmChain = isLiveNoMarketChain(chain);
  const isPublicLive = isLiveEvmChain && isPublicNoMarketChain(chain);
  const receipt = useWaitForTransactionReceipt({ hash: txHash });
  const [amount, setAmount] = useState("0.1");
  const [minterms, setMinterms] = useState<Minterm[]>([]);
  const [preview, setPreview] = useState("No expression selected");
  const [error, setError] = useState("");
  const [signature, setSignature] = useState("");
  const [status, setStatus] = useState<"idle" | "encrypting" | "signing" | "submitted">("idle");
  const [submittedStakeWei, setSubmittedStakeWei] = useState<bigint | undefined>();
  const [lastConfirmedHash, setLastConfirmedHash] = useState("");
  const [now, setNow] = useState(Date.now());
  const q = useMemo(() => buildInitialLmsrState(marketTitle, atoms.length), [atoms.length, marketTitle]);
  const atomInputs = useMemo(() => atoms.map((atom) => ({ description: atom.description })), [atoms]);
  const probability = useMemo(() => expressionProbability(minterms, q, 120), [minterms, q]);
  const cost = useMemo(() => costOfBet(minterms, q, 120, Number(amount || 0)), [amount, minterms, q]);
  const canBuild = minterms.length > 0 && Number(amount) > 0;
  const marketReady = Boolean(isLiveEvmChain && market?.onchain.materialized && market.onchain.marketId);
  const tradingOpen = !market || isTradingOpen(market.lifecycle, now);
  const lifecyclePhase = getLifecyclePhase(market?.lifecycle, now);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const side = typeof router.query.side === "string" ? router.query.side : "";
    if (side !== "yes" && side !== "no") return;
    const quickMinterm = side === "yes" ? { outcomeMask: 1, careMask: 1 } : { outcomeMask: 0, careMask: 1 };
    setMinterms([quickMinterm]);
    setPreview(`${side === "yes" ? "YES" : "NO"} on ${atoms[0]?.description || "Atom 0"}`);
    setError("");
    setSignature("");
  }, [atoms, router.query.side]);

  useEffect(() => {
    if (receipt.isSuccess && txHash && txHash !== lastConfirmedHash) {
      setSignature(txHash);
      setStatus("submitted");
      if (submittedStakeWei) {
        onBetConfirmed?.(submittedStakeWei);
      }
      setLastConfirmedHash(txHash);
    }
  }, [lastConfirmedHash, onBetConfirmed, receipt.isSuccess, submittedStakeWei, txHash]);

  function chooseBinarySide(side: "yes" | "no") {
    const quickMinterm = side === "yes" ? { outcomeMask: 1, careMask: 1 } : { outcomeMask: 0, careMask: 1 };
    setMinterms([quickMinterm]);
    setPreview(`${side === "yes" ? "YES" : "NO"} on ${atoms[0]?.description || "Atom 0"}`);
    setError("");
    setSignature("");
  }

  async function submitOnchainBet() {
    setError("");
    setSignature("");
    if (!isLiveEvmChain) {
      setError(chain.setupMessage || `${chain.name} betting is setup-pending for the public beta.`);
      return;
    }
    if (!marketReady || !market) {
      setError(`Create this market on ${chain.name} before placing a bet.`);
      return;
    }
    if (!isTradingOpen(market.lifecycle)) {
      setError("Trading is closed for this market. The resolver bot will handle truth after the event buffer.");
      return;
    }
    if (!isConnected || !address) {
      setError("Connect an EVM wallet before buying into this market.");
      return;
    }
    const stakeEth = Number(amount);
    if (!Number.isFinite(stakeEth) || stakeEth <= 0) {
      setError(`Enter a stake greater than 0 ${chain.nativeCurrency}.`);
      return;
    }

    try {
      const stakeWei = parseEther(amount);
      setSubmittedStakeWei(stakeWei);
      const expression = mergeMinterms(minterms);
      const writeChain = getNoMarketWriteChain(chain);
      if (!writeChain) {
        throw new Error(`${chain.name} wallet network is not configured.`);
      }
      if (isPublicLive) {
        setStatus("signing");
        const hash = await writeContractAsync({
          address: requireNoMarketContractAddress(chain),
          abi: arcNoMarketAbi,
          functionName: "placeBet",
          args: [BigInt(market.onchain.marketId), BigInt(expression.outcomeMask), BigInt(expression.careMask), preview],
          value: stakeWei,
          chain: writeChain,
          account: address
        });
        setSignature(hash);
        setStatus("submitted");
        return;
      }
      setStatus("encrypting");
      const encrypted = await encrypt.mutateAsync({
        values: [
          { value: stakeWei, type: "euint64" },
          { value: BigInt(expression.outcomeMask), type: "euint16" },
          { value: BigInt(expression.careMask), type: "euint16" }
        ],
        contractAddress: requireNoMarketContractAddress(chain),
        userAddress: address
      });

      setStatus("signing");
      const hash = await writeContractAsync({
        address: requireNoMarketContractAddress(chain),
        abi: noMarketAbi,
        functionName: "placeBet",
        args: [
          BigInt(market.onchain.marketId),
          bytesToHex(encrypted.handles[0]!),
          bytesToHex(encrypted.handles[1]!),
          bytesToHex(encrypted.handles[2]!),
          bytesToHex(encrypted.inputProof)
        ],
        value: stakeWei,
        chain: writeChain,
        account: address
      });
      setSignature(hash);
      setStatus("submitted");
    } catch (error) {
      setStatus("idle");
      setError(error instanceof Error ? error.message : `Unable to submit bet on ${chain.name}.`);
    }
  }

  return (
    <section className="rounded-2xl border border-white/8 bg-card p-4 shadow-panel">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-white">Build combination bet</h2>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">Choose TRUE, FALSE, or DON'T CARE for each atom. {privacyLabel(chain.privacyLevel)}.</p>
        </div>
        <Lock className="h-4 w-4 shrink-0 text-blue-300" />
      </div>

      <ExpressionBuilderUI
        embedded
        atoms={atomInputs}
        privacyNote={
          isPublicLive
            ? `Public odds use LMSR aggregates. ${chain.shortName} records the expression masks and stake supported by this beta network.`
            : "Public odds use LMSR aggregates. Your exact expression is encrypted with Zama FHE."
        }
        onChange={(nextMinterms, description) => {
          setMinterms(nextMinterms);
          setPreview(description);
          setError("");
          setSignature("");
        }}
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => chooseBinarySide("yes")} className="h-9 rounded-lg bg-emerald-500/18 text-xs font-black text-emerald-300 hover:bg-emerald-500/25">Buy Yes</button>
        <button type="button" onClick={() => chooseBinarySide("no")} className="h-9 rounded-lg bg-red-500/16 text-xs font-black text-red-300 hover:bg-red-500/24">Buy No</button>
      </div>

      <div className="mt-3 rounded-xl border border-white/7 bg-[#0b1219] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">Wallet</p>
            <p className={isConnected ? "mt-1 text-xs font-bold text-emerald-300" : "mt-1 text-xs font-bold text-amber-200"}>
              {address ? shortAddress(address) : "Connect to sign trades"}
            </p>
          </div>
          <WalletConnect />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/7 bg-[#0b1219] p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">Implied probability</p>
          <p className="mt-1 text-xl font-black text-blue-300">{(probability * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-white/7 bg-[#0b1219] p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">Expected cost</p>
          <p className="mt-1 text-xl font-black text-white">{cost.toFixed(3)} {chain.nativeCurrency}</p>
        </div>
      </div>

      <label className="mt-4 block text-xs font-black text-slate-400" htmlFor="combi-stake">Stake</label>
      <div className="mt-2 flex rounded-xl border border-white/8 bg-[#0b1219]">
        <input id="combi-stake" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-bold text-white outline-none" />
        <span className="border-l border-white/8 px-3 py-3 text-sm font-black text-slate-500">{chain.nativeCurrency}</span>
      </div>

      <div className="mt-4 rounded-xl border border-blue-400/15 bg-blue-400/8 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-blue-300">Expression preview</p>
        <p className="mt-1 text-xs leading-5 text-slate-200">{preview}</p>
      </div>

      {!isLiveEvmChain && (
        <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs font-bold leading-5 text-amber-100">
          {chain.setupMessage || `${chain.name} live betting is setup-pending.`}
        </p>
      )}
      {!tradingOpen && (
        <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs font-bold leading-5 text-amber-100">
          Trading is closed. Current phase: {lifecyclePhase === "event" ? "event running" : lifecyclePhase === "buffer" ? "resolution buffer" : "resolver ready"}.
        </p>
      )}
      <button type="button" disabled={!isLiveEvmChain || !canBuild || !tradingOpen || status === "encrypting" || status === "signing"} onClick={submitOnchainBet} className="mt-4 h-11 w-full rounded-lg bg-blue-500 text-sm font-black text-white shadow-soft hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
        {status === "encrypting" ? "Encrypting with Zama FHE..." : status === "signing" ? "Sign transaction..." : status === "submitted" ? "Bet submitted" : tradingOpen ? `${isPublicLive ? "Submit public bet" : "Submit encrypted bet"} on ${chain.shortName}` : "Trading closed"}
      </button>
      {error && <p className="mt-3 text-xs font-bold leading-5 text-amber-200">{error}</p>}
      {signature && <p className="mt-3 break-all text-xs font-bold leading-5 text-emerald-300">Transaction: {signature}</p>}
      <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">
        Your wallet will show the {chain.nativeCurrency} stake plus network gas when this chain is live. Position privacy follows the selected adapter.
      </p>
    </section>
  );
}

export function TradePanel({ outcomes }: { outcomes: Outcome[] }) {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const yes = outcomes[0]?.probability ?? 19;
  const no = outcomes[1]?.probability ?? 81;
  const value = useMemo(() => Number(amount || 0).toLocaleString(undefined, { style: "currency", currency: "USD" }), [amount]);

  return (
    <section className="rounded-2xl border border-white/8 bg-card p-4 shadow-panel">
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setSide("yes")} className={`h-10 rounded-lg text-xs font-black ${side === "yes" ? "bg-emerald-500 text-white" : "bg-white/[0.04] text-emerald-300"}`}>Yes {yes}c</button>
        <button onClick={() => setSide("no")} className={`h-10 rounded-lg text-xs font-black ${side === "no" ? "bg-red-500 text-white" : "bg-white/[0.04] text-red-300"}`}>No {no}c</button>
      </div>
      <label className="mt-5 block text-xs font-black text-slate-400" htmlFor="trade-amount">Amount</label>
      <div className="mt-2 flex items-center rounded-xl border border-white/8 bg-[#0b1219] px-3">
        <span className="text-2xl font-black text-slate-500">$</span>
        <input id="trade-amount" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0" className="h-14 min-w-0 flex-1 bg-transparent text-right text-3xl font-black text-white outline-none placeholder:text-slate-700" />
      </div>
      <p className="mt-2 text-right text-[11px] text-slate-500">Estimated value: {value}</p>
      <button className="mt-4 h-11 w-full rounded-lg bg-blue-500 text-sm font-black text-white shadow-soft hover:bg-blue-400">Trade</button>
    </section>
  );
}

export function RelatedMarkets() {
  const [createdMarkets, setCreatedMarkets] = useState<CreatedMarket[]>([]);
  const [indexedMarkets, setIndexedMarkets] = useState<CreatedMarket[]>([]);
  const [activeTab, setActiveTab] = useState("All");
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
  const markets = useMemo(() => mergeIndexedAndLocalMarkets(indexedMarkets, createdMarkets), [createdMarkets, indexedMarkets]);
  const filteredMarkets = useMemo(
    () => markets.filter((market) => relatedMarketMatchesTab(market, activeTab)),
    [activeTab, markets]
  );
  return (
    <section className="rounded-2xl border border-white/8 bg-card p-4">
      <h2 className="text-sm font-black text-white">Related markets</h2>
      {markets.length > 0 ? (
        <>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {relatedTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`h-7 shrink-0 rounded-full px-3 text-[11px] font-black transition ${activeTab === tab ? "bg-blue-500 text-white" : "bg-white/[0.04] text-slate-500 hover:bg-white/[0.08] hover:text-slate-200"}`}
              >
                {tab}
              </button>
            ))}
          </div>
          {filteredMarkets.length > 0 ? (
            <div className="mt-3 space-y-3">
              {filteredMarkets.slice(0, 5).map((market) => (
                <Link key={market.id} href={`/market/${market.id}`} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-lg p-1 hover:bg-white/[0.03]">
                  <MarketVisualBadge market={market} size="sm" />
                  <span className="line-clamp-2 text-xs font-bold leading-4 text-slate-300">{market.title}</span>
                  <span className="text-xs font-black text-white">{market.probability}%</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-4 text-center">
              <p className="text-xs font-black lowercase text-slate-400">no {activeTab.toLowerCase()} markets yet</p>
            </div>
          )}
        </>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-5 text-center">
          <p className="text-xs font-black lowercase text-slate-400">no markets available</p>
        </div>
      )}
    </section>
  );
}
