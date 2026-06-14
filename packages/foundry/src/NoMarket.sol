// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint16, euint64, externalEuint16, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHESafeMath} from "@openzeppelin/confidential-contracts/utils/FHESafeMath.sol";
import {IERC20} from "@openzeppelin-contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";

interface IOptimisticOracleV3 {
    function assertTruth(
        bytes memory claim,
        address asserter,
        address callbackRecipient,
        address escalationManager,
        uint64 liveness,
        IERC20 currency,
        uint256 bond,
        bytes32 identifier,
        bytes32 domain
    ) external returns (bytes32 assertionId);

    function settleAssertion(bytes32 assertionId) external;
}

contract NoMarket is ZamaEthereumConfig {
    using SafeERC20 for IERC20;
    using FHESafeMath for euint64;

    string public constant name = "NoMarket";
    string public constant version = "1";
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant CREATOR_FEE_SHARE_BPS = 1_000;

    struct Market {
        address creator;
        string title;
        string question;
        uint16 atomCount;
        bool materialized;
        bool resolved;
        uint16 outcomeVector;
        uint256 totalStake;
        uint256 betCount;
        bytes32 umaAssertionId;
        uint64 tradingEndTime;
        uint64 eventOccurrenceTime;
        uint64 resolutionTime;
        uint256 creationFeePaid;
        uint256 totalFees;
        bool creatorFeesPaid;
    }

    struct Bet {
        address bettor;
        uint256 publicStake;
        uint256 fee;
        euint64 encryptedStake;
        euint16 encryptedOutcomeMask;
        euint16 encryptedCareMask;
        bool claimed;
    }

    struct PendingResolution {
        uint256 marketId;
        uint16 outcomeVector;
        bool exists;
    }

    IOptimisticOracleV3 public immutable optimisticOracle;
    IERC20 public immutable bondCurrency;
    uint256 public immutable bond;
    uint64 public immutable assertionLiveness;
    bytes32 public immutable assertionIdentifier;
    bytes32 public immutable assertionDomain;
    address public immutable treasury;
    uint256 public immutable creationFee;
    uint256 public immutable betFeeBps;

    uint256 public marketCount;
    uint256 public treasuryFeeBalance;
    mapping(uint256 marketId => Market) public markets;
    mapping(uint256 marketId => mapping(uint256 betId => Bet)) private bets;
    mapping(bytes32 assertionId => PendingResolution) public pendingResolutions;
    mapping(address account => uint256 amount) public pendingCreatorFees;

    event MarketCreated(uint256 indexed marketId, address indexed creator, string title, string question, uint16 atomCount);
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
        uint256 publicStake,
        bytes32 encryptedStakeHandle,
        bytes32 encryptedOutcomeMaskHandle,
        bytes32 encryptedCareMaskHandle
    );
    event BetFeeCollected(uint256 indexed marketId, uint256 indexed betId, uint256 fee);
    event UmaResolutionProposed(uint256 indexed marketId, bytes32 indexed assertionId, uint16 outcomeVector, string claim);
    event MarketResolved(uint256 indexed marketId, uint16 outcomeVector);
    event CreatorFeesPaid(uint256 indexed marketId, address indexed creator, uint256 amount);
    event CreatorFeesClaimable(uint256 indexed marketId, address indexed creator, uint256 amount);
    event TreasuryFeesWithdrawn(address indexed recipient, uint256 amount);

    error InvalidAtomCount();
    error InvalidMarket();
    error MarketNotOpen();
    error MarketAlreadyResolved();
    error EmptyStake();
    error CreationFeeRequired();
    error ResolutionNotReady();
    error OnlyOptimisticOracle();
    error UnknownAssertion();
    error UmaAssertionRejected();
    error FeeTooHigh();
    error NoFeesAvailable();

    constructor(
        address optimisticOracle_,
        address bondCurrency_,
        uint256 bond_,
        uint64 assertionLiveness_,
        bytes32 assertionIdentifier_,
        bytes32 assertionDomain_,
        uint256 creationFee_,
        uint256 betFeeBps_
    ) {
        if (betFeeBps_ > 2_000) revert FeeTooHigh();
        optimisticOracle = IOptimisticOracleV3(optimisticOracle_);
        bondCurrency = IERC20(bondCurrency_);
        bond = bond_;
        assertionLiveness = assertionLiveness_;
        assertionIdentifier = assertionIdentifier_;
        assertionDomain = assertionDomain_;
        treasury = msg.sender;
        creationFee = creationFee_;
        betFeeBps = betFeeBps_;
    }

    function createMarket(string calldata title, string calldata question, uint16 atomCount) external payable returns (uint256 marketId) {
        marketId = _createMarket(title, question, atomCount, 0, 0, 0, msg.value);
    }

    function createTimedMarket(
        string calldata title,
        string calldata question,
        uint16 atomCount,
        uint64 tradingEndTime,
        uint64 eventOccurrenceTime,
        uint64 resolutionBufferSeconds
    ) external payable returns (uint256 marketId) {
        if (tradingEndTime <= block.timestamp || eventOccurrenceTime < tradingEndTime || resolutionBufferSeconds == 0) {
            revert MarketNotOpen();
        }
        uint64 resolutionTime = eventOccurrenceTime + resolutionBufferSeconds;
        if (resolutionTime <= eventOccurrenceTime) revert ResolutionNotReady();
        marketId = _createMarket(title, question, atomCount, tradingEndTime, eventOccurrenceTime, resolutionTime, msg.value);
    }

    function _createMarket(
        string calldata title,
        string calldata question,
        uint16 atomCount,
        uint64 tradingEndTime,
        uint64 eventOccurrenceTime,
        uint64 resolutionTime,
        uint256 creationFeePaid
    ) internal returns (uint256 marketId) {
        if (atomCount < 2 || atomCount > 16) revert InvalidAtomCount();
        if (creationFeePaid < creationFee) revert CreationFeeRequired();

        marketId = ++marketCount;
        markets[marketId] = Market({
            creator: msg.sender,
            title: title,
            question: question,
            atomCount: atomCount,
            materialized: true,
            resolved: false,
            outcomeVector: 0,
            totalStake: 0,
            betCount: 0,
            umaAssertionId: bytes32(0),
            tradingEndTime: tradingEndTime,
            eventOccurrenceTime: eventOccurrenceTime,
            resolutionTime: resolutionTime,
            creationFeePaid: creationFeePaid,
            totalFees: 0,
            creatorFeesPaid: false
        });
        treasuryFeeBalance += creationFeePaid;

        emit MarketCreated(marketId, msg.sender, title, question, atomCount);
        emit MarketCreationFeePaid(marketId, msg.sender, creationFeePaid);
        if (tradingEndTime != 0) {
            emit MarketLifecycleConfigured(marketId, tradingEndTime, eventOccurrenceTime, resolutionTime, creationFeePaid);
        }
    }

    function placeBet(
        uint256 marketId,
        externalEuint64 encryptedStake,
        externalEuint16 encryptedOutcomeMask,
        externalEuint16 encryptedCareMask,
        bytes calldata inputProof
    ) external payable returns (uint256 betId) {
        Market storage market = markets[marketId];
        if (market.creator == address(0)) revert InvalidMarket();
        if (market.resolved) revert MarketAlreadyResolved();
        if (msg.value == 0) revert EmptyStake();
        if (market.tradingEndTime != 0 && block.timestamp >= market.tradingEndTime) revert MarketNotOpen();

        uint256 fee = _feeFromGross(msg.value);
        uint256 publicStake = msg.value - fee;
        if (publicStake == 0) revert EmptyStake();
        euint64 privateStake = FHE.fromExternal(encryptedStake, inputProof);
        euint16 outcomeMask = FHE.fromExternal(encryptedOutcomeMask, inputProof);
        euint16 careMask = FHE.fromExternal(encryptedCareMask, inputProof);

        betId = ++market.betCount;
        market.totalStake += publicStake;
        market.totalFees += fee;

        bets[marketId][betId] = Bet({
            bettor: msg.sender,
            publicStake: publicStake,
            fee: fee,
            encryptedStake: privateStake,
            encryptedOutcomeMask: outcomeMask,
            encryptedCareMask: careMask,
            claimed: false
        });

        FHE.allowThis(privateStake);
        FHE.allowThis(outcomeMask);
        FHE.allowThis(careMask);
        FHE.allow(privateStake, msg.sender);
        FHE.allow(outcomeMask, msg.sender);
        FHE.allow(careMask, msg.sender);

        emit BetPlaced(
            marketId,
            betId,
            msg.sender,
            publicStake,
            euint64.unwrap(privateStake),
            euint16.unwrap(outcomeMask),
            euint16.unwrap(careMask)
        );
        if (fee > 0) emit BetFeeCollected(marketId, betId, fee);
    }

    function getBet(uint256 marketId, uint256 betId)
        external
        view
        returns (
            address bettor,
            uint256 publicStake,
            bytes32 encryptedStakeHandle,
            bytes32 encryptedOutcomeMaskHandle,
            bytes32 encryptedCareMaskHandle,
            bool claimed
        )
    {
        Bet storage bet = bets[marketId][betId];
        return (
            bet.bettor,
            bet.publicStake,
            euint64.unwrap(bet.encryptedStake),
            euint16.unwrap(bet.encryptedOutcomeMask),
            euint16.unwrap(bet.encryptedCareMask),
            bet.claimed
        );
    }

    function proposeUmaResolution(uint256 marketId, uint16 outcomeVector, string calldata claim) external returns (bytes32 assertionId) {
        Market storage market = markets[marketId];
        if (market.creator == address(0)) revert InvalidMarket();
        if (market.resolved) revert MarketAlreadyResolved();
        if (market.resolutionTime != 0 && block.timestamp < market.resolutionTime) revert ResolutionNotReady();
        if (bond > 0) {
            bondCurrency.safeTransferFrom(msg.sender, address(this), bond);
            bondCurrency.forceApprove(address(optimisticOracle), bond);
        }

        assertionId = optimisticOracle.assertTruth(
            bytes(claim),
            msg.sender,
            address(this),
            address(0),
            assertionLiveness,
            bondCurrency,
            bond,
            assertionIdentifier,
            assertionDomain
        );

        market.umaAssertionId = assertionId;
        pendingResolutions[assertionId] = PendingResolution({marketId: marketId, outcomeVector: outcomeVector, exists: true});
        emit UmaResolutionProposed(marketId, assertionId, outcomeVector, claim);
    }

    function settleUmaResolution(bytes32 assertionId) external {
        optimisticOracle.settleAssertion(assertionId);
    }

    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) external {
        if (msg.sender != address(optimisticOracle)) revert OnlyOptimisticOracle();
        PendingResolution memory resolution = pendingResolutions[assertionId];
        if (!resolution.exists) revert UnknownAssertion();
        delete pendingResolutions[assertionId];
        if (!assertedTruthfully) revert UmaAssertionRejected();

        Market storage market = markets[resolution.marketId];
        market.resolved = true;
        market.outcomeVector = resolution.outcomeVector;
        emit MarketResolved(resolution.marketId, resolution.outcomeVector);
        _settleMarketFees(resolution.marketId, market);
    }

    function marketLifecycle(uint256 marketId)
        external
        view
        returns (
            uint64 tradingEndTime,
            uint64 eventOccurrenceTime,
            uint64 resolutionTime,
            uint256 creationFeePaid,
            bool creatorFeesPaid
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

    function claimCreatorFees() external {
        uint256 amount = pendingCreatorFees[msg.sender];
        if (amount == 0) revert NoFeesAvailable();
        pendingCreatorFees[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "creator fee failed");
    }

    function withdrawTreasuryFees(address payable recipient) external {
        require(msg.sender == treasury, "treasury only");
        require(recipient != address(0), "recipient required");
        uint256 amount = treasuryFeeBalance;
        if (amount == 0) revert NoFeesAvailable();
        treasuryFeeBalance = 0;
        (bool ok,) = recipient.call{value: amount}("");
        require(ok, "withdraw failed");
        emit TreasuryFeesWithdrawn(recipient, amount);
    }

    function _settleMarketFees(uint256 marketId, Market storage market) internal {
        if (market.creatorFeesPaid) return;
        market.creatorFeesPaid = true;
        uint256 creatorAmount = (market.totalFees * CREATOR_FEE_SHARE_BPS) / BPS_DENOMINATOR;
        treasuryFeeBalance += market.totalFees - creatorAmount;
        if (creatorAmount == 0) return;
        (bool ok,) = payable(market.creator).call{value: creatorAmount}("");
        if (ok) {
            emit CreatorFeesPaid(marketId, market.creator, creatorAmount);
        } else {
            pendingCreatorFees[market.creator] += creatorAmount;
            emit CreatorFeesClaimable(marketId, market.creator, creatorAmount);
        }
    }

    function _feeFromGross(uint256 grossValue) internal view returns (uint256) {
        if (betFeeBps == 0) return 0;
        return (grossValue * betFeeBps) / (BPS_DENOMINATOR + betFeeBps);
    }
}
