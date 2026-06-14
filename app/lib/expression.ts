export type AtomChoice = "true" | "false" | "any";

export type Minterm = {
  outcomeMask: number;
  careMask: number;
};

function normalizeMinterm(minterm: Minterm): Minterm {
  return {
    outcomeMask: minterm.outcomeMask & minterm.careMask & 0xffff,
    careMask: minterm.careMask & 0xffff
  };
}

function expressionMatches(slot: number, minterms: Minterm[]) {
  return minterms.some((minterm) => (slot & minterm.careMask) === minterm.outcomeMask);
}

function maxAtomIndex(minterms: Minterm[]) {
  const mask = minterms.reduce((acc, minterm) => acc | minterm.careMask, 0);
  if (mask === 0) return 0;
  return Math.floor(Math.log2(mask)) + 1;
}

export class ExpressionBuilder {
  private minterms: Minterm[] = [];

  atom(index: number): ExpressionBuilder {
    return this.and(index);
  }

  notAtom(index: number): ExpressionBuilder {
    this.minterms = [normalizeMinterm({ outcomeMask: 0, careMask: 1 << index })];
    return this;
  }

  and(...atomIndices: number[]): ExpressionBuilder {
    const outcomeMask = atomIndices.reduce((mask, index) => mask | (1 << index), 0);
    const careMask = outcomeMask;
    this.minterms = [normalizeMinterm({ outcomeMask, careMask })];
    return this;
  }

  fromChoices(choices: AtomChoice[]): ExpressionBuilder {
    let outcomeMask = 0;
    let careMask = 0;
    choices.forEach((choice, index) => {
      if (choice === "any") return;
      careMask |= 1 << index;
      if (choice === "true") outcomeMask |= 1 << index;
    });
    this.minterms = [normalizeMinterm({ outcomeMask, careMask })];
    return this;
  }

  or(...exprs: ExpressionBuilder[]): ExpressionBuilder {
    this.minterms = exprs.flatMap((expr) => expr.toMinterms()).slice(0, 2);
    return this;
  }

  not(expr: ExpressionBuilder): ExpressionBuilder {
    const atomCount = Math.max(1, maxAtomIndex(expr.toMinterms()));
    const slots = 1 << atomCount;
    const minterms: Minterm[] = [];

    for (let slot = 0; slot < slots; slot += 1) {
      if (!expressionMatches(slot, expr.toMinterms())) {
        minterms.push({ outcomeMask: slot, careMask: slots - 1 });
      }
      if (minterms.length === 2) break;
    }

    this.minterms = minterms;
    return this;
  }

  ifThen(conditionAtoms: number[], conclusionAtoms: number[]): ExpressionBuilder {
    const conditionMask = conditionAtoms.reduce((mask, index) => mask | (1 << index), 0);
    const conclusionMask = conclusionAtoms.reduce((mask, index) => mask | (1 << index), 0);
    this.minterms = [
      normalizeMinterm({ outcomeMask: 0, careMask: conditionMask }),
      normalizeMinterm({
        outcomeMask: conditionMask | conclusionMask,
        careMask: conditionMask | conclusionMask
      })
    ];
    return this;
  }

  toMinterms(): Minterm[] {
    return this.minterms.map(normalizeMinterm).slice(0, 2);
  }

  describe(atomDescriptions: string[]): string {
    const minterms = this.toMinterms();
    if (minterms.length === 0) return "No expression selected";

    return minterms
      .map((minterm) => {
        const parts = atomDescriptions
          .map((description, index) => {
            const bit = 1 << index;
            if ((minterm.careMask & bit) === 0) return "";
            return (minterm.outcomeMask & bit) !== 0 ? description : `NOT (${description})`;
          })
          .filter(Boolean);
        return parts.length ? parts.join(" AND ") : "Any outcome";
      })
      .join(" OR ");
  }
}

export function encodeMinterms(minterms: Minterm[]) {
  const normalized = minterms.map(normalizeMinterm).slice(0, 2);
  const bytes = new Uint8Array(1 + normalized.length * 4);
  bytes[0] = normalized.length;
  normalized.forEach((minterm, index) => {
    const offset = 1 + index * 4;
    bytes[offset] = minterm.outcomeMask & 0xff;
    bytes[offset + 1] = (minterm.outcomeMask >> 8) & 0xff;
    bytes[offset + 2] = minterm.careMask & 0xff;
    bytes[offset + 3] = (minterm.careMask >> 8) & 0xff;
  });
  return Array.from(bytes);
}

export function decodeMinterms(bytes: number[]): Minterm[] {
  const count = bytes[0] ?? 0;
  const minterms: Minterm[] = [];
  for (let index = 0; index < count && index < 2; index += 1) {
    const offset = 1 + index * 4;
    minterms.push(
      normalizeMinterm({
        outcomeMask: (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8),
        careMask: (bytes[offset + 2] ?? 0) | ((bytes[offset + 3] ?? 0) << 8)
      })
    );
  }
  return minterms;
}

export function expressionProbability(minterms: Minterm[], q: number[], b: number) {
  if (!q.length || !b) return 0;
  const weights = q.map((qi) => Math.exp(qi / b));
  const denominator = weights.reduce((sum, value) => sum + value, 0);
  return q.reduce((sum, _qi, slot) => {
    if (!expressionMatches(slot, minterms)) return sum;
    return sum + weights[slot] / denominator;
  }, 0);
}

export function costOfBet(minterms: Minterm[], q: number[], b: number, stake: number) {
  if (!q.length || !b) return 0;
  const cost = (state: number[]) => b * Math.log(state.reduce((sum, qi) => sum + Math.exp(qi / b), 0));
  const newQ = q.map((qi, slot) => (expressionMatches(slot, minterms) ? qi + stake : qi));
  return cost(newQ) - cost(q);
}
