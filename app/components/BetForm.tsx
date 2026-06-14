import { FormEvent, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import type { BaseEvent } from "../lib/combinatorial";
import type { Minterm } from "../lib/expression";
import { ExpressionBuilderUI } from "./ExpressionBuilderUI";

type BetFormProps = {
  disabled?: boolean;
  events: BaseEvent[];
  examples?: string[];
  onSubmit: (stakeSol: string, minterms: Minterm[]) => Promise<void>;
};

export function BetForm({ disabled, events, onSubmit }: BetFormProps) {
  const [stake, setStake] = useState("0.1");
  const [minterms, setMinterms] = useState<Minterm[]>([]);
  const [preview, setPreview] = useState("No expression selected");
  const [status, setStatus] = useState<"idle" | "encrypting" | "mpc" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!minterms.length) {
      setError("Choose at least one atom condition.");
      return;
    }

    setStatus("encrypting");
    try {
      await onSubmit(stake, minterms);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place private combinatorial bet.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/8 bg-card p-4">
      <ExpressionBuilderUI
        atoms={events.map((event) => ({ description: event.label }))}
        onChange={(nextMinterms, description) => {
          setMinterms(nextMinterms);
          setPreview(description);
        }}
      />

      <div className="rounded-xl border border-blue-400/15 bg-blue-400/8 p-3 text-xs text-slate-300">
        <p className="font-black text-blue-300">Public/private boundary</p>
        <p className="mt-1 leading-5">
          Public: atom list and aggregate LMSR odds. Private: your stake, expression, and per-outcome pool impact.
        </p>
      </div>

      <label className="block text-xs font-black text-slate-400" htmlFor="stake">
        Stake
      </label>
      <div className="flex rounded-xl border border-white/8 bg-[#0b1219]">
        <input
          id="stake"
          value={stake}
          onChange={(event) => setStake(event.target.value)}
          inputMode="decimal"
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none"
          disabled={disabled || status === "encrypting" || status === "mpc"}
        />
        <span className="border-l border-white/8 px-3 py-3 text-sm font-black text-slate-500">SOL</span>
      </div>

      <div className="rounded-xl border border-white/7 bg-[#0b1219] p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Expression preview</p>
        <p className="mt-1 text-xs leading-5 text-slate-300">{preview}</p>
      </div>

      <button
        type="submit"
        disabled={disabled || status === "encrypting" || status === "mpc"}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 text-sm font-black text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "encrypting" && <Lock className="h-4 w-4 animate-pulse" />}
        {status === "mpc" && <Lock className="h-4 w-4 animate-pulse" />}
        {status === "done" && <ShieldCheck className="h-4 w-4" />}
        {status === "encrypting"
          ? "Encrypting expression..."
          : status === "mpc"
            ? "Awaiting FHE confirmation..."
            : status === "done"
              ? "On-chain bet submitted"
              : "Place private combinatorial bet"}
      </button>

      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
