import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  BetClaimed,
  BetFeeCollected,
  BetMinterm,
  BetPlaced,
  CreatorFeesPaid,
  MarketCreated,
  MarketCreationFeePaid,
  MarketLifecycleConfigured,
  MarketMetadata,
  MarketResolved,
  UmaResolutionProposed
} from "../generated/NoMarketArc/NoMarketArc";
import { Bet, BetMinterm as BetMintermEntity, Market, MarketResolution, ResolutionProposal } from "../generated/schema";

function zeroBytes(): Bytes {
  return Bytes.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000000");
}

function loadMarket(marketId: BigInt): Market | null {
  return Market.load(marketId.toString());
}

export function handleMarketCreated(event: MarketCreated): void {
  const id = event.params.marketId.toString();
  const market = new Market(id);
  market.marketId = event.params.marketId;
  market.creator = event.params.creator;
  market.title = event.params.title;
  market.metadata = "";
  market.atomCount = event.params.atomCount;
  market.resolved = false;
  market.outcomeVector = BigInt.zero();
  market.assertionId = zeroBytes();
  market.tradingEndTime = BigInt.zero();
  market.eventOccurrenceTime = BigInt.zero();
  market.resolutionTime = BigInt.zero();
  market.creatorDeposit = BigInt.zero();
  market.totalStake = BigInt.zero();
  market.totalFees = BigInt.zero();
  market.rewardPool = BigInt.zero();
  market.betCount = BigInt.zero();
  market.creatorFeesPaid = false;
  market.createdAtBlock = event.block.number;
  market.createdAtTimestamp = event.block.timestamp;
  market.transactionHash = event.transaction.hash;
  market.save();
}

export function handleMarketMetadata(event: MarketMetadata): void {
  const market = loadMarket(event.params.marketId);
  if (market) {
    market.metadata = event.params.metadata;
    market.save();
  }
}

export function handleMarketLifecycleConfigured(event: MarketLifecycleConfigured): void {
  const market = loadMarket(event.params.marketId);
  if (market) {
    market.tradingEndTime = event.params.tradingEndTime;
    market.eventOccurrenceTime = event.params.eventOccurrenceTime;
    market.resolutionTime = event.params.resolutionTime;
    market.creatorDeposit = event.params.creationFeePaid;
    market.save();
  }
}

export function handleMarketCreationFeePaid(event: MarketCreationFeePaid): void {
  const market = loadMarket(event.params.marketId);
  if (market) {
    market.creatorDeposit = event.params.amount;
    market.save();
  }
}

export function handleBetPlaced(event: BetPlaced): void {
  const market = loadMarket(event.params.marketId);
  const id = event.params.marketId.toString() + "-" + event.params.betId.toString();
  const bet = new Bet(id);
  bet.market = event.params.marketId.toString();
  bet.marketId = event.params.marketId;
  bet.betId = event.params.betId;
  bet.bettor = event.params.bettor;
  bet.stake = event.params.stake;
  bet.publicStake = event.params.stake;
  bet.fee = BigInt.zero();
  bet.outcomeMask = event.params.outcomeMask;
  bet.careMask = event.params.careMask;
  bet.expression = event.params.expression;
  bet.claimed = false;
  bet.payout = BigInt.zero();
  bet.transactionHash = event.transaction.hash;
  bet.blockNumber = event.block.number;
  bet.blockTimestamp = event.block.timestamp;
  bet.save();

  if (market) {
    market.totalStake = market.totalStake.plus(event.params.stake);
    market.betCount = market.betCount.plus(BigInt.fromI32(1));
    market.save();
  }
}

export function handleBetFeeCollected(event: BetFeeCollected): void {
  const bet = Bet.load(event.params.marketId.toString() + "-" + event.params.betId.toString());
  if (bet) {
    bet.fee = event.params.fee;
    bet.save();
  }
  const market = loadMarket(event.params.marketId);
  if (market) {
    market.totalFees = market.totalFees.plus(event.params.fee);
    market.save();
  }
}

export function handleBetMinterm(event: BetMinterm): void {
  const id =
    event.params.marketId.toString() +
    "-" +
    event.params.betId.toString() +
    "-" +
    event.params.mintermIndex.toString();
  const minterm = new BetMintermEntity(id);
  minterm.market = event.params.marketId.toString();
  minterm.bet = event.params.marketId.toString() + "-" + event.params.betId.toString();
  minterm.marketId = event.params.marketId;
  minterm.betId = event.params.betId;
  minterm.mintermIndex = event.params.mintermIndex;
  minterm.outcomeMask = event.params.outcomeMask;
  minterm.careMask = event.params.careMask;
  minterm.save();
}

export function handleUmaResolutionProposed(event: UmaResolutionProposed): void {
  const id = event.params.marketId.toString() + "-" + event.params.assertionId.toHexString();
  const proposal = new ResolutionProposal(id);
  proposal.market = event.params.marketId.toString();
  proposal.marketId = event.params.marketId;
  proposal.assertionId = event.params.assertionId;
  proposal.outcomeVector = event.params.outcomeVector;
  proposal.claim = event.params.claim;
  proposal.transactionHash = event.transaction.hash;
  proposal.blockNumber = event.block.number;
  proposal.blockTimestamp = event.block.timestamp;
  proposal.save();

  const market = loadMarket(event.params.marketId);
  if (market) {
    market.assertionId = event.params.assertionId;
    market.outcomeVector = event.params.outcomeVector;
    market.save();
  }
}

export function handleMarketResolved(event: MarketResolved): void {
  const id = event.params.marketId.toString() + "-" + event.transaction.hash.toHexString();
  const resolution = new MarketResolution(id);
  resolution.market = event.params.marketId.toString();
  resolution.marketId = event.params.marketId;
  resolution.outcomeVector = event.params.outcomeVector;
  resolution.transactionHash = event.transaction.hash;
  resolution.blockNumber = event.block.number;
  resolution.blockTimestamp = event.block.timestamp;
  resolution.save();

  const market = loadMarket(event.params.marketId);
  if (market) {
    market.resolved = true;
    market.outcomeVector = event.params.outcomeVector;
    market.save();
  }
}

export function handleBetClaimed(event: BetClaimed): void {
  const bet = Bet.load(event.params.marketId.toString() + "-" + event.params.betId.toString());
  if (bet) {
    bet.claimed = true;
    bet.payout = event.params.payout;
    bet.save();
  }
}

export function handleCreatorFeesPaid(event: CreatorFeesPaid): void {
  const market = loadMarket(event.params.marketId);
  if (market) {
    market.creatorFeesPaid = true;
    market.save();
  }
}
