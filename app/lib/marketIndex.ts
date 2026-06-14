import { formatEther } from "viem";
import { CHAIN_ORDER, getChainConfig, isChainId, type ChainConfig, type ChainId } from "./chains";
import { buildMarket } from "./mockMarkets";
import { type CreatedAtom, type CreatedMarket } from "./marketStorage";
import { createEmptyResolutionState } from "./resolution";
import { defaultUmaResolver } from "./switchboardOracle";
import {
  formatLifecycleDate,
  normalizeMarketLifecycle,
  parseOnchainMarketMetadata,
  type MarketLifecycle
} from "./marketLifecycle";
import { normalizeMarketVisual } from "./marketVisuals";

type IndexedMarketNode = {
  marketId: string;
  creator?: string;
  title?: string;
  metadata?: string;
  question?: string;
  atomCount?: string | number;
  resolved?: boolean;
  outcomeVector?: string;
  assertionId?: string;
  tradingEndTime?: string;
  eventOccurrenceTime?: string;
  resolutionTime?: string;
  creatorDeposit?: string;
  totalStake?: string;
  betCount?: string;
  createdAtTimestamp?: string;
  transactionHash?: string;
};

const PAGE_SIZE = 100;
const INDEXED_MARKET_PREFIX = "indexed";

const publicMarketsQuery = `
  query NoMarketPublicMarkets($first: Int!, $skip: Int!) {
    markets(first: $first, skip: $skip, orderBy: createdAtTimestamp, orderDirection: desc) {
      marketId
      creator
      title
      metadata
      atomCount
      resolved
      outcomeVector
      assertionId
      tradingEndTime
      eventOccurrenceTime
      resolutionTime
      creatorDeposit
      totalStake
      betCount
      createdAtTimestamp
      transactionHash
    }
  }
`;

const zamaMarketsQuery = `
  query NoMarketZamaMarkets($first: Int!, $skip: Int!) {
    markets(first: $first, skip: $skip, orderBy: createdAtTimestamp, orderDirection: desc) {
      marketId
      creator
      title
      question
      atomCount
      resolved
      outcomeVector
      assertionId
      totalStake
      betCount
      createdAtTimestamp
      transactionHash
    }
  }
`;

const publicLegacyMarketsQuery = `
  query NoMarketPublicLegacyMarkets($first: Int!, $skip: Int!) {
    markets(first: $first, skip: $skip, orderBy: createdAtTimestamp, orderDirection: desc) {
      marketId
      creator
      title
      atomCount
      resolved
      outcomeVector
      assertionId
      totalStake
      betCount
      createdAtTimestamp
      transactionHash
    }
  }
`;

const publicMarketQuery = `
  query NoMarketPublicMarket($marketId: BigInt!) {
    markets(where: { marketId: $marketId }, first: 1) {
      marketId
      creator
      title
      metadata
      atomCount
      resolved
      outcomeVector
      assertionId
      tradingEndTime
      eventOccurrenceTime
      resolutionTime
      creatorDeposit
      totalStake
      betCount
      createdAtTimestamp
      transactionHash
    }
  }
`;

const publicLegacyMarketQuery = `
  query NoMarketPublicLegacyMarket($marketId: BigInt!) {
    markets(where: { marketId: $marketId }, first: 1) {
      marketId
      creator
      title
      atomCount
      resolved
      outcomeVector
      assertionId
      totalStake
      betCount
      createdAtTimestamp
      transactionHash
    }
  }
`;

const zamaMarketQuery = `
  query NoMarketZamaMarket($marketId: BigInt!) {
    markets(where: { marketId: $marketId }, first: 1) {
      marketId
      creator
      title
      question
      atomCount
      resolved
      outcomeVector
      assertionId
      totalStake
      betCount
      createdAtTimestamp
      transactionHash
    }
  }
`;

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function timestampToIso(seconds: string | undefined) {
  const value = Number(seconds || 0);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return new Date(value * 1000).toISOString();
}

function lifecycleFromIndexedNode(node: IndexedMarketNode, chainId: ChainId): MarketLifecycle | undefined {
  const tradingEndTime = timestampToIso(node.tradingEndTime);
  const eventOccurrenceTime = timestampToIso(node.eventOccurrenceTime);
  const resolutionTime = timestampToIso(node.resolutionTime);
  if (!tradingEndTime || !eventOccurrenceTime || !resolutionTime) return undefined;

  const eventMs = Date.parse(eventOccurrenceTime);
  const resolutionMs = Date.parse(resolutionTime);
  const resolutionBufferMinutes = Math.max(1, Math.round((resolutionMs - eventMs) / 60_000));

  return normalizeMarketLifecycle(
    {
      tradingEndTime,
      eventOccurrenceTime,
      resolutionTime,
      resolutionBufferMinutes,
      creationDepositWei: node.creatorDeposit || "0"
    },
    undefined,
    chainId
  );
}

function formatIndexedVolume(totalStake: string | undefined, nativeCurrency: string) {
  try {
    const stake = BigInt(totalStake || "0");
    const formatted = formatEther(stake);
    const numeric = Number(formatted);
    const display = Number.isFinite(numeric)
      ? numeric.toLocaleString(undefined, { maximumFractionDigits: numeric >= 1 ? 4 : 8 })
      : formatted;
    return `${display} ${nativeCurrency}`;
  } catch {
    return `0 ${nativeCurrency}`;
  }
}

function inferCategory(title: string, atoms: CreatedAtom[]) {
  const text = [title, ...atoms.map((atom) => `${atom.description} ${atom.uma?.question || ""}`)].join(" ").toLowerCase();
  if (/\b(eth|btc|bitcoin|crypto|token|usd|solana|ethereum)\b/.test(text)) return "Crypto";
  if (/\b(match|wins?|goals?|league|football|soccer|basketball|tennis|team|friendly|fixture|regulation)\b/.test(text)) return "Sports";
  if (/\b(election|president|senate|congress|minister|policy|vote)\b/.test(text)) return "Politics";
  if (/\b(gdp|inflation|rates?|fed|cpi|macro|unemployment|index)\b/.test(text)) return "Economy";
  if (/\b(ai|launch|rollup|mainnet|protocol|software|tech)\b/.test(text)) return "Tech";
  return "Featured";
}

function buildFallbackAtoms(atomCount: string | number | undefined, title: string): CreatedAtom[] {
  const count = Math.max(2, Math.min(16, Number(atomCount || 2) || 2));
  return Array.from({ length: count }, (_, index) => ({
    description: `${title || "Market"} atom ${index + 1}`,
    resolver: "UMA Optimistic Oracle",
    uma: defaultUmaResolver(`${title || "Market"} atom ${index + 1}`)
  }));
}

function toCreatedAtoms(node: IndexedMarketNode): CreatedAtom[] {
  const metadata = parseOnchainMarketMetadata(node.metadata || node.question);
  if (metadata?.atoms.length) {
    return metadata.atoms.map((atom) => ({
      description: atom.description,
      resolver: "UMA Optimistic Oracle",
      uma: defaultUmaResolver(atom.question)
    }));
  }
  return buildFallbackAtoms(node.atomCount, cleanText(node.title) || "Indexed market");
}

function mapIndexedMarket(chain: ChainConfig, node: IndexedMarketNode): CreatedMarket {
  const metadata = parseOnchainMarketMetadata(node.metadata || node.question);
  const atoms = toCreatedAtoms(node);
  const title = cleanText(node.title) || metadata?.title || "Untitled combinatorial market";
  const category = inferCategory(title, atoms);
  const createdAt = timestampToIso(node.createdAtTimestamp) || new Date().toISOString();
  const lifecycle =
    lifecycleFromIndexedNode(node, chain.id) ||
    normalizeMarketLifecycle(metadata?.lifecycle, createdAt, chain.id);
  const visual = normalizeMarketVisual(metadata?.visual, { title, category, atoms });
  const marketId = String(node.marketId);
  const base = buildMarket({
    id: toIndexedMarketRouteId(chain.id, marketId),
    icon: title.slice(0, 2).toUpperCase() || "NM",
    category,
    title,
    volume: formatIndexedVolume(node.totalStake, chain.nativeCurrency),
    endDate: formatLifecycleDate(lifecycle.tradingEndTime),
    threeOutcomes: atoms.length > 2,
    visual
  });

  return {
    ...base,
    atoms,
    createdAt,
    lifecycle,
    visual,
    resolutionSource: "uma",
    onchain: {
      chainId: chain.id,
      marketId,
      contract: chain.contractAddress || "",
      creator: node.creator || "",
      materialized: true
    },
    resolution: createEmptyResolutionState(atoms.length)
  };
}

async function querySubgraph(subgraphUrl: string, query: string, variables: Record<string, unknown>) {
  const response = await fetch(subgraphUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables })
  });
  if (!response.ok) {
    throw new Error(`Subgraph request failed with HTTP ${response.status}.`);
  }
  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error: { message: string }) => error.message).join("; "));
  }
  return (payload.data?.markets || []) as IndexedMarketNode[];
}

export function toIndexedMarketRouteId(chainId: ChainId, marketId: string | number | bigint) {
  return `${INDEXED_MARKET_PREFIX}-${chainId}-${String(marketId)}`;
}

export function parseIndexedMarketRouteId(id: string | undefined) {
  const match = /^indexed-(zama|arc)-(\d+)$/.exec(id || "");
  if (!match || !isChainId(match[1])) return undefined;
  return { chainId: match[1], marketId: match[2] };
}

export async function fetchIndexedMarkets(chain: ChainConfig) {
  if (!chain.enabled || !chain.subgraphUrl) return [];
  const query = chain.id === "zama" ? zamaMarketsQuery : publicMarketsQuery;
  let nodes: IndexedMarketNode[];
  try {
    nodes = await querySubgraph(chain.subgraphUrl, query, { first: PAGE_SIZE, skip: 0 });
  } catch (error) {
    if (chain.id === "zama") throw error;
    nodes = await querySubgraph(chain.subgraphUrl, publicLegacyMarketsQuery, { first: PAGE_SIZE, skip: 0 });
  }
  return nodes.map((node) => mapIndexedMarket(chain, node));
}

export async function fetchIndexedMarketByRouteId(routeId: string) {
  const parsed = parseIndexedMarketRouteId(routeId);
  if (!parsed) return undefined;
  const chain = getChainConfig(parsed.chainId);
  if (!chain.enabled || !chain.subgraphUrl) return undefined;
  const query = chain.id === "zama" ? zamaMarketQuery : publicMarketQuery;
  let nodes: IndexedMarketNode[];
  try {
    nodes = await querySubgraph(chain.subgraphUrl, query, { marketId: parsed.marketId });
  } catch (error) {
    if (chain.id === "zama") throw error;
    nodes = await querySubgraph(chain.subgraphUrl, publicLegacyMarketQuery, { marketId: parsed.marketId });
  }
  const node = nodes[0];
  return node ? mapIndexedMarket(chain, node) : undefined;
}

export async function fetchIndexedMarketsForConfiguredChains() {
  const results = await Promise.allSettled(CHAIN_ORDER.map((chainId) => fetchIndexedMarkets(getChainConfig(chainId))));
  return results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

export function mergeIndexedAndLocalMarkets(indexedMarkets: CreatedMarket[], localMarkets: CreatedMarket[]) {
  const indexedKeys = new Set(
    indexedMarkets.map((market) => `${market.onchain.chainId}:${market.onchain.contract.toLowerCase()}:${market.onchain.marketId}`)
  );
  const localOnly = localMarkets.filter((market) => {
    if (!market.onchain.materialized || !market.onchain.marketId) return true;
    const key = `${market.onchain.chainId}:${market.onchain.contract.toLowerCase()}:${market.onchain.marketId}`;
    return !indexedKeys.has(key);
  });
  return [...localOnly, ...indexedMarkets];
}
