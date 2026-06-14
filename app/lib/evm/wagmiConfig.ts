import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain, http } from "viem";
import { sepolia } from "viem/chains";

export const arcTestnet = defineChain({
  id: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || 5042002),
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ARC_RPC || "https://rpc.testnet.arc.network"]
    }
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: process.env.NEXT_PUBLIC_ARC_EXPLORER || "https://testnet.arcscan.app"
    }
  },
  testnet: true
});

const configuredChains = [sepolia, arcTestnet] as const;
const configuredTransports = {
  [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL),
  [arcTestnet.id]: http(process.env.NEXT_PUBLIC_ARC_RPC || "https://rpc.testnet.arc.network")
};

export const wagmiConfig = getDefaultConfig({
  appName: "NoMarket",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "nomarket-dev",
  chains: configuredChains,
  ssr: true,
  transports: configuredTransports
});

export const targetChain = sepolia;
