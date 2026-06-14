import type { NextApiRequest, NextApiResponse } from "next";
import { CHAIN_ORDER, getChainConfig } from "../../../lib/chains";
import {
  isResolutionReady,
  normalizeMarketLifecycle,
  parseOnchainMarketMetadata
} from "../../../lib/marketLifecycle";

type IndexedMarketNode = {
  marketId: string;
  title?: string;
  metadata?: string;
  question?: string;
  assertionId?: string;
};

type BotRunResult = {
  chainId: string;
  marketId: string;
  status: string;
  message: string;
};

const publicDueQuery = `
  query DuePublicMarkets($now: BigInt!) {
    markets(first: 25, where: { resolved: false, resolutionTime_gt: "0", resolutionTime_lte: $now }) {
      marketId
      title
      metadata
      assertionId
    }
  }
`;

const publicFallbackQuery = `
  query DuePublicMarketsFallback {
    markets(first: 50, where: { resolved: false }) {
      marketId
      title
      metadata
      assertionId
    }
  }
`;

const zamaFallbackQuery = `
  query DueZamaMarketsFallback {
    markets(first: 50, where: { resolved: false }) {
      marketId
      title
      question
      assertionId
    }
  }
`;

function isAuthorized(req: NextApiRequest) {
  const secret = process.env.UMA_BOT_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.authorization || "";
  const querySecret = typeof req.query.secret === "string" ? req.query.secret : "";
  return auth === `Bearer ${secret}` || querySecret === secret;
}

async function querySubgraph(subgraphUrl: string, query: string, variables?: Record<string, string>) {
  const response = await fetch(subgraphUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables })
  });
  if (!response.ok) {
    throw new Error(`Subgraph HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error: { message: string }) => error.message).join("; "));
  }
  return (payload.data?.markets || []) as IndexedMarketNode[];
}

function getOrigin(req: NextApiRequest) {
  const host = req.headers.host;
  if (!host) return "";
  const protocol = req.headers["x-forwarded-proto"] || "http";
  return `${protocol}://${host}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ checked: number; queued: number; results: BotRunResult[] } | { error: string }>
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const origin = getOrigin(req);
  if (!origin) return res.status(400).json({ error: "Missing request host." });

  let checked = 0;
  let queued = 0;
  const results: BotRunResult[] = [];
  const now = String(Math.floor(Date.now() / 1000));

  for (const chainId of CHAIN_ORDER) {
    const chain = getChainConfig(chainId);
    if (!chain.enabled || !chain.subgraphUrl || !chain.contractAddress) continue;

    let nodes: IndexedMarketNode[] = [];
    try {
      nodes =
        chain.id === "zama"
          ? await querySubgraph(chain.subgraphUrl, zamaFallbackQuery)
          : await querySubgraph(chain.subgraphUrl, publicDueQuery, { now });
    } catch {
      if (chain.id !== "zama") {
        try {
          nodes = await querySubgraph(chain.subgraphUrl, publicFallbackQuery);
        } catch {
          nodes = [];
        }
      }
    }

    for (const node of nodes) {
      checked += 1;
      const metadata = parseOnchainMarketMetadata(node.metadata || node.question);
      if (!metadata || metadata.atoms.length < 2) continue;
      const lifecycle = normalizeMarketLifecycle(metadata.lifecycle);
      if (!isResolutionReady(lifecycle)) continue;

      const response = await fetch(`${origin}/api/uma-bot/queue-resolution`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          market: {
            id: `${chain.id}-${node.marketId}`,
            title: node.title || metadata.title,
            atoms: metadata.atoms.map((atom) => ({
              description: atom.description,
              uma: { question: atom.question }
            })),
            lifecycle,
            onchain: {
              chainId: chain.id,
              marketId: String(node.marketId),
              contract: chain.contractAddress,
              materialized: true
            }
          },
          assertionId: node.assertionId
        })
      });
      const data = await response.json();
      queued += response.ok ? 1 : 0;
      results.push({
        chainId: chain.id,
        marketId: String(node.marketId),
        status: String(data.status || "error"),
        message: String(data.message || data.error || "No response.")
      });
    }
  }

  return res.status(200).json({ checked, queued, results });
}
