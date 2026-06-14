import { ChevronRight, Flame } from "lucide-react";

type SidebarPanelProps = {
  title: string;
  items: string[];
  hot?: boolean;
};

export function SidebarPanel({ title, items, hot }: SidebarPanelProps) {
  return (
    <section className="rounded-2xl border border-white/8 bg-[#0d141c] p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black text-white">{title}</h2>
        <ChevronRight className="h-4 w-4 text-slate-500" />
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item} className="grid grid-cols-[18px_1fr_auto] items-center gap-2 text-xs">
            <span className="text-slate-600">{index + 1}</span>
            <span className="line-clamp-2 font-semibold text-slate-300">{item}</span>
            <span className={hot ? "text-emerald-400" : "text-blue-300"}>
              {hot ? <Flame className="h-3.5 w-3.5" /> : `${17 + index * 8}%`}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
