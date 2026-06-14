import { Bookmark, Filter, Search, SlidersHorizontal } from "lucide-react";
import { filterTabs } from "../lib/mockMarkets";

export function FilterTabs() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab, index) => (
          <button
            key={tab}
            className={`h-8 shrink-0 rounded-lg px-3 text-xs font-bold transition ${
              index === 0
                ? "bg-blue-500 text-white"
                : "border border-white/6 bg-white/[0.025] text-slate-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex gap-2 text-slate-400">
        {[Search, SlidersHorizontal, Filter, Bookmark].map((Icon, index) => (
          <button key={index} className="grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-white/[0.035] hover:text-white">
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
