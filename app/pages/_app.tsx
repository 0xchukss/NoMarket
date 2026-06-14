import type { AppProps } from "next/app";
import { EvmProviders } from "../components/EvmProviders";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <EvmProviders>
      <Component {...pageProps} />
    </EvmProviders>
  );
}
