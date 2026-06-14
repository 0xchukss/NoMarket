export type BaseEvent = {
  symbol: string;
  label: string;
};

export type CombinatorialSpec = {
  eventCount: number;
  rules: string;
  examples: string[];
  events: BaseEvent[];
};

export function compileCombinatorialClaim(expression: string, events: BaseEvent[]) {
  const normalized = expression.trim().toUpperCase().replace(/\s+/g, "");
  if (!normalized) {
    throw new Error("Enter a Boolean claim such as A&B or A|!B.");
  }

  const eventSymbols = new Set(events.map((event) => event.symbol.toUpperCase()));
  const allowed = /^[A-Z!&|()]+$/;
  if (!allowed.test(normalized)) {
    throw new Error("Use only event symbols, !, &, |, and parentheses.");
  }

  for (const token of normalized.match(/[A-Z]/g) || []) {
    if (!eventSymbols.has(token)) {
      throw new Error(`Unknown event symbol ${token}.`);
    }
  }

  // V1 uses a restricted compiled key instead of storing a public expression.
  // The key is deterministic client-side, then encrypted before it reaches Sepolia.
  let hash = 2166136261;
  for (const char of normalized) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return {
    normalized,
    claimKey: hash & 0xff
  };
}

export const demoCombinatorialSpec: CombinatorialSpec = {
  eventCount: 4,
  rules: "Restricted Boolean language over events A-D. Supports !, &, |, and parentheses. Client compiles the expression into an encrypted claim key.",
  examples: ["A&B", "A&!C", "(A|B)&D", "A beats B if C happens"],
  events: [
    { symbol: "A", label: "Duke reaches Final Four" },
    { symbol: "B", label: "UNC reaches Final Four" },
    { symbol: "C", label: "Duke beats UNC head-to-head" },
    { symbol: "D", label: "ACC team wins tournament" }
  ]
};
