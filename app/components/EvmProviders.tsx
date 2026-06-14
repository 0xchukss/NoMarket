import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { IndexedDBStorage, RelayerWeb, SepoliaConfig, type ZamaSDKEvent } from "@zama-fhe/sdk";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { WagmiProvider, useChainId } from "wagmi";
import { wagmiConfig } from "../lib/evm/wagmiConfig";
import { WagmiSigner } from "../lib/evm/wagmiSigner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
});

const signer = new WagmiSigner({ config: wagmiConfig });

function ZamaRuntimeProvider({ children }: { children: ReactNode }) {
  const chainId = useChainId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const runtime = useMemo(() => {
    if (!mounted) return null;
    const relayer = new RelayerWeb({
      getChainId: () => signer.getChainId(),
      transports: {
        [SepoliaConfig.chainId]: SepoliaConfig
      }
    });
    return {
      relayer,
      storage: new IndexedDBStorage("NoMarketKeypairStore", 1),
      sessionStorage: new IndexedDBStorage("NoMarketSignatureStore", 1)
    };
  }, [chainId, mounted]);

  useEffect(() => {
    return () => runtime?.relayer.terminate();
  }, [runtime]);

  if (!runtime) {
    return <>{children}</>;
  }

  function dispatchEvent(event: ZamaSDKEvent) {
    window.dispatchEvent(new CustomEvent(event.type, { detail: event }));
  }

  return (
    <ZamaProvider
      relayer={runtime.relayer}
      signer={signer}
      storage={runtime.storage}
      sessionStorage={runtime.sessionStorage}
      onEvent={dispatchEvent}
    >
      {children}
    </ZamaProvider>
  );
}

export function EvmProviders({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: "#3b82f6", borderRadius: "small" })}>
          <ZamaRuntimeProvider>{children}</ZamaRuntimeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
