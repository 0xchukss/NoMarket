import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bookmark, ExternalLink, Newspaper, Share2 } from "lucide-react";
import { featuredMarket, probabilitySeries, type Market } from "../lib/mockMarkets";
import { MarketVisualBadge } from "./MarketVisualBadge";

export function FeaturedMarket({ market = featuredMarket }: { market?: Market }) {
  return (
    <section className="rounded-2xl border border-white/8 bg-card p-4 shadow-panel">
      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <MarketVisualBadge market={market} size="lg" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500">{market.category}</p>
                <Link href={`/market/${market.id}`} className="mt-1 block text-lg font-bold leading-tight text-white hover:text-blue-300">
                  {market.title}
                </Link>
              </div>
            </div>
            <div className="flex shrink-0 gap-2 text-slate-500">
              <Share2 className="h-4 w-4" />
              <Bookmark className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 flex items-end gap-2">
            <span className="text-3xl font-black text-blue-400">{market.probability}%</span>
            <span className="pb-1 text-xs font-bold text-emerald-400">+{market.change}%</span>
            <span className="pb-1 text-xs text-slate-500">chance</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href={`/market/${market.id}?side=yes`} className="grid h-11 place-items-center rounded-lg bg-emerald-500/18 text-sm font-black text-emerald-300 hover:bg-emerald-500/25">
              Yes
            </Link>
            <Link href={`/market/${market.id}?side=no`} className="grid h-11 place-items-center rounded-lg bg-red-500/16 text-sm font-black text-red-300 hover:bg-red-500/24">
              No
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {["Draft a Boolean claim", "Track UMA automation", "Monitor encrypted settlement"].map((item) => (
              <div key={item} className="flex gap-2 text-xs text-slate-400">
                <Newspaper className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
                <span className="min-w-0">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-[230px] rounded-xl border border-white/5 bg-[#0a1118] p-3">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={probabilitySeries}>
              <defs>
                <linearGradient id="chanceGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#1499ff" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#1499ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: "#435466", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "#435466", fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                cursor={{ stroke: "#243447" }}
                contentStyle={{ background: "#101922", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, color: "#dbeafe", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="chance" stroke="#1499ff" strokeWidth={2.4} fill="url(#chanceGradient)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-end gap-3 text-[11px] text-slate-500">
            <span>Monthly</span>
            <span className="inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" /> NoMarket</span>
          </div>
        </div>
      </div>
    </section>
  );
}
