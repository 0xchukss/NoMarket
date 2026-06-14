// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IAssertionResolverLike {
    function assertTruthWithDefaults(bytes calldata claim, address asserter, address callbackRecipient)
        external
        returns (bytes32 assertionId);
}

interface IMockOOv3Like {
    function setAssertionMarket(bytes32 assertionId, uint256 marketId) external;
}

contract NoMarketArc {
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant CREATOR_FEE_SHARE_BPS = 1_000;
    uint256 public constant MAX_MATCHED_OUTCOMES = 256;

    struct Market {
        address creator;
        string title;
        string metadata;
        uint8 atomCount;
        bool resolved;
        uint256 outcomeVector;
        bytes32 assertionId;
        uint64 tradingEndTime;
        uint64 eventOccurrenceTime;
        uint64 resolutionTime;
        uint256 creationFeePaid;
        uint256 totalStake;
        uint256 totalFees;
        uint256 rewardPool;
        bool creatorFeesPaid;
    }

    struct Bet {
        address bettor;
        uint256 marketId;
        uint256 stake;
        uint256 fee;
        uint256 outcomeMask;
        uint256 careMask;
        string expression;
        bool claimed;
    }

    IAssertionResolverLike public immutable optimisticOracle;
    address public immutable treasury;
    uint256 public immutable creationFee;
    uint256 public immutable betFeeBps;
    uint256 public treasuryFeeBalance;
    uint256 public nextMarketId = 1;
    uint256 public nextBetId = 1;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => Bet) public bets;
    mapping(uint256 => uint256[]) private betOutcomeMasks;
    mapping(uint256 => uint256[]) private betCareMasks;
    mapping(uint256 => mapping(uint256 => bool)) private betMatchesOutcome;
    mapping(uint256 => mapping(uint256 => uint256)) public winningStakeByOutcome;
    mapping(bytes32 => uint256) public assertionIdToMarketId;
    mapping(address => uint256) public pendingPayouts;
    mapping(address => uint256) public pendingCreatorFees;

    event MarketCreated(uint256 indexed marketId, address indexed creator, string title, uint8 atomCount);
    event MarketMetadata(uint256 indexed marketId, string metadata);
    event MarketLifecycleConfigured(
        uint256 indexed marketId,
        uint64 tradingEndTime,
        uint64 eventOccurrenceTime,
        uint64 resolutionTime,
        uint256 creationFeePaid
    );
    event MarketCreationFeePaid(uint256 indexed marketId, address indexed creator, uint256 amount);
    event BetPlaced(
        uint256 indexed marketId,
        uint256 indexed betId,
        address indexed bettor,
        uint256 stake,
        uint256 outcomeMask,
        uint256 careMask,
        string expression
    );
    event BetFeeCollected(uint256 indexed marketId, uint256 indexed betId, uint256 fee);
    event BetMinterm(uint256 indexed marketId, uint256 indexed betId, uint16 indexed mintermIndex, uint256 outcomeMask, uint256 careMask);
    event UmaResolutionProposed(uint256 indexed marketId, bytes32 indexed assertionId, uint256 outcomeVector, string claim);
    event MarketResolved(uint256 indexed marketId, uint256 outcomeVector);
    event BetClaimed(uint256 indexed marketId, uint256 indexed betId, address indexed bettor, uint256 payout);
    event MarketRewardFunded(uint256 indexed marketId, address indexed funder, uint256 amount);
    event CreatorFeesPaid(uint256 indexed marketId, address indexed creator, uint256 amount);
    event CreatorFeesClaimable(uint256 indexed marketId, address indexed creator, uint256 amount);
    event PendingPayoutClaimed(address indexed account, uint256 amount);
    event TreasuryFeesWithdrawn(address indexed recipient, uint256 amount);

    constructor(address optimisticOracle_, uint256 creationFee_, uint256 betFeeBps_) {
        require(optimisticOracle_ != address(0), "oracle required");
        require(betFeeBps_ <= 2_000, "fee too high");
        optimisticOracle = IAssertionResolverLike(optimisticOracle_);
        treasury = msg.sender;
        creationFee = creationFee_;
        betFeeBps = betFeeBps_;
    }

    function createMarket(string calldata title, string calldata metadata, uint8 atomCount) external payable returns (uint256 marketId) {
        marketId = _createMarket(title, metadata, atomCount, 0, 0, 0, msg.value);
    }

    function createTimedMarket(
        string calldata title,
        string calldata metadata,
        uint8 atomCount,
        uint64 tradingEndTime,
        uint64 eventOccurrenceTime,
        uint64 resolutionBufferSeconds
    ) external payable returns (uint256 marketId) {
        require(tradingEndTime > block.timestamp, "trading end in past");
        require(eventOccurrenceTime >= tradingEndTime, "event before trading end");
        require(resolutionBufferSeconds > 0, "buffer required");

        uint64 resolutionTime = eventOccurrenceTime + resolutionBufferSeconds;
        require(resolutionTime > eventOccurrenceTime, "resolution overflow");
        marketId = _createMarket(title, metadata, atomCount, tradingEndTime, eventOccurrenceTime, resolutionTime, msg.value);
    }

    function _createMarket(
        string calldata title,
        string calldata metadata,
        uint8 atomCount,
        uint64 tradingEndTime,
        uint64 eventOccurrenceTime,
        uint64 resolutionTime,
        uint256 creationFeePaid
    ) internal returns (uint256 marketId) {
        require(bytes(title).length > 0, "title required");
        require(atomCount >= 2 && atomCount <= 16, "atom range");
        require(creationFeePaid >= creationFee, "creation fee required");

        marketId = nextMarketId++;
        markets[marketId] = Market({
            creator: msg.sender,
            title: title,
            metadata: metadata,
            atomCount: atomCount,
            resolved: false,
            outcomeVector: 0,
            assertionId: bytes32(0),
            tradingEndTime: tradingEndTime,
            eventOccurrenceTime: eventOccurrenceTime,
            resolutionTime: resolutionTime,
            creationFeePaid: creationFeePaid,
            totalStake: 0,
            totalFees: 0,
            rewardPool: 0,
            creatorFeesPaid: false
        });
        treasuryFeeBalance += creationFeePaid;
        emit MarketCreated(marketId, msg.sender, title, atomCount);
        emit MarketMetadata(marketId, metadata);
        emit MarketCreationFeePaid(marketId, msg.sender, creationFeePaid);
        if (tradingEndTime != 0) {
            emit MarketLifecycleConfigured(marketId, tradingEndTime, eventOccurrenceTime, resolutionTime, creationFeePaid);
        }
    }

    function placeBet(
        uint256 marketId,
        uint256 outcomeMask,
        uint256 careMask,
        string calldata expression
    ) external payable returns (uint256 betId) {
        Market storage market = markets[marketId];
        require(market.creator != address(0), "market missing");
        require(!market.resolved, "market resolved");
        require(market.tradingEndTime == 0 || block.timestamp < market.tradingEndTime, "trading closed");
        require(msg.value > 0, "stake required");

        uint256 fee = _feeFromGross(msg.value);
        uint256 stake = msg.value - fee;
        require(stake > 0, "stake after fee required");
        _validateMinterm(market.atomCount, outcomeMask, careMask);
        betId = nextBetId++;
        bets[betId] = Bet({
            bettor: msg.sender,
            marketId: marketId,
            stake: stake,
            fee: fee,
            outcomeMask: outcomeMask,
            careMask: careMask,
            expression: expression,
            claimed: false
        });
        betOutcomeMasks[betId].push(outcomeMask);
        betCareMasks[betId].push(careMask);
        market.totalStake += stake;
        market.totalFees += fee;
        _registerWinningStake(betId, marketId, market.atomCount, outcomeMask, careMask, stake);

        emit BetPlaced(marketId, betId, msg.sender, stake, outcomeMask, careMask, expression);
        if (fee > 0) emit BetFeeCollected(marketId, betId, fee);
        emit BetMinterm(marketId, betId, 0, outcomeMask, careMask);
    }

    function placeBetMinterms(
        uint256 marketId,
        uint256[] calldata outcomeMasks,
        uint256[] calldata careMasks,
        string calldata expression
    ) external payable returns (uint256 betId) {
        Market storage market = markets[marketId];
        require(market.creator != address(0), "market missing");
        require(!market.resolved, "market resolved");
        require(market.tradingEndTime == 0 || block.timestamp < market.tradingEndTime, "trading closed");
        require(outcomeMasks.length > 0 && outcomeMasks.length == careMasks.length, "bad minterms");
        require(outcomeMasks.length <= 32, "too many minterms");

        uint256 fee = _feeFromGross(msg.value);
        uint256 stake = msg.value - fee;
        require(stake > 0, "stake after fee required");
        betId = nextBetId++;
        uint256 displayOutcomeMask = outcomeMasks[0];
        uint256 displayCareMask = careMasks[0];
        _recordBetMinterms(betId, marketId, market.atomCount, outcomeMasks, careMasks, stake);

        bets[betId] = Bet({
            bettor: msg.sender,
            marketId: marketId,
            stake: stake,
            fee: fee,
            outcomeMask: displayOutcomeMask,
            careMask: displayCareMask,
            expression: expression,
            claimed: false
        });
        market.totalStake += stake;
        market.totalFees += fee;
        emit BetPlaced(marketId, betId, msg.sender, stake, displayOutcomeMask, displayCareMask, expression);
        if (fee > 0) emit BetFeeCollected(marketId, betId, fee);
    }

    function proposeResolution(uint256 marketId, uint256 outcomeVector, string calldata claim) external returns (bytes32 assertionId) {
        Market storage market = markets[marketId];
        require(market.creator != address(0), "market missing");
        require(!market.resolved, "market resolved");
        require(market.resolutionTime == 0 || block.timestamp >= market.resolutionTime, "resolution not ready");
        require(market.assertionId == bytes32(0), "assertion pending");
        require(outcomeVector <= _marketMask(market.atomCount), "outcome out of range");

        assertionId = optimisticOracle.assertTruthWithDefaults(bytes(claim), msg.sender, address(this));
        market.assertionId = assertionId;
        market.outcomeVector = outcomeVector;
        assertionIdToMarketId[assertionId] = marketId;

        try IMockOOv3Like(address(optimisticOracle)).setAssertionMarket(assertionId, marketId) {} catch {}
        emit UmaResolutionProposed(marketId, assertionId, outcomeVector, claim);
    }

    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) external {
        require(msg.sender == address(optimisticOracle), "oracle only");
        uint256 marketId = assertionIdToMarketId[assertionId];
        require(marketId != 0, "assertion missing");

        Market storage market = markets[marketId];
        if (!assertedTruthfully) {
            market.assertionId = bytes32(0);
            return;
        }

        market.resolved = true;
        emit MarketResolved(marketId, market.outcomeVector);
        _settleMarketFees(marketId, market);
    }

    function claimBet(uint256 betId) external returns (uint256 payout) {
        return _claimBet(betId);
    }

    function claimBets(uint256[] calldata betIds) external returns (uint256 claimedCount) {
        for (uint256 index = 0; index < betIds.length; index++) {
            uint256 beforeBalance = address(this).balance;
            uint256 payout = _claimBet(betIds[index]);
            if (payout > 0 || beforeBalance == address(this).balance) {
                claimedCount += 1;
            }
        }
    }

    function fundMarketRewards(uint256 marketId) external payable {
        Market storage market = markets[marketId];
        require(market.creator != address(0), "market missing");
        require(!market.resolved, "market resolved");
        require(msg.value > 0, "reward required");
        market.rewardPool += msg.value;
        emit MarketRewardFunded(marketId, msg.sender, msg.value);
    }

    function claimPendingPayout() external {
        uint256 amount = pendingPayouts[msg.sender];
        require(amount > 0, "no payout");
        pendingPayouts[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{ value: amount }("");
        require(ok, "payout failed");
        emit PendingPayoutClaimed(msg.sender, amount);
    }

    function claimCreatorFees() external {
        uint256 amount = pendingCreatorFees[msg.sender];
        require(amount > 0, "no creator fees");
        pendingCreatorFees[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{ value: amount }("");
        require(ok, "creator fee failed");
        emit PendingPayoutClaimed(msg.sender, amount);
    }

    function betMinterms(uint256 betId)
        external
        view
        returns (uint256[] memory outcomeMasks, uint256[] memory careMasks)
    {
        return (betOutcomeMasks[betId], betCareMasks[betId]);
    }

    function isWinningBet(uint256 betId) public view returns (bool) {
        Bet storage bet = bets[betId];
        Market storage market = markets[bet.marketId];
        if (!market.resolved || bet.bettor == address(0)) return false;
        uint256[] storage outcomeMasks = betOutcomeMasks[betId];
        uint256[] storage careMasks = betCareMasks[betId];
        for (uint256 index = 0; index < outcomeMasks.length; index++) {
            if ((market.outcomeVector & careMasks[index]) == outcomeMasks[index]) return true;
        }
        return false;
    }

    function claimablePayout(uint256 betId) public view returns (uint256) {
        Bet storage bet = bets[betId];
        Market storage market = markets[bet.marketId];
        if (!market.resolved || bet.claimed || bet.bettor == address(0) || !isWinningBet(betId)) return 0;
        uint256 winningStake = winningStakeByOutcome[bet.marketId][market.outcomeVector];
        if (winningStake == 0) return 0;
        uint256 payoutPool = market.totalStake + market.rewardPool;
        return (bet.stake * payoutPool) / winningStake;
    }

    function marketLifecycle(uint256 marketId)
        external
        view
        returns (
            uint64 tradingEndTime,
            uint64 eventOccurrenceTime,
            uint64 resolutionTime,
            uint256 creatorDeposit,
            bool depositClaimed
        )
    {
        Market storage market = markets[marketId];
        return (
            market.tradingEndTime,
            market.eventOccurrenceTime,
            market.resolutionTime,
            market.creationFeePaid,
            market.creatorFeesPaid
        );
    }

    function withdrawTreasuryFees(address payable recipient) external {
        require(msg.sender == treasury, "treasury only");
        require(recipient != address(0), "recipient required");
        uint256 amount = treasuryFeeBalance;
        treasuryFeeBalance = 0;
        (bool ok,) = recipient.call{ value: amount }("");
        require(ok, "withdraw failed");
        emit TreasuryFeesWithdrawn(recipient, amount);
    }

    function _claimBet(uint256 betId) internal returns (uint256 payout) {
        Bet storage bet = bets[betId];
        require(bet.bettor != address(0), "bet missing");
        require(!bet.claimed, "bet claimed");
        Market storage market = markets[bet.marketId];
        require(market.resolved, "market not resolved");

        payout = claimablePayout(betId);
        bet.claimed = true;
        if (payout > 0) {
            _sendOrEscrow(bet.bettor, payout);
        }
        emit BetClaimed(bet.marketId, betId, bet.bettor, payout);
    }

    function _settleMarketFees(uint256 marketId, Market storage market) internal {
        if (market.creatorFeesPaid) return;
        market.creatorFeesPaid = true;

        uint256 creatorAmount = (market.totalFees * CREATOR_FEE_SHARE_BPS) / BPS_DENOMINATOR;
        uint256 treasuryAmount = market.totalFees - creatorAmount;
        treasuryFeeBalance += treasuryAmount;
        if (winningStakeByOutcome[marketId][market.outcomeVector] == 0) {
            treasuryFeeBalance += market.totalStake + market.rewardPool;
        }
        if (creatorAmount == 0) return;
        (bool ok,) = payable(market.creator).call{ value: creatorAmount }("");
        if (ok) {
            emit CreatorFeesPaid(marketId, market.creator, creatorAmount);
        } else {
            pendingCreatorFees[market.creator] += creatorAmount;
            emit CreatorFeesClaimable(marketId, market.creator, creatorAmount);
        }
    }

    function _sendOrEscrow(address recipient, uint256 amount) internal {
        (bool ok,) = payable(recipient).call{ value: amount }("");
        if (!ok) pendingPayouts[recipient] += amount;
    }

    function _feeFromGross(uint256 grossValue) internal view returns (uint256) {
        if (betFeeBps == 0) return 0;
        return (grossValue * betFeeBps) / (BPS_DENOMINATOR + betFeeBps);
    }

    function _registerWinningStake(
        uint256 betId,
        uint256 marketId,
        uint8 atomCount,
        uint256 outcomeMask,
        uint256 careMask,
        uint256 stake
    ) internal {
        uint256 freeMask = _marketMask(atomCount) & ~careMask;
        require((uint256(1) << _popcount(freeMask)) <= MAX_MATCHED_OUTCOMES, "expression too broad");

        uint256 subset = freeMask;
        while (true) {
            uint256 slot = outcomeMask | subset;
            if (!betMatchesOutcome[betId][slot]) {
                betMatchesOutcome[betId][slot] = true;
                winningStakeByOutcome[marketId][slot] += stake;
            }
            if (subset == 0) break;
            subset = (subset - 1) & freeMask;
        }
    }

    function _recordBetMinterms(
        uint256 betId,
        uint256 marketId,
        uint8 atomCount,
        uint256[] calldata outcomeMasks,
        uint256[] calldata careMasks,
        uint256 stake
    ) internal {
        for (uint16 index = 0; index < outcomeMasks.length; index++) {
            uint256 outcomeMask = outcomeMasks[index];
            uint256 careMask = careMasks[index];
            _validateMinterm(atomCount, outcomeMask, careMask);
            betOutcomeMasks[betId].push(outcomeMask);
            betCareMasks[betId].push(careMask);
            _registerWinningStake(betId, marketId, atomCount, outcomeMask, careMask, stake);
            emit BetMinterm(marketId, betId, index, outcomeMask, careMask);
        }
    }

    function _validateMinterm(uint8 atomCount, uint256 outcomeMask, uint256 careMask) internal pure {
        uint256 marketMask = _marketMask(atomCount);
        require(careMask > 0, "care mask required");
        require((careMask & ~marketMask) == 0, "care out of range");
        require((outcomeMask & ~careMask) == 0, "outcome outside care");
    }

    function _marketMask(uint8 atomCount) internal pure returns (uint256) {
        return (uint256(1) << atomCount) - 1;
    }

    function _popcount(uint256 value) internal pure returns (uint256 count) {
        while (value != 0) {
            value &= value - 1;
            count += 1;
        }
    }
}
