export type AtomResolutionOutcome = "unknown" | "true" | "false";

export type AtomResolutionDraft = {
  outcome: AtomResolutionOutcome;
  evidence: string;
  sourceUrl?: string;
  updatedAt?: string;
};

export type MarketResolutionStatus = "draft" | "ready" | "proposed" | "resolved" | "disputed";

export type MarketResolutionDraft = {
  status: MarketResolutionStatus;
  atomOutcomes: AtomResolutionDraft[];
  outcomeVector?: number;
  claim?: string;
  assertionId?: string;
  proposalTx?: string;
  settlementTx?: string;
  resolvedTx?: string;
  updatedAt?: string;
};

export type ResolutionAtomLike = {
  description: string;
  uma?: {
    question?: string;
  };
};

export function createEmptyResolutionState(atomCount: number): MarketResolutionDraft {
  return {
    status: "draft",
    atomOutcomes: Array.from({ length: atomCount }, () => ({
      outcome: "unknown" as const,
      evidence: ""
    }))
  };
}

export function normalizeResolutionState(
  value: MarketResolutionDraft | undefined,
  atomCount: number
): MarketResolutionDraft {
  const fallback = createEmptyResolutionState(atomCount);
  if (!value) return fallback;

  const atomOutcomes = Array.from({ length: atomCount }, (_, index) => {
    const existing = value.atomOutcomes?.[index];
    const outcome: AtomResolutionOutcome =
      existing?.outcome === "true" || existing?.outcome === "false" ? existing.outcome : "unknown";
    return {
      outcome,
      evidence: existing?.evidence || "",
      sourceUrl: existing?.sourceUrl,
      updatedAt: existing?.updatedAt
    };
  });

  const outcomeVector =
    typeof value.outcomeVector === "number" && Number.isInteger(value.outcomeVector)
      ? value.outcomeVector
      : getOutcomeVector(atomOutcomes);

  return {
    ...fallback,
    ...value,
    atomOutcomes,
    outcomeVector,
    status: value.status || (outcomeVector === undefined ? "draft" : "ready")
  };
}

export function getOutcomeVector(atomOutcomes: Pick<AtomResolutionDraft, "outcome">[]) {
  if (atomOutcomes.length === 0 || atomOutcomes.some((atom) => atom.outcome === "unknown")) {
    return undefined;
  }

  return atomOutcomes.reduce((vector, atom, index) => {
    if (atom.outcome !== "true") return vector;
    return vector | (1 << index);
  }, 0);
}

export function formatOutcomeVectorBinary(outcomeVector: number | undefined, atomCount: number) {
  if (outcomeVector === undefined) return "pending";
  return `0b${outcomeVector.toString(2).padStart(Math.max(1, atomCount), "0")}`;
}

export function describeAtomTruth(outcome: AtomResolutionOutcome) {
  if (outcome === "true") return "TRUE";
  if (outcome === "false") return "FALSE";
  return "PENDING";
}

export function buildUmaResolutionClaim(input: {
  marketTitle: string;
  networkName: string;
  atoms: ResolutionAtomLike[];
  atomOutcomes: AtomResolutionDraft[];
  outcomeVector: number;
}) {
  const atomLines = input.atoms.map((atom, index) => {
    const draft = input.atomOutcomes[index];
    const truth = describeAtomTruth(draft?.outcome || "unknown");
    const evidence = draft?.evidence?.trim() || "Resolver evidence not provided in the UI.";
    const question = atom.uma?.question?.trim();
    return [
      `Atom ${index}: ${truth}`,
      `Event: ${atom.description}`,
      question ? `UMA question: ${question}` : undefined,
      `Evidence: ${evidence}`
    ]
      .filter(Boolean)
      .join(" | ");
  });

  return [
    `NoMarket resolution for "${input.marketTitle}" on ${input.networkName}.`,
    `Final combinatorial outcome vector: ${input.outcomeVector} (${formatOutcomeVectorBinary(input.outcomeVector, input.atoms.length)}).`,
    "Atom order is zero-indexed and bit N is 1 only when Atom N resolved TRUE.",
    ...atomLines,
    "If this assertion is undisputed through the UMA liveness window, NoMarket should settle this market to the stated outcome vector."
  ].join("\n");
}

export function getResolutionStatus(input: {
  localStatus?: MarketResolutionStatus;
  complete: boolean;
  proposed: boolean;
  resolved: boolean;
}) {
  if (input.resolved) return "resolved" as const;
  if (input.proposed) return "proposed" as const;
  if (input.complete) return "ready" as const;
  return input.localStatus || "draft";
}
