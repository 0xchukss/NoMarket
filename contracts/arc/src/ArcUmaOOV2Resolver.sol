// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IOptimisticOracleV2 {
    function getCurrentTime() external view returns (uint256);

    function requestPrice(
        bytes32 identifier,
        uint256 timestamp,
        bytes memory ancillaryData,
        address currency,
        uint256 reward
    ) external returns (uint256 totalBond);

    function setCustomLiveness(bytes32 identifier, uint256 timestamp, bytes memory ancillaryData, uint256 customLiveness)
        external;

    function setBond(bytes32 identifier, uint256 timestamp, bytes memory ancillaryData, uint256 bond)
        external
        returns (uint256 totalBond);

    function setEventBased(bytes32 identifier, uint256 timestamp, bytes memory ancillaryData) external;

    function setCallbacks(
        bytes32 identifier,
        uint256 timestamp,
        bytes memory ancillaryData,
        bool callbackOnPriceProposed,
        bool callbackOnPriceDisputed,
        bool callbackOnPriceSettled
    ) external;

    function proposePriceFor(
        address proposer,
        address requester,
        bytes32 identifier,
        uint256 timestamp,
        bytes memory ancillaryData,
        int256 proposedPrice
    ) external returns (uint256 totalBond);

    function settle(address requester, bytes32 identifier, uint256 timestamp, bytes memory ancillaryData)
        external
        returns (uint256 payout);
}

interface INoMarketAssertionCallback {
    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) external;
}

contract ArcUmaOOV2Resolver {
    struct Assertion {
        address callbackRecipient;
        address asserter;
        uint256 timestamp;
        bytes ancillaryData;
        bool settled;
        bool assertedTruthfully;
    }

    IOptimisticOracleV2 public immutable optimisticOracle;
    address public immutable collateralToken;
    bytes32 public immutable identifier;
    uint256 public immutable liveness;
    uint256 public nextAssertionNonce;

    mapping(bytes32 => Assertion) private assertions;
    mapping(bytes32 => bytes32) public requestKeyToAssertionId;

    event AssertionRequested(bytes32 indexed assertionId, address indexed asserter, address indexed callbackRecipient, bytes claim);
    event AssertionSettled(bytes32 indexed assertionId, bool assertedTruthfully, int256 resolvedPrice);

    constructor(address optimisticOracleV2_, address collateralToken_, bytes32 identifier_, uint256 liveness_) {
        require(optimisticOracleV2_ != address(0), "oo required");
        require(collateralToken_ != address(0), "collateral required");
        require(identifier_ != bytes32(0), "identifier required");
        optimisticOracle = IOptimisticOracleV2(optimisticOracleV2_);
        collateralToken = collateralToken_;
        identifier = identifier_;
        liveness = liveness_;
    }

    function assertTruthWithDefaults(bytes calldata claim, address asserter, address callbackRecipient)
        external
        returns (bytes32 assertionId)
    {
        require(claim.length > 0, "claim required");
        require(callbackRecipient != address(0), "callback required");

        assertionId = keccak256(
            abi.encode(address(this), block.chainid, callbackRecipient, asserter, claim, nextAssertionNonce++)
        );
        uint256 timestamp = optimisticOracle.getCurrentTime();
        bytes memory ancillaryData = abi.encodePacked(claim, "\nassertionId:", assertionId);
        bytes32 requestKey = keccak256(abi.encode(identifier, timestamp, ancillaryData));

        assertions[assertionId] = Assertion({
            callbackRecipient: callbackRecipient,
            asserter: asserter,
            timestamp: timestamp,
            ancillaryData: ancillaryData,
            settled: false,
            assertedTruthfully: false
        });
        requestKeyToAssertionId[requestKey] = assertionId;

        optimisticOracle.requestPrice(identifier, timestamp, ancillaryData, collateralToken, 0);
        if (liveness > 0) {
            optimisticOracle.setCustomLiveness(identifier, timestamp, ancillaryData, liveness);
        }
        optimisticOracle.setBond(identifier, timestamp, ancillaryData, 0);
        optimisticOracle.setEventBased(identifier, timestamp, ancillaryData);
        optimisticOracle.setCallbacks(identifier, timestamp, ancillaryData, false, false, true);
        optimisticOracle.proposePriceFor(asserter, address(this), identifier, timestamp, ancillaryData, 1e18);

        emit AssertionRequested(assertionId, asserter, callbackRecipient, claim);
    }

    function settleAssertion(bytes32 assertionId, bool) external {
        Assertion storage assertion = assertions[assertionId];
        require(assertion.callbackRecipient != address(0), "assertion missing");
        require(!assertion.settled, "already settled");
        optimisticOracle.settle(address(this), identifier, assertion.timestamp, assertion.ancillaryData);
    }

    function priceSettled(bytes32 settledIdentifier, uint256 timestamp, bytes memory ancillaryData, int256 price) external {
        require(msg.sender == address(optimisticOracle), "oo only");
        require(settledIdentifier == identifier, "wrong identifier");

        bytes32 assertionId = requestKeyToAssertionId[keccak256(abi.encode(settledIdentifier, timestamp, ancillaryData))];
        require(assertionId != bytes32(0), "assertion missing");

        Assertion storage assertion = assertions[assertionId];
        if (assertion.settled) return;

        bool truth = price >= 1e18;
        assertion.settled = true;
        assertion.assertedTruthfully = truth;
        INoMarketAssertionCallback(assertion.callbackRecipient).assertionResolvedCallback(assertionId, truth);

        emit AssertionSettled(assertionId, truth, price);
    }

    function getAssertion(bytes32 assertionId)
        external
        view
        returns (
            address callbackRecipient,
            address asserter,
            uint256 timestamp,
            bytes memory ancillaryData,
            bool settled,
            bool assertedTruthfully
        )
    {
        Assertion storage assertion = assertions[assertionId];
        return (
            assertion.callbackRecipient,
            assertion.asserter,
            assertion.timestamp,
            assertion.ancillaryData,
            assertion.settled,
            assertion.assertedTruthfully
        );
    }
}
