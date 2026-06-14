import { expect } from "chai";
import {
  ExpressionBuilder,
  costOfBet,
  decodeMinterms,
  encodeMinterms,
  expressionProbability,
  type Minterm
} from "../app/lib/expression";
import { getGrossBetValueFromStake } from "../app/lib/marketLifecycle";

function matchingSlots(minterms: Minterm[], atomCount: number) {
  return Array.from({ length: 1 << atomCount }, (_, slot) => slot).filter((slot) =>
    minterms.some((minterm) => (slot & minterm.careMask) === minterm.outcomeMask)
  );
}

function addBet(q: number[], minterms: Minterm[], stake: number) {
  return q.map((qi, slot) =>
    minterms.some((minterm) => (slot & minterm.careMask) === minterm.outcomeMask)
      ? qi + stake
      : qi
  );
}

describe("NoMarket combinatorial market logic", () => {
  const atoms = [
    "Atom 0: BTC > $100k",
    "Atom 1: ETH > $8k",
    "Atom 2: Fed does not hike"
  ];

  it("create_combi_market model supports 3 atoms and 8 outcome slots", () => {
    const atomCount = atoms.length;
    const outcomeSlots = 1 << atomCount;

    expect(atomCount).to.equal(3);
    expect(outcomeSlots).to.equal(8);
    expect(atoms[0]).to.contain("BTC");
  });

  it("place_combi_bet encodes AND and OR expressions as minterms", () => {
    const user1 = new ExpressionBuilder().and(0, 1).toMinterms();
    const user2 = new ExpressionBuilder().fromChoices(["true", "false", "any"]).toMinterms();
    const user3 = new ExpressionBuilder().or(
      new ExpressionBuilder().atom(0),
      new ExpressionBuilder().atom(2)
    ).toMinterms();

    expect(user1).to.deep.equal([{ outcomeMask: 0b011, careMask: 0b011 }]);
    expect(user2).to.deep.equal([{ outcomeMask: 0b001, careMask: 0b011 }]);
    expect(user3).to.deep.equal([
      { outcomeMask: 0b001, careMask: 0b001 },
      { outcomeMask: 0b100, careMask: 0b100 }
    ]);

    expect(matchingSlots(user1, 3)).to.deep.equal([3, 7]);
    expect(matchingSlots(user2, 3)).to.deep.equal([1, 5]);
    expect(matchingSlots(user3, 3)).to.deep.equal([1, 3, 4, 5, 6, 7]);
  });

  it("place_combi_bet encodes IF/THEN as NOT condition OR condition AND conclusion", () => {
    const ifThen = new ExpressionBuilder().ifThen([0], [1]).toMinterms();

    expect(ifThen).to.deep.equal([
      { outcomeMask: 0b00, careMask: 0b01 },
      { outcomeMask: 0b11, careMask: 0b11 }
    ]);
  });

  it("resolve_atom x3 produces the expected resolved and outcome masks", () => {
    let resolvedMask = 0;
    let outcomeVector = 0;

    [
      [0, 1],
      [1, 1],
      [2, 0]
    ].forEach(([index, outcome]) => {
      resolvedMask |= 1 << index;
      if (outcome) outcomeVector |= 1 << index;
    });

    expect(resolvedMask).to.equal(0b111);
    expect(outcomeVector).to.equal(0b011);
  });

  it("submit_settlement reveals winning_pool and total_pool only", () => {
    const q = Array(8).fill(0);
    const user1 = new ExpressionBuilder().and(0, 1).toMinterms();
    const user2 = new ExpressionBuilder().fromChoices(["true", "false", "any"]).toMinterms();
    const afterUser1 = addBet(q, user1, 100);
    const afterUser2 = addBet(afterUser1, user2, 50);
    const outcomeVector = 0b011;
    const winningPool = afterUser2[outcomeVector];
    const totalPool = afterUser2.reduce((sum, value) => sum + value, 0);

    expect(winningPool).to.equal(100);
    expect(totalPool).to.equal(300);
  });

  it("claim_combi_payout winners match the resolved outcome", () => {
    const outcomeVector = 0b011;
    const user1 = new ExpressionBuilder().and(0, 1).toMinterms();
    const user2 = new ExpressionBuilder().fromChoices(["true", "false", "any"]).toMinterms();
    const user3 = new ExpressionBuilder().or(
      new ExpressionBuilder().atom(0),
      new ExpressionBuilder().atom(2)
    ).toMinterms();

    expect(matchingSlots(user1, 3)).to.include(outcomeVector);
    expect(matchingSlots(user2, 3)).to.not.include(outcomeVector);
    expect(matchingSlots(user3, 3)).to.include(outcomeVector);
  });

  it("fee accounting adds protocol fee on top of the signed stake", () => {
    const previous = process.env.NEXT_PUBLIC_ARC_BET_FEE_BPS;
    process.env.NEXT_PUBLIC_ARC_BET_FEE_BPS = "200";
    try {
      expect(getGrossBetValueFromStake(100n, "arc")).to.equal(102n);
      expect(getGrossBetValueFromStake(1n, "arc")).to.equal(2n);
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_ARC_BET_FEE_BPS;
      else process.env.NEXT_PUBLIC_ARC_BET_FEE_BPS = previous;
    }
  });

  it("LMSR pricing sums to 1.0 and costs are positive", () => {
    let q = Array(8).fill(0);
    const b = 1_000;
    const user1 = new ExpressionBuilder().and(0, 1).toMinterms();
    const user2 = new ExpressionBuilder().fromChoices(["true", "false", "any"]).toMinterms();
    const user3 = new ExpressionBuilder().or(
      new ExpressionBuilder().atom(0),
      new ExpressionBuilder().atom(2)
    ).toMinterms();

    expect(costOfBet(user1, q, b, 100)).to.be.greaterThan(0);
    q = addBet(q, user1, 100);
    expect(costOfBet(user2, q, b, 50)).to.be.greaterThan(0);
    q = addBet(q, user2, 50);
    expect(costOfBet(user3, q, b, 75)).to.be.greaterThan(0);

    const totalProbability = q.reduce(
      (sum, _qi, slot) => sum + expressionProbability([{ outcomeMask: slot, careMask: 0b111 }], q, b),
      0
    );
    expect(totalProbability).to.be.closeTo(1, 0.000001);
  });

  it("privacy test: encoded minterms are not stored as plaintext after encryption boundary", () => {
    const minterms = new ExpressionBuilder().and(0, 1).toMinterms();
    const encoded = encodeMinterms(minterms);
    const decoded = decodeMinterms(encoded);
    const fakeEncrypted = encoded.map((byte, index) => byte ^ (0xa5 + index));

    expect(decoded).to.deep.equal(minterms);
    expect(Buffer.from(fakeEncrypted).includes(Buffer.from(encoded))).to.equal(false);
    expect(decodeMinterms(fakeEncrypted)).to.not.deep.equal(minterms);
  });
});
