import { buildMarketVisual, type MarketVisual } from "./marketVisuals";

export type Outcome = {
  label: string;
  probability: number;
  tone?: "yes" | "no" | "neutral";
};

export type Market = {
  id: string;
  icon: string;
  category: string;
  title: string;
  probability: number;
  change: number;
  volume: string;
  endDate: string;
  outcomes: Outcome[];
  visual: MarketVisual;
};

export const filterTabs = [
  "All",
  "Politics",
  "Crypto",
  "Sports",
  "Tech",
  "Economy",
  "Geopolitics",
  "Culture",
  "Weather"
];

export const bottomLinks = [
  "Trending",
  "Breaking",
  "New",
  "Politics",
  "Sports",
  "Crypto",
  "Finance",
  "Geopolitics",
  "Tech",
  "Culture",
  "Economy",
  "Weather"
];

export const probabilitySeries = [
  { day: "Apr 5", chance: 18 },
  { day: "Apr 8", chance: 24 },
  { day: "Apr 11", chance: 31 },
  { day: "Apr 14", chance: 27 },
  { day: "Apr 17", chance: 42 },
  { day: "Apr 20", chance: 38 },
  { day: "Apr 23", chance: 55 },
  { day: "Apr 26", chance: 49 },
  { day: "Apr 29", chance: 33 },
  { day: "May 2", chance: 36 }
];

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function boundedProbability(seed: string, min = 4, max = 96) {
  return min + (hashString(seed) % (max - min + 1));
}

function normalizeThree(values: number[]) {
  const total = values.reduce((sum, value) => sum + value, 0);
  const normalized = values.map((value) => Math.max(1, Math.round((value / total) * 100)));
  const drift = normalized.reduce((sum, value) => sum + value, 0) - 100;
  const largestIndex = normalized.indexOf(Math.max(...normalized));
  normalized[largestIndex] = Math.max(1, normalized[largestIndex] - drift);
  return normalized;
}

export function buildMarket(params: {
  id: string;
  icon?: string;
  category: string;
  title: string;
  volume?: string;
  endDate?: string;
  threeOutcomes?: boolean;
  visual?: MarketVisual;
}): Market {
  const probability = boundedProbability(`${params.id}:${params.title}`);
  const hasThreeOutcomes = params.threeOutcomes ?? false;
  const outcomes = hasThreeOutcomes
    ? normalizeThree([
        boundedProbability(`${params.id}:a`, 8, 80),
        boundedProbability(`${params.id}:b`, 8, 80),
        boundedProbability(`${params.id}:c`, 8, 80)
      ]).map((value, index) => ({
        label: ["Outcome A", "Outcome B", "Other"][index],
        probability: value,
        tone: index === 0 ? "yes" as const : index === 1 ? "no" as const : "neutral" as const
      }))
    : [
        { label: "Yes", probability, tone: "yes" as const },
        { label: "No", probability: 100 - probability, tone: "no" as const }
      ];

  return {
    id: params.id,
    icon: params.icon || "NM",
    category: params.category,
    title: params.title,
    probability: outcomes[0].probability,
    change: boundedProbability(`${params.id}:change`, 1, 9) * (hashString(params.id) % 2 === 0 ? 1 : -1),
    volume: params.volume || "$0 Vol.",
    endDate: params.endDate || "Draft",
    outcomes,
    visual: params.visual || buildMarketVisual({ title: params.title, category: params.category })
  };
}

export const featuredMarket: Market = buildMarket({
  id: "featured-market",
  icon: "NM",
  category: "Featured",
  title: "Untitled combinatorial market",
  volume: "$0 Vol.",
  endDate: "Draft"
});

export const markets: Market[] = Array.from({ length: 32 }, (_, index) => {
  const category = filterTabs[(index % (filterTabs.length - 1)) + 1];
  return buildMarket({
    id: `market-draft-${index + 1}`,
    icon: ["NM", "A", "B", "C", "D", "E", "F", "G"][index % 8],
    category,
    title: `Untitled combinatorial market ${index + 1}`,
    threeOutcomes: index % 4 === 0
  });
});

export const breakingNews = [
  "Market placeholder",
  "Resolver update placeholder",
  "Resolver note placeholder"
];

export const hotTopics = [
  "Boolean claims",
  "Private liquidity",
  "Tournament paths",
  "Conditional markets",
  "Encrypted payouts"
];
