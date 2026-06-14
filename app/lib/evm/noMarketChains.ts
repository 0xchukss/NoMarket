import type { Address, Chain } from "viem";
import type { ChainConfig } from "../chains";
import { arcTestnet, targetChain } from "./wagmiConfig";
import { noMarketAbi, noMarketAddress, noMarketDeployBlock, requireNoMarketAddress } from "./noMarketContract";
import {
  arcNoMarketAbi,
  arcNoMarketAddress,
  arcNoMarketDeployBlock,
  arcUmaResolverAddress,
  requireArcNoMarketAddress,
  requireArcUmaResolverAddress
} from "./arcNoMarketContract";

export function isZamaNoMarketChain(chain: ChainConfig) {
  return chain.id === "zama";
}

export function isPublicNoMarketChain(chain: ChainConfig) {
  return chain.id === "arc";
}

export function getNoMarketWriteChain(chain: ChainConfig): Chain | undefined {
  if (chain.id === "zama") return targetChain;
  if (chain.id === "arc") return arcTestnet;
  return undefined;
}

export function getNoMarketContractAddress(chain: ChainConfig): Address | undefined {
  if (chain.id === "zama") return noMarketAddress;
  if (chain.id === "arc") return arcNoMarketAddress;
  return undefined;
}

export function requireNoMarketContractAddress(chain: ChainConfig): Address {
  if (chain.id === "zama") return requireNoMarketAddress();
  if (chain.id === "arc") return requireArcNoMarketAddress();
  throw new Error(`${chain.name} is not a supported NoMarket chain.`);
}

export function getNoMarketDeployBlock(chain: ChainConfig) {
  if (chain.id === "zama") return noMarketDeployBlock;
  if (chain.id === "arc") return arcNoMarketDeployBlock;
  return 0n;
}

export function getNoMarketContractAbi(chain: ChainConfig) {
  return isZamaNoMarketChain(chain) ? noMarketAbi : arcNoMarketAbi;
}

export function getUmaResolverAddress(chain: ChainConfig): Address | undefined {
  if (chain.id === "arc") return arcUmaResolverAddress;
  return getNoMarketContractAddress(chain);
}

export function requireUmaSettlementAddress(chain: ChainConfig): Address {
  if (chain.id === "arc") return requireArcUmaResolverAddress();
  return requireNoMarketContractAddress(chain);
}

export function isLiveNoMarketChain(chain: ChainConfig) {
  return Boolean(chain.enabled && chain.isEVM && getNoMarketWriteChain(chain) && getNoMarketContractAddress(chain));
}
