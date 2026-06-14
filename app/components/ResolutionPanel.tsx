import { Trophy } from "lucide-react";

type ResolutionAtom = {
  index: number;
  description: string;
  resolver?: string;
  resolved?: boolean;
  outcome?: 0 | 1;
};

type ResolutionPanelProps = {
  atoms?: ResolutionAtom[];
  status: "open" | "partiallyResolved" | "settled" | "resolved";
  outcomeVector?: number;
  totalPool?: number;
  winningPool?: number;
  isResolver?: boolean;
  onResolveAtom?: (index: number, outcome: 0 | 1) => void;
  onSubmitSettlement?: () => void;
};

export function ResolutionPanel({
  atoms = [],
  status,
  outcomeVector,
  totalPool,
  winningPool,
  isResolver,
  onResolveAtom,
  onSubmitSettlement
}: ResolutionPanelProps) {
  const settled = status === "settled" || status === "resolved";

  return (
    <section className={`rounded-2xl border p-4 ${settled ? "border-emerald-400/25 bg-emerald-400/8" : "border-white/8 bg-card"}`}>
      <div className="flex items-center gap-2">
        {settled && <Trophy className="h-5 w-5 text-emerald-300" />}
        <h2 className="text-sm font-black text-white">Resolution</h2>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">
        Each atom resolves independently. Once all atoms are resolved, Zama FHE settlement reveals only the winning combination,
        winning pool, and total pool.
      </p>

      {atoms.length > 0 && (
        <div className="mt-4 space-y-2">
          {atoms.map((atom) => (
            <div key={atom.index} className="grid gap-2 rounded-xl border border-white/7 bg-[#0b1219] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-xs font-black text-white">Atom {atom.index}: {atom.description}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {atom.resolved ? `Resolved ${atom.outcome ? "TRUE" : "FALSE"}` : "Pending"}
                </p>
              </div>
              {isResolver && !atom.resolved && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => onResolveAtom?.(atom.index, 1)} className="h-8 rounded-lg bg-emerald-500/18 px-3 text-xs font-black text-emerald-300">
                    Resolve TRUE
                  </button>
                  <button onClick={() => onResolveAtom?.(atom.index, 0)} className="h-8 rounded-lg bg-red-500/18 px-3 text-xs font-black text-red-300">
                    Resolve FALSE
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {settled ? (
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-slate-500">Winning combination</dt>
            <dd className="mt-1 font-black text-white">{outcomeVector ?? "Pending"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Winning pool</dt>
            <dd className="mt-1 font-black text-white">{winningPool ?? "Pending"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Total pool</dt>
            <dd className="mt-1 font-black text-white">{totalPool ?? "Pending"}</dd>
          </div>
        </dl>
      ) : (
        isResolver && (
          <button onClick={onSubmitSettlement} className="mt-4 h-10 rounded-lg bg-blue-500 px-4 text-xs font-black text-white">
            Submit Settlement
          </button>
        )
      )}
    </section>
  );
}
