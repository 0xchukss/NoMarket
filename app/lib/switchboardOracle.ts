export type UmaResolverState = {
  status: "watching" | "asserted" | "resolved";
  question?: string;
  assertionId?: string;
  outcomeVector?: number;
  livenessSeconds: number;
  resolvedAt?: string;
};

export function defaultUmaResolver(question = ""): UmaResolverState {
  return {
    status: "watching",
    question,
    livenessSeconds: Number(process.env.NEXT_PUBLIC_UMA_LIVENESS_SECONDS || 7200)
  };
}

export function describeUmaRule(state?: UmaResolverState) {
  if (!state) {
    return "UMA Optimistic Oracle assertion pending";
  }
  if (state.status === "resolved" && state.outcomeVector !== undefined) {
    return `UMA accepted outcome vector ${state.outcomeVector}.`;
  }
  if (state.assertionId) {
    return `UMA assertion ${state.assertionId.slice(0, 10)}... is in the challenge window.`;
  }
  return state.question || "Outcome vector is asserted to UMA and can be disputed during liveness.";
}
