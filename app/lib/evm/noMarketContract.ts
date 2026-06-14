import type { Address } from "viem";

export const noMarketAddress = process.env.NEXT_PUBLIC_NO_MARKET_ADDRESS as Address | undefined;
export const noMarketDeployBlock = BigInt(process.env.NEXT_PUBLIC_NO_MARKET_DEPLOY_BLOCK || 0);

export const noMarketAbi = [
  {
    type: "function",
    name: "createMarket",
    stateMutability: "payable",
    inputs: [
      { name: "title", type: "string" },
      { name: "question", type: "string" },
      { name: "atomCount", type: "uint16" }
    ],
    outputs: [{ name: "marketId", type: "uint256" }]
  },
  {
    type: "function",
    name: "createTimedMarket",
    stateMutability: "payable",
    inputs: [
      { name: "title", type: "string" },
      { name: "question", type: "string" },
      { name: "atomCount", type: "uint16" },
      { name: "tradingEndTime", type: "uint64" },
      { name: "eventOccurrenceTime", type: "uint64" },
      { name: "resolutionBufferSeconds", type: "uint64" }
    ],
    outputs: [{ name: "marketId", type: "uint256" }]
  },
  {
    type: "function",
    name: "placeBet",
    stateMutability: "payable",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "encryptedStake", type: "bytes32" },
      { name: "encryptedOutcomeMask", type: "bytes32" },
      { name: "encryptedCareMask", type: "bytes32" },
      { name: "inputProof", type: "bytes" }
    ],
    outputs: [{ name: "betId", type: "uint256" }]
  },
  {
    type: "function",
    name: "proposeUmaResolution",
    stateMutability: "nonpayable",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "outcomeVector", type: "uint16" },
      { name: "claim", type: "string" }
    ],
    outputs: [{ name: "assertionId", type: "bytes32" }]
  },
  {
    type: "function",
    name: "settleUmaResolution",
    stateMutability: "nonpayable",
    inputs: [{ name: "assertionId", type: "bytes32" }],
    outputs: []
  },
  {
    type: "function",
    name: "markets",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "title", type: "string" },
      { name: "question", type: "string" },
      { name: "atomCount", type: "uint16" },
      { name: "materialized", type: "bool" },
      { name: "resolved", type: "bool" },
      { name: "outcomeVector", type: "uint16" },
      { name: "totalStake", type: "uint256" },
      { name: "betCount", type: "uint256" },
      { name: "umaAssertionId", type: "bytes32" },
      { name: "tradingEndTime", type: "uint64" },
      { name: "eventOccurrenceTime", type: "uint64" },
      { name: "resolutionTime", type: "uint64" },
      { name: "creationFeePaid", type: "uint256" },
      { name: "totalFees", type: "uint256" },
      { name: "creatorFeesPaid", type: "bool" }
    ]
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
      { name: "creationFeePaid", type: "uint256" },
      { name: "creatorFeesPaid", type: "bool" }
    ]
  },
  {
    type: "function",
    name: "claimCreatorFees",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "event",
    name: "MarketCreated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "title", type: "string" },
      { indexed: false, name: "question", type: "string" },
      { indexed: false, name: "atomCount", type: "uint16" }
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
      { indexed: false, name: "creationFeePaid", type: "uint256" }
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
    name: "BetPlaced",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "betId", type: "uint256" },
      { indexed: true, name: "bettor", type: "address" },
      { indexed: false, name: "publicStake", type: "uint256" },
      { indexed: false, name: "encryptedStakeHandle", type: "bytes32" },
      { indexed: false, name: "encryptedOutcomeMaskHandle", type: "bytes32" },
      { indexed: false, name: "encryptedCareMaskHandle", type: "bytes32" }
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
    name: "UmaResolutionProposed",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "assertionId", type: "bytes32" },
      { indexed: false, name: "outcomeVector", type: "uint16" },
      { indexed: false, name: "claim", type: "string" }
    ]
  },
  {
    type: "event",
    name: "MarketResolved",
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: false, name: "outcomeVector", type: "uint16" }
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

export function requireNoMarketAddress(): Address {
  if (!noMarketAddress) {
    throw new Error("Missing NEXT_PUBLIC_NO_MARKET_ADDRESS. Deploy NoMarket on Sepolia and add it to .env.local.");
  }
  return noMarketAddress;
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
