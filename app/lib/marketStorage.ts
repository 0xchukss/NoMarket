import { buildMarket, type Market } from "./mockMarkets";
import { defaultUmaResolver, type UmaResolverState } from "./switchboardOracle";
import { getChainConfig, getStoredChainId, isChainId, type ChainId } from "./chains";
import {
  createEmptyResolutionState,
  normalizeResolutionState,
  type MarketResolutionDraft
} from "./resolution";
import { formatLifecycleDate, normalizeMarketLifecycle, type MarketLifecycle } from "./marketLifecycle";
import { buildMarketVisual, normalizeMarketVisual, type MarketVisual } from "./marketVisuals";

const CREATED_MARKETS_KEY = "nomarket.createdMarkets.v2";

export type CreatedAtom = {
  description: string;
  resolver: string;
  uma?: UmaResolverState;
};

export type CreatedMarket = Market & {
  atoms: CreatedAtom[];
  createdAt: string;
  lifecycle: MarketLifecycle;
  visual: MarketVisual;
  resolutionSource: "uma";
  onchain: OnchainIdentity;
  resolution: MarketResolutionDraft;
};

export type OnchainIdentity = {
  chainId: ChainId;
  marketId: string;
  contract: string;
  creator: string;
  materialized: boolean;
};

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createOnchainIdentity(chainId: ChainId = getStoredChainId()): OnchainIdentity {
  const chain = getChainConfig(chainId);
  return {
    chainId,
    marketId: "",
    contract: chain.contractAddress || "",
    creator: "",
    materialized: false
  };
}

export function makeCreatedMarket(params: {
  title: string;
  category: string;
  atoms: CreatedAtom[];
  lifecycle?: MarketLifecycle;
  imageUrls?: string[];
  visual?: MarketVisual;
}): CreatedMarket {
  const id = `market-${Date.now()}`;
  const lifecycle = params.lifecycle || normalizeMarketLifecycle(undefined);
  const normalizedAtoms = params.atoms.map((atom) => ({
    ...atom,
    resolver: atom.resolver || "UMA Optimistic Oracle",
    uma: atom.uma || defaultUmaResolver(atom.description)
  }));
  const visual =
    params.visual ||
    buildMarketVisual({
      title: params.title.trim(),
      category: params.category,
      atoms: normalizedAtoms,
      imageUrls: params.imageUrls
    });
  const market = buildMarket({
    id,
    icon: params.title.trim().slice(0, 2).toUpperCase() || "NM",
    category: params.category,
    title: params.title.trim(),
    volume: "$0 Vol.",
    endDate: formatLifecycleDate(lifecycle.tradingEndTime),
    threeOutcomes: params.atoms.length > 2,
    visual
  });

  return {
    ...market,
    atoms: normalizedAtoms,
    createdAt: new Date().toISOString(),
    lifecycle,
    visual,
    resolutionSource: "uma",
    onchain: createOnchainIdentity(),
    resolution: createEmptyResolutionState(params.atoms.length)
  };
}

function normalizeCreatedMarket(value: CreatedMarket): CreatedMarket {
  const normalizedChainId = isChainId(value.onchain?.chainId) ? value.onchain.chainId : "zama";
  const chain = getChainConfig(normalizedChainId);
  const lifecycle = normalizeMarketLifecycle(value.lifecycle, value.createdAt, normalizedChainId);
  const atoms = value.atoms.map((atom) => ({
    ...atom,
    resolver: atom.resolver || "UMA Optimistic Oracle",
    uma: atom.uma || defaultUmaResolver(atom.description)
  }));
  const visual = normalizeMarketVisual(value.visual, {
    title: value.title,
    category: value.category,
    atoms
  });
  const normalized = {
    ...value,
    lifecycle,
    visual,
    endDate: formatLifecycleDate(lifecycle.tradingEndTime),
    resolutionSource: "uma" as const,
    atoms,
    resolution: normalizeResolutionState(value.resolution, value.atoms.length)
  };
  if (value.onchain) {
    return {
      ...normalized,
      onchain: {
        ...value.onchain,
        chainId: normalizedChainId,
        contract: value.onchain.contract || chain.contractAddress || ""
      }
    };
  }
  return {
    ...normalized,
    onchain: createOnchainIdentity(normalizedChainId)
  };
}

export function loadCreatedMarkets(): CreatedMarket[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawMarkets = window.localStorage.getItem(CREATED_MARKETS_KEY);
    if (!rawMarkets) {
      return [];
    }
    const parsed = JSON.parse(rawMarkets);
    return Array.isArray(parsed) ? parsed.map(normalizeCreatedMarket) : [];
  } catch {
    return [];
  }
}

export function saveCreatedMarket(market: CreatedMarket) {
  if (typeof window === "undefined") {
    return;
  }

  const existingMarkets = loadCreatedMarkets();
  window.localStorage.setItem(CREATED_MARKETS_KEY, JSON.stringify([market, ...existingMarkets]));
}

export function updateCreatedMarket(updatedMarket: CreatedMarket) {
  if (typeof window === "undefined") {
    return;
  }

  const existingMarkets = loadCreatedMarkets();
  const hasMarket = existingMarkets.some((market) => market.id === updatedMarket.id);
  const markets = hasMarket
    ? existingMarkets.map((market) => (market.id === updatedMarket.id ? updatedMarket : market))
    : [updatedMarket, ...existingMarkets];
  window.localStorage.setItem(CREATED_MARKETS_KEY, JSON.stringify(markets));
}
