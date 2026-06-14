export type ChainId = "zama" | "arc";

export type PrivacyLevel = "fhe-private" | "public";

export type ResolverType = "uma" | "mock-uma";

export type ChainConfig = {
  id: ChainId;
  name: string;
  shortName: string;
  color: string;
  chainId?: number;
  rpcUrl: string;
  explorerUrl: string;
  subgraphUrl?: string;
  nativeCurrency: string;
  contractAddress?: string;
  deployBlock?: bigint;
  privacyLevel: PrivacyLevel;
  privacyDescription: string;
  resolver: ResolverType;
  isEVM: boolean;
  enabled: boolean;
  setupMessage?: string;
};

export const SELECTED_CHAIN_KEY = "nomarket.selectedChain.v1";

function env(value: string | undefined) {
  return value && value.trim() ? value.trim() : undefined;
}

function envBigInt(value: string | undefined) {
  return value && value.trim() ? BigInt(value.trim()) : undefined;
}

const zamaAddress = env(process.env.NEXT_PUBLIC_NO_MARKET_ADDRESS);
const zamaSubgraphUrl = env(process.env.NEXT_PUBLIC_ZAMA_SUBGRAPH_URL);
const arcAddress = env(process.env.NEXT_PUBLIC_ARC_NOMARKET_ADDRESS);

export const CHAINS: Record<ChainId, ChainConfig> = {
  zama: {
    id: "zama",
    name: "Zama Sepolia",
    shortName: "Zama",
    color: "#3b82f6",
    chainId: 11155111,
    rpcUrl: env(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL) || "https://ethereum-sepolia-rpc.publicnode.com",
    explorerUrl: "https://sepolia.etherscan.io",
    subgraphUrl: zamaSubgraphUrl,
    nativeCurrency: "ETH",
    contractAddress: zamaAddress,
    deployBlock: envBigInt(process.env.NEXT_PUBLIC_NO_MARKET_DEPLOY_BLOCK),
    privacyLevel: "fhe-private",
    privacyDescription: "Bet expression data is encrypted with Zama FHE. ETH stake is public.",
    resolver: "uma",
    isEVM: true,
    enabled: Boolean(zamaAddress),
    setupMessage: zamaAddress ? undefined : "Missing NEXT_PUBLIC_NO_MARKET_ADDRESS."
  },
  arc: {
    id: "arc",
    name: "Arc Testnet",
    shortName: "Arc",
    color: "#3e74bb",
    chainId: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || 5042002),
    rpcUrl: env(process.env.NEXT_PUBLIC_ARC_RPC) || "https://rpc.testnet.arc.network",
    explorerUrl: env(process.env.NEXT_PUBLIC_ARC_EXPLORER) || "https://testnet.arcscan.app",
    subgraphUrl: env(process.env.NEXT_PUBLIC_ARC_SUBGRAPH_URL),
    nativeCurrency: "USDC",
    contractAddress: arcAddress,
    deployBlock: envBigInt(process.env.NEXT_PUBLIC_ARC_DEPLOY_BLOCK),
    privacyLevel: "public",
    privacyDescription: "Arc beta uses public USDC stake and public expressions.",
    resolver: env(process.env.NEXT_PUBLIC_ARC_UMA_RESOLVER_ADDRESS) || env(process.env.NEXT_PUBLIC_ARC_UMA_OOV2_ADDRESS) ? "uma" : "mock-uma",
    isEVM: true,
    enabled: Boolean(arcAddress),
    setupMessage: arcAddress ? undefined : "Arc contract is not deployed/configured yet."
  }
};

export const CHAIN_ORDER: ChainId[] = ["zama", "arc"];

export function getChainConfig(chainId: ChainId) {
  return CHAINS[chainId] || CHAINS.zama;
}

export function isChainId(value: string | null | undefined): value is ChainId {
  return value === "zama" || value === "arc";
}

export function getStoredChainId(): ChainId {
  if (typeof window === "undefined") return "zama";
  const stored = window.localStorage.getItem(SELECTED_CHAIN_KEY);
  return isChainId(stored) ? stored : "zama";
}

export function setStoredChainId(chainId: ChainId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SELECTED_CHAIN_KEY, chainId);
  window.dispatchEvent(new CustomEvent("nomarket:chain-change", { detail: chainId }));
}

export function privacyLabel(level: PrivacyLevel) {
  if (level === "fhe-private") return "FHE private";
  return "Public";
}
