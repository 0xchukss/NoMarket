import type { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, createWalletClient, defineChain, http, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getChainConfig, isChainId, type ChainId } from "../../../lib/chains";
import { arcNoMarketAbi, arcUmaResolverAbi, arcUmaResolverAddress } from "../../../lib/evm/arcNoMarketContract";
import { noMarketAbi } from "../../../lib/evm/noMarketContract";
import { buildUmaResolutionClaim, getOutcomeVector, type AtomResolutionDraft } from "../../../lib/resolution";
import { formatLifecycleDate, isResolutionReady, normalizeMarketLifecycle, type MarketLifecycle } from "../../../lib/marketLifecycle";

type BotResponse = {
  status: "queued" | "watching" | "scheduled" | "proposed" | "settled" | "skipped";
  message: string;
  assertionTx?: string;
  settlementTx?: string;
  outcomeVector?: number;
};

type BotAtom = {
  description: string;
  uma?: {
    question?: string;
  };
};

type BotMarket = {
  id: string;
  title: string;
  atoms: BotAtom[];
  lifecycle: MarketLifecycle;
  onchain: {
    chainId: ChainId;
    marketId: string;
    contract: string;
    materialized: boolean;
  };
};

const defaultEndpoint = "https://freemodel.dev/v1";
const defaultModel = "claude-sonnet-4.6";

function asText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text;
        return "";
      })
      .join("");
  }
  return "";
}

function parseJsonObject(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) return JSON.parse(fenced[1]);
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error("Resolver bot did not return valid JSON.");
  }
}

function cleanMarket(value: unknown): BotMarket | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = value as BotMarket;
  const chainId = source.onchain?.chainId;
  const atoms = Array.isArray(source.atoms)
    ? source.atoms
        .map((atom) => ({
          description: typeof atom.description === "string" ? atom.description.trim().slice(0, 260) : "",
          uma: {
            question: typeof atom.uma?.question === "string" ? atom.uma.question.trim().slice(0, 520) : ""
          }
        }))
        .filter((atom) => atom.description)
        .slice(0, 16)
    : [];

  if (!isChainId(chainId) || !source.onchain?.marketId || !source.title || atoms.length < 2) return undefined;
  return {
    id: String(source.id || ""),
    title: String(source.title).trim().slice(0, 240),
    atoms,
    lifecycle: normalizeMarketLifecycle(source.lifecycle),
    onchain: {
      chainId,
      marketId: String(source.onchain.marketId),
      contract: String(source.onchain.contract || ""),
      materialized: Boolean(source.onchain.materialized)
    }
  };
}

function normalizePrivateKey(value: string | undefined): Hex | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const prefixed = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  return /^0x[0-9a-fA-F]{64}$/.test(prefixed) ? (prefixed as Hex) : undefined;
}

function normalizeAssertionId(value: unknown): Hex | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || /^0x0+$/.test(trimmed)) return undefined;
  return /^0x[0-9a-fA-F]{64}$/.test(trimmed) ? (trimmed as Hex) : undefined;
}

function getPublicUmaSettlementAddress(chainId: ChainId): Address | undefined {
  if (chainId === "arc") return arcUmaResolverAddress;
  return undefined;
}

async function evaluateAtoms(market: BotMarket, networkName: string) {
  const apiKey = process.env.FREEMODEL_API_KEY;
  if (!apiKey) return undefined;

  const endpoint = (process.env.FREEMODEL_API_BASE_URL || defaultEndpoint).replace(/\/$/, "");
  const model = process.env.FREEMODEL_MODEL || defaultModel;
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.05,
      max_tokens: 1600,
      messages: [
        {
          role: "system",
          content:
            "You are an automated UMA optimistic resolver bot. Resolve atom outcomes only when public evidence is sufficient. Return only JSON: {\"ready\":boolean,\"outcomes\":[{\"outcome\":\"true|false\",\"evidence\":\"...\"}],\"reason\":\"...\"}."
        },
        {
          role: "user",
          content: [
            `Market: ${market.title}`,
            `Network: ${networkName}`,
            "Atoms:",
            ...market.atoms.map((atom, index) => `Atom ${index}: ${atom.description}\nUMA question: ${atom.uma?.question || atom.description}`),
            "If evidence is insufficient or the event has not completed, return ready:false."
          ].join("\n\n")
        }
      ]
    })
  });

  if (!response.ok) return undefined;
  const completion = await response.json();
  const parsed = parseJsonObject(asText(completion?.choices?.[0]?.message?.content));
  const outcomes = Array.isArray(parsed?.outcomes)
    ? parsed.outcomes
        .map((outcome: Record<string, unknown>) => ({
          outcome: outcome.outcome === "true" ? "true" : outcome.outcome === "false" ? "false" : "unknown",
          evidence: typeof outcome.evidence === "string" ? outcome.evidence.trim().slice(0, 800) : ""
        }))
        .slice(0, market.atoms.length)
    : [];
  if (!parsed?.ready || outcomes.length !== market.atoms.length || outcomes.some((outcome: AtomResolutionDraft) => outcome.outcome === "unknown")) {
    return undefined;
  }
  return outcomes as AtomResolutionDraft[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<BotResponse | { error: string }>) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const market = cleanMarket(req.body?.market);
  if (!market) return res.status(400).json({ error: "Invalid market payload." });
  const assertionId = normalizeAssertionId(req.body?.assertionId);

  const chain = getChainConfig(market.onchain.chainId);
  if (!chain.enabled || !chain.contractAddress || !chain.rpcUrl || !market.onchain.materialized) {
    return res.status(200).json({
      status: "watching",
      message: "Resolver bot is waiting for the market to be live on-chain."
    });
  }

  if (!assertionId && !isResolutionReady(market.lifecycle)) {
    return res.status(200).json({
      status: "scheduled",
      message: `Resolver bot is scheduled for ${formatLifecycleDate(market.lifecycle.resolutionTime)}.`
    });
  }

  if (process.env.UMA_BOT_AUTO_PROPOSE !== "true") {
    return res.status(200).json({
      status: "queued",
      message: "Resolver bot is monitoring this market and will submit through UMA when final evidence is available."
    });
  }

  const privateKey = normalizePrivateKey(process.env.UMA_BOT_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY);
  if (!privateKey) {
    return res.status(200).json({
      status: "queued",
      message: "Resolver bot is monitoring this market and will submit through UMA when final evidence is available."
    });
  }

  const viemChain = defineChain({
    id: chain.chainId || 0,
    name: chain.name,
    nativeCurrency: {
      name: chain.nativeCurrency,
      symbol: chain.nativeCurrency,
      decimals: 18
    },
    rpcUrls: {
      default: { http: [chain.rpcUrl] }
    },
    blockExplorers: chain.explorerUrl ? { default: { name: chain.shortName, url: chain.explorerUrl } } : undefined,
    testnet: true
  });
  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({ chain: viemChain, transport: http(chain.rpcUrl) });
  const walletClient = createWalletClient({ account, chain: viemChain, transport: http(chain.rpcUrl) });
  const address = chain.contractAddress as Address;

  if (assertionId) {
    try {
      const publicSettlementAddress = chain.id === "zama" ? undefined : getPublicUmaSettlementAddress(chain.id);
      if (chain.id !== "zama" && !publicSettlementAddress) {
        return res.status(200).json({
          status: "queued",
          message: "Resolver bot is monitoring this market and waiting for the UMA settlement adapter."
        });
      }
      const settlementHash =
        chain.id === "zama"
          ? await walletClient.writeContract({
              address,
              abi: noMarketAbi,
              functionName: "settleUmaResolution",
              args: [assertionId],
              account,
              chain: viemChain
            })
          : await walletClient.writeContract({
              address: publicSettlementAddress as Address,
              abi: arcUmaResolverAbi,
              functionName: "settleAssertion",
              args: [assertionId, true],
              account,
              chain: viemChain
            });
      await publicClient.waitForTransactionReceipt({ hash: settlementHash });
      return res.status(200).json({
        status: "settled",
        message: "Resolver bot settled the UMA assertion.",
        settlementTx: settlementHash
      });
    } catch {
      return res.status(200).json({
        status: "watching",
        message: "Resolver bot is waiting for the UMA liveness window before settlement."
      });
    }
  }

  const atomOutcomes = await evaluateAtoms(market, chain.name);
  const outcomeVector = atomOutcomes ? getOutcomeVector(atomOutcomes) : undefined;
  if (!atomOutcomes || outcomeVector === undefined) {
    return res.status(200).json({
      status: "watching",
      message: "Resolver bot is waiting for sufficient final evidence before proposing."
    });
  }

  const claim = buildUmaResolutionClaim({
    marketTitle: market.title,
    networkName: chain.name,
    atoms: market.atoms,
    atomOutcomes,
    outcomeVector
  });

  const hash =
    chain.id === "zama"
      ? await walletClient.writeContract({
          address,
          abi: noMarketAbi,
          functionName: "proposeUmaResolution",
          args: [BigInt(market.onchain.marketId), outcomeVector, claim],
          account,
          chain: viemChain
        })
      : await walletClient.writeContract({
          address,
          abi: arcNoMarketAbi,
          functionName: "proposeResolution",
          args: [BigInt(market.onchain.marketId), BigInt(outcomeVector), claim],
          account,
          chain: viemChain
        });
  await publicClient.waitForTransactionReceipt({ hash });

  return res.status(200).json({
    status: "proposed",
    message: "Resolver bot submitted the UMA optimistic assertion.",
    assertionTx: hash,
    outcomeVector
  });
}
