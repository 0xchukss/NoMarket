import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { ExpressionBuilder, type AtomChoice, type Minterm } from "../lib/expression";

type AtomInput = {
  description: string;
};

type ExpressionBuilderUIProps = {
  atoms: AtomInput[];
  embedded?: boolean;
  privacyNote?: string;
  onChange: (minterms: Minterm[], description: string) => void;
};

const choices: Array<{ value: AtomChoice; label: string; icon?: typeof Check }> = [
  { value: "true", label: "TRUE", icon: Check },
  { value: "false", label: "FALSE", icon: X },
  { value: "any", label: "DON'T CARE" }
];

export function ExpressionBuilderUI({ atoms, embedded = false, privacyNote, onChange }: ExpressionBuilderUIProps) {
  const [atomChoices, setAtomChoices] = useState<AtomChoice[]>(atoms.map(() => "any"));
  const [logic, setLogic] = useState<"AND" | "OR" | "IF_THEN">("AND");

  const expression = useMemo(() => {
    if (logic === "IF_THEN") {
      const conditionAtoms = atomChoices
        .map((choice, index) => (choice === "true" ? index : -1))
        .filter((index) => index >= 0);
      const conclusionAtoms = atomChoices
        .map((choice, index) => (choice === "false" ? index : -1))
        .filter((index) => index >= 0);
      return new ExpressionBuilder().ifThen(conditionAtoms, conclusionAtoms);
    }

    if (logic === "OR") {
      const exprs = atomChoices.flatMap((choice, index) => {
        if (choice === "true") return [new ExpressionBuilder().atom(index)];
        if (choice === "false") return [new ExpressionBuilder().notAtom(index)];
        return [];
      });
      return new ExpressionBuilder().or(...exprs);
    }

    return new ExpressionBuilder().fromChoices(atomChoices);
  }, [atomChoices, logic]);

  const atomDescriptions = useMemo(() => atoms.map((atom) => atom.description), [atoms]);
  const description = useMemo(() => expression.describe(atomDescriptions), [atomDescriptions, expression]);
  const minterms = useMemo(() => expression.toMinterms(), [expression]);

  useEffect(() => {
    setAtomChoices(atoms.map(() => "any"));
  }, [atoms]);

  useEffect(() => {
    onChange(minterms, description);
  }, [description, minterms]);

  function updateChoice(index: number, choice: AtomChoice) {
    setAtomChoices((currentChoices) =>
      currentChoices.map((current, currentIndex) => (currentIndex === index ? choice : current))
    );
  }

  function updateLogic(nextLogic: "AND" | "OR" | "IF_THEN") {
    setLogic(nextLogic);
  }

  return (
    <section data-tour-id="expression-builder" className={embedded ? "" : "rounded-2xl border border-white/8 bg-card p-4"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-black text-white">Expression Builder</h2>
        <select
          value={logic}
          onChange={(event) => updateLogic(event.target.value as "AND" | "OR" | "IF_THEN")}
          className="h-8 rounded-lg border border-white/8 bg-[#0b1219] px-3 text-xs font-black text-slate-200 outline-none"
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
          <option value="IF_THEN">IF...THEN</option>
        </select>
      </div>

      <div className="mt-4 space-y-2">
        {atoms.map((atom, index) => (
          <div key={`${atom.description}-${index}`} className="grid gap-2 rounded-xl border border-white/7 bg-[#0b1219] p-3 md:grid-cols-[1fr_auto] md:items-center">
            <span className="text-xs font-bold text-slate-200">Atom {index}: {atom.description}</span>
            <div className="grid grid-cols-3 gap-1">
              {choices.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  onClick={() => updateChoice(index, choice.value)}
                  className={`h-8 rounded-lg px-2 text-[10px] font-black ${
                    atomChoices[index] === choice.value
                      ? "bg-blue-500 text-white"
                      : "bg-white/[0.04] text-slate-500 hover:text-slate-200"
                  }`}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-blue-400/15 bg-blue-400/8 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-blue-300">Preview</p>
        <p className="mt-1 text-xs leading-5 text-slate-200">Bet wins if: {description}</p>
        <p className="mt-2 text-[11px] text-slate-500">
          {privacyNote || "Public odds use LMSR aggregates. Position privacy follows the selected network adapter."}
        </p>
      </div>
    </section>
  );
}
