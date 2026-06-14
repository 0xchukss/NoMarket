import clsx from "clsx";
import type { Market } from "../lib/mockMarkets";
import type { MarketVisual } from "../lib/marketVisuals";

function fallbackLabel(assetLabel: string | undefined, marketIcon: string) {
  return (assetLabel || marketIcon || "NM").slice(0, 3).toUpperCase();
}

export function MarketVisualBadge({
  market,
  visual,
  size = "md"
}: {
  market?: Pick<Market, "icon" | "title" | "visual">;
  visual?: MarketVisual;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const resolved = visual || market?.visual;
  const assets = resolved?.assets?.length ? resolved.assets.slice(0, 2) : [];
  const marketIcon = market?.icon || "NM";
  const title = market?.title || "Market";
  const className = clsx(
    "oracle-visual-badge",
    size === "sm" && "oracle-visual-badge--sm",
    size === "md" && "oracle-visual-badge--md",
    size === "lg" && "oracle-visual-badge--lg",
    size === "xl" && "oracle-visual-badge--xl",
    assets.length > 1 && "oracle-visual-badge--pair"
  );

  if (assets.length === 0) {
    return (
      <div className={className} aria-label={`${title} visual`}>
        <span className="oracle-visual-asset">{fallbackLabel(undefined, marketIcon)}</span>
      </div>
    );
  }

  return (
    <div className={className} aria-label={`${title} visual`}>
      {assets.map((asset, index) => (
        <span key={`${asset.src}-${index}`} className="oracle-visual-asset">
          <span>{fallbackLabel(asset.label, marketIcon)}</span>
          <img
            src={asset.src}
            alt={asset.alt}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.style.opacity = "0";
            }}
          />
        </span>
      ))}
    </div>
  );
}
