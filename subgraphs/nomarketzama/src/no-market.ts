import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  BetPlaced,
  MarketCreated,
  MarketResolved,
  UmaResolutionProposed
} from "../generated/NoMarket/NoMarket";
import { Bet, Market, MarketResolution, ResolutionProposal } from "../generated/schema";

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
  market.question = event.params.question;
  market.atomCount = event.params.atomCount;
  market.resolved = false;
  market.outcomeVector = BigInt.zero();
  market.assertionId = zeroBytes();
  market.totalStake = BigInt.zero();
  market.betCount = BigInt.zero();
  market.createdAtBlock = event.block.number;
  market.createdAtTimestamp = event.block.timestamp;
  market.transactionHash = event.transaction.hash;
  market.save();
}

export function handleBetPlaced(event: BetPlaced): void {
  const market = loadMarket(event.params.marketId);
  const id = event.params.marketId.toString() + "-" + event.params.betId.toString();
  const bet = new Bet(id);
  bet.market = event.params.marketId.toString();
  bet.marketId = event.params.marketId;
  bet.betId = event.params.betId;
  bet.bettor = event.params.bettor;
  bet.stake = event.params.publicStake;
  bet.publicStake = event.params.publicStake;
  bet.encryptedStakeHandle = event.params.encryptedStakeHandle;
  bet.encryptedOutcomeMaskHandle = event.params.encryptedOutcomeMaskHandle;
  bet.encryptedCareMaskHandle = event.params.encryptedCareMaskHandle;
  bet.outcomeMask = BigInt.zero();
  bet.careMask = BigInt.zero();
  bet.expression = "";
  bet.transactionHash = event.transaction.hash;
  bet.blockNumber = event.block.number;
  bet.blockTimestamp = event.block.timestamp;
  bet.save();

  if (market) {
    market.totalStake = market.totalStake.plus(event.params.publicStake);
    market.betCount = market.betCount.plus(BigInt.fromI32(1));
    market.save();
  }
}

export function handleUmaResolutionProposed(event: UmaResolutionProposed): void {
  const id = event.params.marketId.toString() + "-" + event.params.assertionId.toHexString();
  const outcomeVector = BigInt.fromI32(event.params.outcomeVector);
  const proposal = new ResolutionProposal(id);
  proposal.market = event.params.marketId.toString();
  proposal.marketId = event.params.marketId;
  proposal.assertionId = event.params.assertionId;
  proposal.outcomeVector = outcomeVector;
  proposal.claim = event.params.claim;
  proposal.transactionHash = event.transaction.hash;
  proposal.blockNumber = event.block.number;
  proposal.blockTimestamp = event.block.timestamp;
  proposal.save();

  const market = loadMarket(event.params.marketId);
  if (market) {
    market.assertionId = event.params.assertionId;
    market.outcomeVector = outcomeVector;
    market.save();
  }
}

export function handleMarketResolved(event: MarketResolved): void {
  const outcomeVector = BigInt.fromI32(event.params.outcomeVector);
  const id = event.params.marketId.toString() + "-" + event.transaction.hash.toHexString();
  const resolution = new MarketResolution(id);
  resolution.market = event.params.marketId.toString();
  resolution.marketId = event.params.marketId;
  resolution.outcomeVector = outcomeVector;
  resolution.transactionHash = event.transaction.hash;
  resolution.blockNumber = event.block.number;
  resolution.blockTimestamp = event.block.timestamp;
  resolution.save();

  const market = loadMarket(event.params.marketId);
  if (market) {
    market.resolved = true;
    market.outcomeVector = outcomeVector;
    market.save();
  }
}
