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
    }

    struct Bet {
        address bettor;
        uint256 publicStake;
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

    uint256 public marketCount;
    mapping(uint256 marketId => Market) public markets;
    mapping(uint256 marketId => mapping(uint256 betId => Bet)) private bets;
    mapping(bytes32 assertionId => PendingResolution) public pendingResolutions;

    event MarketCreated(uint256 indexed marketId, address indexed creator, string title, string question, uint16 atomCount);
    event BetPlaced(
        uint256 indexed marketId,
        uint256 indexed betId,
        address indexed bettor,
        uint256 publicStake,
        bytes32 encryptedStakeHandle,
        bytes32 encryptedOutcomeMaskHandle,
        bytes32 encryptedCareMaskHandle
    );
    event UmaResolutionProposed(uint256 indexed marketId, bytes32 indexed assertionId, uint16 outcomeVector, string claim);
    event MarketResolved(uint256 indexed marketId, uint16 outcomeVector);

    error InvalidAtomCount();
    error InvalidMarket();
    error MarketNotOpen();
    error MarketAlreadyResolved();
    error EmptyStake();
    error OnlyOptimisticOracle();
    error UnknownAssertion();
    error UmaAssertionRejected();

    constructor(
        address optimisticOracle_,
        address bondCurrency_,
        uint256 bond_,
        uint64 assertionLiveness_,
        bytes32 assertionIdentifier_,
        bytes32 assertionDomain_
    ) {
        optimisticOracle = IOptimisticOracleV3(optimisticOracle_);
        bondCurrency = IERC20(bondCurrency_);
        bond = bond_;
        assertionLiveness = assertionLiveness_;
        assertionIdentifier = assertionIdentifier_;
        assertionDomain = assertionDomain_;
    }

    function createMarket(string calldata title, string calldata question, uint16 atomCount) external returns (uint256 marketId) {
        if (atomCount < 2 || atomCount > 16) revert InvalidAtomCount();

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
            umaAssertionId: bytes32(0)
        });

        emit MarketCreated(marketId, msg.sender, title, question, atomCount);
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

        euint64 privateStake = FHE.fromExternal(encryptedStake, inputProof);
        euint16 outcomeMask = FHE.fromExternal(encryptedOutcomeMask, inputProof);
        euint16 careMask = FHE.fromExternal(encryptedCareMask, inputProof);

        betId = ++market.betCount;
        market.totalStake += msg.value;

        bets[marketId][betId] = Bet({
            bettor: msg.sender,
            publicStake: msg.value,
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
            msg.value,
            euint64.unwrap(privateStake),
            euint16.unwrap(outcomeMask),
            euint16.unwrap(careMask)
        );
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
    }
}
