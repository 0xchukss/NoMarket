import dynamic from "next/dynamic";

const ConnectButton = dynamic(async () => (await import("@rainbow-me/rainbowkit")).ConnectButton, { ssr: false });

export function WalletConnect() {
  return <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />;
}
