export interface SeedMarket {
  id: string;
  condition: string;
  ethStaked: number;
  odds: number;
}

export const SEED_MARKETS: SeedMarket[] = [
  {
    id: "fed-btc-q4-2026",
    condition: "Fed cuts rates AND BTC > $100k by Q4 2026",
    ethStaked: 12.4,
    odds: 34,
  },
  {
    id: "eth-5k-sol-flip",
    condition: "ETH > $5k AND Solana flips ETH in TVL",
    ethStaked: 8.7,
    odds: 52,
  },
  {
    id: "trump-2028-gop-sweep",
    condition: "Trump wins 2028 nomination AND Republican sweep",
    ethStaked: 3.2,
    odds: 18,
  },
];
