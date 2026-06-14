export type MarketVisualAsset = {
  src: string;
  alt: string;
  label: string;
};

export type MarketVisual = {
  kind: "single" | "pair";
  assets: MarketVisualAsset[];
  source: "auto" | "custom";
};

type VisualInput = {
  title: string;
  category?: string;
  atoms?: Array<{ description: string; uma?: { question?: string } }>;
  imageUrls?: string[];
};

type KnownVisual = {
  aliases: string[];
  asset: MarketVisualAsset;
};

function wikiFile(file: string) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=160`;
}

function flag(code: string) {
  return `https://flagcdn.com/w160/${code}.png`;
}

const cryptoVisuals: KnownVisual[] = [
  { aliases: ["btc", "bitcoin"], asset: { src: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png", alt: "Bitcoin logo", label: "BTC" } },
  { aliases: ["eth", "ethereum", "ether"], asset: { src: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", alt: "Ethereum logo", label: "ETH" } },
  { aliases: ["sol", "solana"], asset: { src: "https://assets.coingecko.com/coins/images/4128/small/solana.png", alt: "Solana logo", label: "SOL" } },
  { aliases: ["usdc"], asset: { src: "https://assets.coingecko.com/coins/images/6319/small/usdc.png", alt: "USDC logo", label: "USDC" } },
  { aliases: ["usdt", "tether"], asset: { src: "https://assets.coingecko.com/coins/images/325/small/Tether.png", alt: "Tether logo", label: "USDT" } },
  { aliases: ["xrp", "ripple"], asset: { src: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png", alt: "XRP logo", label: "XRP" } },
  { aliases: ["doge", "dogecoin"], asset: { src: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png", alt: "Dogecoin logo", label: "DOGE" } },
  { aliases: ["arb", "arbitrum"], asset: { src: "https://assets.coingecko.com/coins/images/16547/small/arb.jpg", alt: "Arbitrum logo", label: "ARB" } },
  { aliases: ["op", "optimism"], asset: { src: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png", alt: "Optimism logo", label: "OP" } },
  { aliases: ["link", "chainlink"], asset: { src: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png", alt: "Chainlink logo", label: "LINK" } }
];

const countryVisuals: KnownVisual[] = [
  { aliases: ["hong kong", "hk"], asset: { src: flag("hk"), alt: "Hong Kong flag", label: "HK" } },
  { aliases: ["mongolia"], asset: { src: flag("mn"), alt: "Mongolia flag", label: "MN" } },
  { aliases: ["united states", "usa", "u.s.", "america"], asset: { src: flag("us"), alt: "United States flag", label: "US" } },
  { aliases: ["united kingdom", "uk", "britain"], asset: { src: flag("gb"), alt: "United Kingdom flag", label: "UK" } },
  { aliases: ["england"], asset: { src: flag("gb-eng"), alt: "England flag", label: "ENG" } },
  { aliases: ["france"], asset: { src: flag("fr"), alt: "France flag", label: "FR" } },
  { aliases: ["germany"], asset: { src: flag("de"), alt: "Germany flag", label: "DE" } },
  { aliases: ["spain"], asset: { src: flag("es"), alt: "Spain flag", label: "ES" } },
  { aliases: ["italy"], asset: { src: flag("it"), alt: "Italy flag", label: "IT" } },
  { aliases: ["nigeria"], asset: { src: flag("ng"), alt: "Nigeria flag", label: "NG" } },
  { aliases: ["ghana"], asset: { src: flag("gh"), alt: "Ghana flag", label: "GH" } },
  { aliases: ["kenya"], asset: { src: flag("ke"), alt: "Kenya flag", label: "KE" } },
  { aliases: ["south africa"], asset: { src: flag("za"), alt: "South Africa flag", label: "ZA" } },
  { aliases: ["china"], asset: { src: flag("cn"), alt: "China flag", label: "CN" } },
  { aliases: ["japan"], asset: { src: flag("jp"), alt: "Japan flag", label: "JP" } },
  { aliases: ["india"], asset: { src: flag("in"), alt: "India flag", label: "IN" } },
  { aliases: ["brazil"], asset: { src: flag("br"), alt: "Brazil flag", label: "BR" } },
  { aliases: ["argentina"], asset: { src: flag("ar"), alt: "Argentina flag", label: "AR" } },
  { aliases: ["mexico"], asset: { src: flag("mx"), alt: "Mexico flag", label: "MX" } },
  { aliases: ["canada"], asset: { src: flag("ca"), alt: "Canada flag", label: "CA" } },
  { aliases: ["russia"], asset: { src: flag("ru"), alt: "Russia flag", label: "RU" } },
  { aliases: ["ukraine"], asset: { src: flag("ua"), alt: "Ukraine flag", label: "UA" } },
  { aliases: ["turkey"], asset: { src: flag("tr"), alt: "Turkey flag", label: "TR" } },
  { aliases: ["qatar"], asset: { src: flag("qa"), alt: "Qatar flag", label: "QA" } },
  { aliases: ["saudi arabia"], asset: { src: flag("sa"), alt: "Saudi Arabia flag", label: "SA" } },
  { aliases: ["uae", "united arab emirates"], asset: { src: flag("ae"), alt: "United Arab Emirates flag", label: "UAE" } },
  { aliases: ["australia"], asset: { src: flag("au"), alt: "Australia flag", label: "AU" } },
  { aliases: ["portugal"], asset: { src: flag("pt"), alt: "Portugal flag", label: "PT" } },
  { aliases: ["netherlands"], asset: { src: flag("nl"), alt: "Netherlands flag", label: "NL" } },
  { aliases: ["morocco"], asset: { src: flag("ma"), alt: "Morocco flag", label: "MA" } },
  { aliases: ["egypt"], asset: { src: flag("eg"), alt: "Egypt flag", label: "EG" } },
  { aliases: ["senegal"], asset: { src: flag("sn"), alt: "Senegal flag", label: "SN" } }
];

const clubVisuals: KnownVisual[] = [
  { aliases: ["arsenal"], asset: { src: "https://crests.football-data.org/57.png", alt: "Arsenal crest", label: "ARS" } },
  { aliases: ["chelsea"], asset: { src: "https://crests.football-data.org/61.png", alt: "Chelsea crest", label: "CHE" } },
  { aliases: ["liverpool"], asset: { src: "https://crests.football-data.org/64.png", alt: "Liverpool crest", label: "LIV" } },
  { aliases: ["manchester city", "man city"], asset: { src: "https://crests.football-data.org/65.png", alt: "Manchester City crest", label: "MCI" } },
  { aliases: ["manchester united", "man united"], asset: { src: "https://crests.football-data.org/66.png", alt: "Manchester United crest", label: "MUN" } },
  { aliases: ["tottenham", "spurs"], asset: { src: "https://crests.football-data.org/73.png", alt: "Tottenham Hotspur crest", label: "TOT" } },
  { aliases: ["barcelona", "fc barcelona"], asset: { src: "https://crests.football-data.org/81.png", alt: "Barcelona crest", label: "BAR" } },
  { aliases: ["real madrid"], asset: { src: "https://crests.football-data.org/86.png", alt: "Real Madrid crest", label: "RMA" } },
  { aliases: ["bayern", "bayern munich"], asset: { src: "https://crests.football-data.org/5.png", alt: "Bayern Munich crest", label: "BAY" } },
  { aliases: ["psg", "paris saint-germain"], asset: { src: "https://crests.football-data.org/524.png", alt: "Paris Saint-Germain crest", label: "PSG" } },
  { aliases: ["juventus"], asset: { src: "https://crests.football-data.org/109.png", alt: "Juventus crest", label: "JUV" } }
];

const personVisuals: KnownVisual[] = [
  { aliases: ["donald trump", "trump"], asset: { src: wikiFile("Donald Trump official portrait.jpg"), alt: "Donald Trump portrait", label: "TRP" } },
  { aliases: ["joe biden", "biden"], asset: { src: wikiFile("Joe Biden presidential portrait.jpg"), alt: "Joe Biden portrait", label: "BID" } },
  { aliases: ["kamala harris", "harris"], asset: { src: wikiFile("Kamala Harris Vice Presidential Portrait.jpg"), alt: "Kamala Harris portrait", label: "HAR" } },
  { aliases: ["vladimir putin", "putin"], asset: { src: wikiFile("Vladimir Putin (2024-05-07).jpg"), alt: "Vladimir Putin portrait", label: "PUT" } },
  { aliases: ["zelensky", "zelenskyy", "volodymyr zelenskyy"], asset: { src: wikiFile("Volodymyr Zelensky Official portrait.jpg"), alt: "Volodymyr Zelenskyy portrait", label: "ZEL" } }
];

const categoryFallbacks: Record<string, MarketVisualAsset> = {
  Sports: { src: wikiFile("Soccerball.svg"), alt: "Sports ball", label: "SP" },
  Crypto: { src: "/developer-icons/solidity.svg", alt: "Crypto smart contract icon", label: "CR" },
  Politics: { src: flag("un"), alt: "United Nations flag", label: "PL" },
  Geopolitics: { src: flag("un"), alt: "United Nations flag", label: "GP" },
  Tech: { src: "/developer-icons/typescript.svg", alt: "Technology icon", label: "TC" },
  Economy: { src: wikiFile("Circle-icons-money.svg"), alt: "Economy icon", label: "EC" },
  Culture: { src: wikiFile("Circle-icons-camera.svg"), alt: "Culture icon", label: "CU" },
  Weather: { src: wikiFile("Weather few clouds.svg"), alt: "Weather icon", label: "WE" },
  Featured: { src: "/developer-icons/nextjs.svg", alt: "Featured market icon", label: "NM" }
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[/_,-]+/g, " ");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsAlias(text: string, alias: string) {
  const normalizedAlias = normalizeText(alias).split(/\s+/).filter(Boolean).map(escapeRegex).join("\\s+");
  return new RegExp(`(^|[^a-z0-9])${normalizedAlias}([^a-z0-9]|$)`, "i").test(text);
}

function collectKnownAssets(text: string, groups: KnownVisual[]) {
  const seen = new Set<string>();
  const assets: MarketVisualAsset[] = [];
  for (const item of groups) {
    if (!item.aliases.some((alias) => containsAlias(text, alias))) continue;
    if (seen.has(item.asset.src)) continue;
    assets.push(item.asset);
    seen.add(item.asset.src);
    if (assets.length >= 2) break;
  }
  return assets;
}

function cleanCustomUrls(urls: string[] | undefined): MarketVisualAsset[] {
  return (urls || [])
    .map((url, index) => url.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((src, index) => ({
      src,
      alt: index === 0 ? "Primary market image" : "Secondary market image",
      label: index === 0 ? "A" : "B"
    }));
}

function defaultAsset(category?: string): MarketVisualAsset {
  return categoryFallbacks[category || ""] || {
    src: "/oracle-basalt.png",
    alt: "NoMarket basalt oracle visual",
    label: "NM"
  };
}

export function buildMarketVisual(input: VisualInput): MarketVisual {
  const custom = cleanCustomUrls(input.imageUrls);
  if (custom.length > 0) {
    return { kind: custom.length > 1 ? "pair" : "single", assets: custom, source: "custom" };
  }

  const text = normalizeText(
    [
      input.title,
      input.category || "",
      ...(input.atoms || []).map((atom) => `${atom.description} ${atom.uma?.question || ""}`)
    ].join(" ")
  );
  const category = input.category || "";
  const assets = [
    ...collectKnownAssets(text, cryptoVisuals),
    ...collectKnownAssets(text, clubVisuals),
    ...collectKnownAssets(text, countryVisuals),
    ...collectKnownAssets(text, personVisuals)
  ].filter((asset, index, all) => all.findIndex((candidate) => candidate.src === asset.src) === index);

  const chosen = assets.length > 0 ? assets.slice(0, 2) : [defaultAsset(category)];
  return { kind: chosen.length > 1 ? "pair" : "single", assets: chosen, source: "auto" };
}

export function normalizeMarketVisual(value: unknown, fallback: VisualInput): MarketVisual {
  if (value && typeof value === "object") {
    const source = value as Partial<MarketVisual>;
    const assets = Array.isArray(source.assets)
      ? source.assets
          .map((asset) => ({
            src: typeof asset.src === "string" ? asset.src.trim() : "",
            alt: typeof asset.alt === "string" ? asset.alt : "Market image",
            label: typeof asset.label === "string" ? asset.label : "NM"
          }))
          .filter((asset) => asset.src)
          .slice(0, 2)
      : [];
    if (assets.length > 0) {
      return {
        kind: assets.length > 1 ? "pair" : "single",
        assets,
        source: source.source === "custom" ? "custom" : "auto"
      };
    }
  }
  return buildMarketVisual(fallback);
}
