import type { Address } from "viem";

export const arcNoMarketAddress = process.env.NEXT_PUBLIC_ARC_NOMARKET_ADDRESS as Address | undefined;
export const arcNoMarketDeployBlock = BigInt(process.env.NEXT_PUBLIC_ARC_DEPLOY_BLOCK || 0);
export const arcUmaResolverAddress = (process.env.NEXT_PUBLIC_ARC_UMA_RESOLVER_ADDRESS ||
  process.env.NEXT_PUBLIC_ARC_UMA_OOV2_ADDRESS ||
  process.env.NEXT_PUBLIC_ARC_MOCK_OOV3_ADDRESS) as Address | undefined;

export const arcNoMarketAbi = [
  {
    type: "function",
    name: "createMarket",
    stateMutability: "payable",
    inputs: [
      { name: "title", type: "string" },
      { name: "metadata", type: "string" },
      { name: "atomCount", type: "uint8" }
    ],
    outputs: [{ name: "marketId", type: "uint256" }]
  },
  {
    type: "function",
    name: "createTimedMarket",
    stateMutability: "payable",
    inputs: [
      { name: "title", type: "string" },
      { name: "metadata", type: "string" },
      { name: "atomCount", type: "uint8" },
      { name: "tradingEndTime", type: "uint64" },
      { name: "eventOccurrenceTime", type: "uint64" },
      { name: "resolutionBufferSeconds", type: "uint64" }
    ],
    outputs: [{ name: "marketId", type: "uint256" }]
  },
  {
    type: "function",
    name: "marketLifecycle",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [
      { name: "tradingEndTime", type: "uint64" },
      { name: "eventOccurrenceTime", type: "uint64" },
      { name: "resolutionTime", type: "uint64" },
      { name: "creatorDeposit", type: "uint256" },
      { name: "depositClaimed", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "placeBet",
    stateMutability: "payable",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "outcomeMask", type: "uint256" },
      { name: "careMask", type: "uint256" },
      { name: "expression", type: "string" }
    ],
    outputs: [{ name: "betId", type: "uint256" }]
  },
  {
    type: "function",
    name: "placeBetMinterms",
    stateMutability: "payable",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "outcomeMasks", type: "uint256[]" },
      { name: "careMasks", type: "uint256[]" },
      { name: "expression", type: "string" }
    ],
    outputs: [{ name: "betId", type: "uint256" }]
  },
  {
    type: "function",
    name: "claimBet",
    stateMutability: "nonpayable",
    inputs: [{ name: "betId", type: "uint256" }],
    outputs: [{ name: "payout", type: "uint256" }]
  },
  {
    type: "function",
    name: "claimBets",
    stateMutability: "nonpayable",
    inputs: [{ name: "betIds", type: "uint256[]" }],
    outputs: [{ name: "claimedCount", type: "uint256" }]
  },
  {
    type: "function",
    name: "claimablePayout",
    stateMutability: "view",
    inputs: [{ name: "betId", type: "uint256" }],
    outputs: [{ name: "payout", type: "uint256" }]
  },
  {
    type: "function",
    name: "betMinterms",
    stateMutability: "view",
    inputs: [{ name: "betId", type: "uint256" }],
    outputs: [
      { name: "outcomeMasks", type: "uint256[]" },
      { name: "careMasks", type: "uint256[]" }
    ]
  },
  {
    type: "function",
    name: "fundMarketRewards",
    stateMutability: "payable",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "proposeResolution",
    stateMutability: "nonpayable",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "outcomeVector", type: "uint256" },
      { name: "claim", type: "string" }
    ],
    outputs: [{ name: "assertionId", type: "bytes32" }]
  },
  {
    type: "function",
    name: "markets",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "title", type: "string" },
      { name: "metadata", type: "string" },
      { name: "atomCount", type: "uint8" },
      { name: "resolved", type: "bool" },
      { name: "outcomeVector", type: "uint256" },
      { name: "assertionId", type: "bytes32" },
      { name: "tradingEndTime", type: "uint64" },
      { name: "eventOccurrenceTime", type: "uint64" },
      { name: "resolutionTime", type: "uint64" },
      { name: "creationFeePaid", type: "uint256" },
      { name: "totalStake", type: "uint256" },
      { name: "totalFees", type: "uint256" },
      { name: "rewardPool", type: "uint256" },
      { name: "creatorFeesPaid", type: "bool" }
    ]
  },
  {
    type: "event",
    name: "MarketCreated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "title", type: "string" },
      { indexed: false, name: "atomCount", type: "uint8" }
    ]
  },
  {
    type: "event",
    name: "MarketMetadata",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: false, name: "metadata", type: "string" }
    ]
  },
  {
    type: "event",
    name: "MarketLifecycleConfigured",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: false, name: "tradingEndTime", type: "uint64" },
      { indexed: false, name: "eventOccurrenceTime", type: "uint64" },
      { indexed: false, name: "resolutionTime", type: "uint64" },
      { indexed: false, name: "creatorDeposit", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "BetPlaced",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "betId", type: "uint256" },
      { indexed: true, name: "bettor", type: "address" },
      { indexed: false, name: "stake", type: "uint256" },
      { indexed: false, name: "outcomeMask", type: "uint256" },
      { indexed: false, name: "careMask", type: "uint256" },
      { indexed: false, name: "expression", type: "string" }
    ]
  },
  {
    type: "event",
    name: "BetMinterm",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "betId", type: "uint256" },
      { indexed: true, name: "mintermIndex", type: "uint16" },
      { indexed: false, name: "outcomeMask", type: "uint256" },
      { indexed: false, name: "careMask", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "BetFeeCollected",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "betId", type: "uint256" },
      { indexed: false, name: "fee", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "MarketCreationFeePaid",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "UmaResolutionProposed",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "assertionId", type: "bytes32" },
      { indexed: false, name: "outcomeVector", type: "uint256" },
      { indexed: false, name: "claim", type: "string" }
    ]
  },
  {
    type: "event",
    name: "MarketResolved",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: false, name: "outcomeVector", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "BetClaimed",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "betId", type: "uint256" },
      { indexed: true, name: "bettor", type: "address" },
      { indexed: false, name: "payout", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "CreatorFeesPaid",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ]
  }
] as const;

export const arcUmaResolverAbi = [
  {
    type: "function",
    name: "settleAssertion",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assertionId", type: "bytes32" },
      { name: "truth", type: "bool" }
    ],
    outputs: []
  }
] as const;

export function requireArcNoMarketAddress(): Address {
  if (!arcNoMarketAddress) {
    throw new Error("Missing NEXT_PUBLIC_ARC_NOMARKET_ADDRESS. Deploy NoMarketArc and add it to .env.local.");
  }
  return arcNoMarketAddress;
}

export function requireArcUmaResolverAddress(): Address {
  if (!arcUmaResolverAddress) {
    throw new Error("Missing NEXT_PUBLIC_ARC_UMA_RESOLVER_ADDRESS. Deploy the Arc UMA resolver and add it to .env.local.");
  }
  return arcUmaResolverAddress;
}
