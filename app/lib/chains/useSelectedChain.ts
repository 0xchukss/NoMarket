import { useEffect, useState } from "react";
import { getChainConfig, getStoredChainId, setStoredChainId, type ChainId } from ".";

export function useSelectedChain() {
  const [chainId, setChainId] = useState<ChainId>("zama");

  useEffect(() => {
    setChainId(getStoredChainId());
    function onChainChange(event: Event) {
      const next = (event as CustomEvent<ChainId>).detail;
      if (next) setChainId(next);
    }
    function onStorageChange() {
      setChainId(getStoredChainId());
    }
    window.addEventListener("nomarket:chain-change", onChainChange);
    window.addEventListener("storage", onStorageChange);
    return () => {
      window.removeEventListener("nomarket:chain-change", onChainChange);
      window.removeEventListener("storage", onStorageChange);
    };
  }, []);

  return {
    chainId,
    chain: getChainConfig(chainId),
    setChainId: (next: ChainId) => {
      setStoredChainId(next);
      setChainId(next);
    }
  };
}
