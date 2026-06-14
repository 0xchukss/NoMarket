import type { Minterm } from "../expression";
import type { CreatedMarket } from "../marketStorage";
import { getChainConfig, type ChainConfig, type ChainId } from ".";

export type CreateMarketInput = {
  title: string;
  atoms: string[];
  endTime?: number;
  liquidity?: string;
};

export type PlaceBetInput = {
  market: CreatedMarket;
  amount: string;
  minterms: Minterm[];
};

export type ResolutionInput = {
  market: CreatedMarket;
  outcomeVector: number;
  claim: string;
  assertionId?: string;
};

export type NoMarketChainAdapter = {
  chain: ChainConfig;
  createMarket(input: CreateMarketInput): Promise<never>;
  placeBet(input: PlaceBetInput): Promise<never>;
  fetchBetHistory(market: CreatedMarket): Promise<unknown[]>;
  proposeResolution(input: ResolutionInput): Promise<never>;
  settleResolution(input: ResolutionInput): Promise<never>;
};

function unavailable(chain: ChainConfig) {
  return new Error(chain.setupMessage || `${chain.name} is not configured for live actions yet.`);
}

function pendingAdapter(chain: ChainConfig): NoMarketChainAdapter {
  return {
    chain,
    async createMarket() {
      throw unavailable(chain);
    },
    async placeBet() {
      throw unavailable(chain);
    },
    async fetchBetHistory() {
      return [];
    },
    async proposeResolution() {
      throw unavailable(chain);
    },
    async settleResolution() {
      throw unavailable(chain);
    }
  };
}

export function getNoMarketAdapter(chainId: ChainId): NoMarketChainAdapter {
  return pendingAdapter(getChainConfig(chainId));
}

export function shouldUseSubgraph(chain: ChainConfig) {
  return Boolean(chain.subgraphUrl);
}

export function getLogStartBlock(chain: ChainConfig, latestBlock: bigint) {
  return chain.deployBlock && chain.deployBlock > 0n ? chain.deployBlock : latestBlock;
}
