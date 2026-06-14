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
        uint256 creatorDeposit;
        bool depositClaimed;
    }

    struct Bet {
        address bettor;
        uint256 marketId;
        uint256 stake;
        uint256 outcomeMask;
        uint256 careMask;
        string expression;
    }

    IAssertionResolverLike public immutable optimisticOracle;
    address public immutable treasury;
    uint256 public immutable creationDeposit;
    uint256 public slashedDepositBalance;
    uint256 public nextMarketId = 1;
    uint256 public nextBetId = 1;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => Bet) public bets;
    mapping(bytes32 => uint256) public assertionIdToMarketId;

    event MarketCreated(uint256 indexed marketId, address indexed creator, string title, uint8 atomCount);
    event MarketMetadata(uint256 indexed marketId, string metadata);
    event MarketLifecycleConfigured(
        uint256 indexed marketId,
        uint64 tradingEndTime,
        uint64 eventOccurrenceTime,
        uint64 resolutionTime,
        uint256 creatorDeposit
    );
    event BetPlaced(
        uint256 indexed marketId,
        uint256 indexed betId,
        address indexed bettor,
        uint256 stake,
        uint256 outcomeMask,
        uint256 careMask,
        string expression
    );
    event UmaResolutionProposed(uint256 indexed marketId, bytes32 indexed assertionId, uint256 outcomeVector, string claim);
    event MarketResolved(uint256 indexed marketId, uint256 outcomeVector);
    event CreationDepositRefunded(uint256 indexed marketId, address indexed creator, uint256 amount);
    event CreationDepositSlashed(uint256 indexed marketId, address indexed creator, uint256 amount);
    event SlashedDepositsWithdrawn(address indexed recipient, uint256 amount);

    constructor(address optimisticOracle_, uint256 creationDeposit_) {
        require(optimisticOracle_ != address(0), "oracle required");
        optimisticOracle = IAssertionResolverLike(optimisticOracle_);
        treasury = msg.sender;
        creationDeposit = creationDeposit_;
    }

    function createMarket(string calldata title, string calldata metadata, uint8 atomCount) external returns (uint256 marketId) {
        require(creationDeposit == 0, "timed market required");
        marketId = _createMarket(title, metadata, atomCount, 0, 0, 0, 0);
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
        require(msg.value >= creationDeposit, "deposit required");

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
        uint256 creatorDeposit
    ) internal returns (uint256 marketId) {
        require(bytes(title).length > 0, "title required");
        require(atomCount >= 2 && atomCount <= 16, "atom range");

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
            creatorDeposit: creatorDeposit,
            depositClaimed: false
        });
        emit MarketCreated(marketId, msg.sender, title, atomCount);
        emit MarketMetadata(marketId, metadata);
        if (tradingEndTime != 0) {
            emit MarketLifecycleConfigured(marketId, tradingEndTime, eventOccurrenceTime, resolutionTime, creatorDeposit);
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

        betId = nextBetId++;
        bets[betId] = Bet({
            bettor: msg.sender,
            marketId: marketId,
            stake: msg.value,
            outcomeMask: outcomeMask,
            careMask: careMask,
            expression: expression
        });
        emit BetPlaced(marketId, betId, msg.sender, msg.value, outcomeMask, careMask, expression);
    }

    function proposeResolution(uint256 marketId, uint256 outcomeVector, string calldata claim) external returns (bytes32 assertionId) {
        Market storage market = markets[marketId];
        require(market.creator != address(0), "market missing");
        require(!market.resolved, "market resolved");
        require(market.resolutionTime == 0 || block.timestamp >= market.resolutionTime, "resolution not ready");
        require(market.assertionId == bytes32(0), "assertion pending");

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
            _slashDeposit(marketId, market);
            return;
        }

        market.resolved = true;
        emit MarketResolved(marketId, market.outcomeVector);
        _refundDeposit(marketId, market);
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
            market.creatorDeposit,
            market.depositClaimed
        );
    }

    function withdrawSlashedDeposits(address payable recipient) external {
        require(msg.sender == treasury, "treasury only");
        require(recipient != address(0), "recipient required");
        uint256 amount = slashedDepositBalance;
        slashedDepositBalance = 0;
        (bool ok,) = recipient.call{ value: amount }("");
        require(ok, "withdraw failed");
        emit SlashedDepositsWithdrawn(recipient, amount);
    }

    function _refundDeposit(uint256 marketId, Market storage market) internal {
        uint256 amount = market.creatorDeposit;
        if (amount == 0 || market.depositClaimed) return;
        market.depositClaimed = true;
        (bool ok,) = payable(market.creator).call{ value: amount }("");
        require(ok, "deposit refund failed");
        emit CreationDepositRefunded(marketId, market.creator, amount);
    }

    function _slashDeposit(uint256 marketId, Market storage market) internal {
        uint256 amount = market.creatorDeposit;
        if (amount == 0 || market.depositClaimed) return;
        market.depositClaimed = true;
        slashedDepositBalance += amount;
        emit CreationDepositSlashed(marketId, market.creator, amount);
    }
}
