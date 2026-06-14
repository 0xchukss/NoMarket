import Link from "next/link";
import { Bookmark, Gift, Share2 } from "lucide-react";
import type { Market } from "../lib/mockMarkets";
import { MarketVisualBadge } from "./MarketVisualBadge";

export function MarketCard({ market }: { market: Market }) {
  return (
    <article className="rounded-xl border border-white/7 bg-card p-3 shadow-card transition hover:-translate-y-0.5 hover:border-blue-400/25">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-2.5">
          <MarketVisualBadge market={market} size="sm" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">{market.category}</p>
            <Link href={`/market/${market.id}`} className="mt-1 line-clamp-2 text-xs font-black leading-4 text-slate-100 hover:text-blue-300">
              {market.title}
            </Link>
          </div>
        </div>
        <div className="rounded-full border border-blue-400/20 bg-blue-400/8 px-2 py-1 text-right">
          <p className="text-sm font-black text-white">{market.probability}%</p>
          <p className="text-[9px] text-slate-500">chance</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {market.outcomes.map((outcome) => (
          <div key={outcome.label} className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  outcome.tone === "no" ? "bg-red-400" : outcome.tone === "yes" ? "bg-emerald-400" : "bg-blue-400"
                }`}
              />
              <span className="truncate font-semibold text-slate-300">{outcome.label}</span>
            </div>
            <span className="font-black text-slate-100">{outcome.probability}%</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href={`/market/${market.id}?side=yes`} className="grid h-8 place-items-center rounded-lg bg-emerald-500/18 text-xs font-black text-emerald-300 hover:bg-emerald-500/25">Yes</Link>
        <Link href={`/market/${market.id}?side=no`} className="grid h-8 place-items-center rounded-lg bg-red-500/16 text-xs font-black text-red-300 hover:bg-red-500/24">No</Link>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>{market.volume}</span>
        <div className="flex items-center gap-2">
          <Gift className="h-3.5 w-3.5" />
          <Share2 className="h-3.5 w-3.5" />
          <Bookmark className="h-3.5 w-3.5" />
        </div>
      </div>
    </article>
  );
}
