import type { ChainId } from "./chains";
import { normalizeMarketVisual, type MarketVisual } from "./marketVisuals";

export type MarketLifecycle = {
  tradingEndTime: string;
  eventOccurrenceTime: string;
  resolutionBufferMinutes: number;
  resolutionTime: string;
  creationDepositWei: string;
};

type LifecycleInput = {
  tradingEndTime: string;
  eventOccurrenceTime: string;
  resolutionBufferMinutes: number | string;
  creationDepositWei?: string;
};

export type OnchainMarketMetadata = {
  version: "nomarket.market.v1";
  title: string;
  atoms: Array<{
    description: string;
    question: string;
  }>;
  lifecycle: MarketLifecycle;
  visual?: MarketVisual;
};

const DEFAULT_BUFFER_MINUTES = 60;
const ONE_HOUR_MS = 60 * 60 * 1000;
const DEFAULT_CREATION_DEPOSIT_WEI: Record<ChainId, string> = {
  zama: "2000000000000000",
  arc: "5000000000000000000"
};

function cleanIso(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined;
}

function localDateTimeValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function isoFromLocalInput(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "";
  return new Date(time).toISOString();
}

export function getDefaultLifecycleInput(now = new Date()) {
  const tradingEnd = new Date(now.getTime() + 24 * ONE_HOUR_MS);
  const eventOccurrence = new Date(now.getTime() + 26 * ONE_HOUR_MS);
  return {
    tradingEndTime: localDateTimeValue(tradingEnd),
    eventOccurrenceTime: localDateTimeValue(eventOccurrence),
    resolutionBufferMinutes: DEFAULT_BUFFER_MINUTES
  };
}

export function getCreationDepositWeiForChain(chainId: ChainId) {
  const deposits: Record<ChainId, string | undefined> = {
    zama: process.env.NEXT_PUBLIC_ZAMA_MARKET_CREATION_DEPOSIT_WEI,
    arc: process.env.NEXT_PUBLIC_ARC_MARKET_CREATION_DEPOSIT_WEI
  };
  return BigInt(deposits[chainId] || process.env.NEXT_PUBLIC_MARKET_CREATION_DEPOSIT_WEI || DEFAULT_CREATION_DEPOSIT_WEI[chainId]);
}

export function formatCreationDepositDisplay(chainId: ChainId) {
  if (chainId === "arc") return "5 USDC";
  return "5 USDT in ETH";
}

export function getBetFeeBpsForChain(chainId: ChainId) {
  const fees: Record<ChainId, string | undefined> = {
    zama: process.env.NEXT_PUBLIC_ZAMA_BET_FEE_BPS,
    arc: process.env.NEXT_PUBLIC_ARC_BET_FEE_BPS
  };
  const parsed = Number(fees[chainId] || process.env.NEXT_PUBLIC_BET_FEE_BPS || "0");
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 2_000) : 0;
}

export function getGrossBetValueFromStake(stakeWei: bigint, chainId: ChainId) {
  const bps = BigInt(getBetFeeBpsForChain(chainId));
  if (bps === 0n) return stakeWei;
  return stakeWei + (stakeWei * bps + 9_999n) / 10_000n;
}

export function supportsTimedMarketCreation(chainId: ChainId) {
  const support: Record<ChainId, string | undefined> = {
    zama: process.env.NEXT_PUBLIC_ZAMA_TIMED_MARKETS,
    arc: process.env.NEXT_PUBLIC_ARC_TIMED_MARKETS
  };
  return support[chainId] === "true";
}

export function normalizeMarketLifecycle(value: unknown, fallbackDate?: string, chainId: ChainId = "zama"): MarketLifecycle {
  const source = value && typeof value === "object" ? (value as Partial<MarketLifecycle>) : {};
  const createdAt = cleanIso(fallbackDate) || new Date().toISOString();
  const createdMs = Date.parse(createdAt);
  const tradingEndTime = cleanIso(source.tradingEndTime) || new Date(createdMs + 24 * ONE_HOUR_MS).toISOString();
  const eventOccurrenceTime = cleanIso(source.eventOccurrenceTime) || new Date(Date.parse(tradingEndTime) + 2 * ONE_HOUR_MS).toISOString();
  const resolutionBufferMinutes = Number(source.resolutionBufferMinutes || DEFAULT_BUFFER_MINUTES);
  const safeBuffer = Number.isFinite(resolutionBufferMinutes) && resolutionBufferMinutes > 0 ? resolutionBufferMinutes : DEFAULT_BUFFER_MINUTES;
  const resolutionTime =
    cleanIso(source.resolutionTime) || new Date(Date.parse(eventOccurrenceTime) + safeBuffer * 60_000).toISOString();
  return {
    tradingEndTime,
    eventOccurrenceTime,
    resolutionBufferMinutes: safeBuffer,
    resolutionTime,
    creationDepositWei: String(source.creationDepositWei || getCreationDepositWeiForChain(chainId).toString())
  };
}

export function buildMarketLifecycle(input: LifecycleInput, chainId: ChainId): MarketLifecycle {
  const tradingEndTime = isoFromLocalInput(input.tradingEndTime);
  const eventOccurrenceTime = isoFromLocalInput(input.eventOccurrenceTime);
  const buffer = Number(input.resolutionBufferMinutes);
  const tradingEndMs = Date.parse(tradingEndTime);
  const eventMs = Date.parse(eventOccurrenceTime);

  if (!tradingEndTime || !eventOccurrenceTime) {
    throw new Error("Add the trading end time and event occurrence time.");
  }
  if (tradingEndMs <= Date.now()) {
    throw new Error("Trading end time must be in the future.");
  }
  if (eventMs < tradingEndMs) {
    throw new Error("Event occurrence time must be after the trading end time.");
  }
  if (!Number.isFinite(buffer) || buffer <= 0) {
    throw new Error("Resolution buffer must be greater than 0 minutes.");
  }

  const resolutionTime = new Date(eventMs + buffer * 60_000).toISOString();
  return {
    tradingEndTime,
    eventOccurrenceTime,
    resolutionBufferMinutes: buffer,
    resolutionTime,
    creationDepositWei: input.creationDepositWei || getCreationDepositWeiForChain(chainId).toString()
  };
}

export function lifecycleToUnixSeconds(value: string) {
  const time = Date.parse(value);
  return BigInt(Math.floor(time / 1000));
}

export function isTradingOpen(lifecycle: MarketLifecycle | undefined, now = Date.now()) {
  if (!lifecycle) return true;
  return now < Date.parse(lifecycle.tradingEndTime);
}

export function isResolutionReady(lifecycle: MarketLifecycle | undefined, now = Date.now()) {
  if (!lifecycle) return true;
  return now >= Date.parse(lifecycle.resolutionTime);
}

export function getLifecyclePhase(lifecycle: MarketLifecycle | undefined, now = Date.now()) {
  if (!lifecycle) return "trading";
  if (now < Date.parse(lifecycle.tradingEndTime)) return "trading";
  if (now < Date.parse(lifecycle.eventOccurrenceTime)) return "event";
  if (now < Date.parse(lifecycle.resolutionTime)) return "buffer";
  return "resolution";
}

export function formatLifecycleDate(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "Draft";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(time));
}

export function buildOnchainMarketMetadata(input: {
  title: string;
  atoms: Array<{ description: string; uma?: { question?: string } }>;
  lifecycle: MarketLifecycle;
  visual?: MarketVisual;
}): string {
  const metadata: OnchainMarketMetadata = {
    version: "nomarket.market.v1",
    title: input.title,
    atoms: input.atoms.map((atom) => ({
      description: atom.description,
      question: atom.uma?.question || atom.description
    })),
    lifecycle: input.lifecycle,
    visual: input.visual
  };
  return JSON.stringify(metadata);
}

export function parseOnchainMarketMetadata(value: string | undefined): OnchainMarketMetadata | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (parsed?.version !== "nomarket.market.v1" || !Array.isArray(parsed.atoms)) return undefined;
    const title = String(parsed.title || "").trim();
    const atoms = parsed.atoms
      .map((atom: Record<string, unknown>) => ({
        description: String(atom.description || "").trim(),
        question: String(atom.question || atom.description || "").trim()
      }))
      .filter((atom: { description: string }) => atom.description)
      .slice(0, 16);
    return {
      version: "nomarket.market.v1",
      title,
      atoms,
      lifecycle: normalizeMarketLifecycle(parsed.lifecycle),
      visual: normalizeMarketVisual(parsed.visual, {
        title,
        atoms: atoms.map((atom) => ({
          description: atom.description,
          uma: { question: atom.question }
        }))
      })
    };
  } catch {
    return undefined;
  }
}
