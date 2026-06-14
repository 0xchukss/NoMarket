// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IAssertionCallback {
    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) external;
}

contract MockOOv3 {
    struct Assertion {
        address asserter;
        address callbackRecipient;
        bytes claim;
        bool settled;
        bool truth;
    }

    mapping(bytes32 => Assertion) public assertions;
    mapping(bytes32 => uint256) public assertionIdToMarketId;

    event AssertionMade(bytes32 indexed assertionId, address indexed asserter, bytes claim);
    event AssertionSettled(bytes32 indexed assertionId, bool truth);

    function assertTruthWithDefaults(bytes calldata claim, address asserter, address callbackRecipient)
        external
        returns (bytes32 assertionId)
    {
        assertionId = keccak256(abi.encode(block.chainid, address(this), asserter, callbackRecipient, claim, block.number));
        assertions[assertionId] = Assertion({
            asserter: asserter,
            callbackRecipient: callbackRecipient,
            claim: claim,
            settled: false,
            truth: false
        });
        emit AssertionMade(assertionId, asserter, claim);
    }

    function setAssertionMarket(bytes32 assertionId, uint256 marketId) external {
        require(assertions[assertionId].asserter != address(0), "unknown assertion");
        assertionIdToMarketId[assertionId] = marketId;
    }

    function settleAssertion(bytes32 assertionId, bool truth) external {
        Assertion storage assertion = assertions[assertionId];
        require(assertion.asserter != address(0), "unknown assertion");
        require(!assertion.settled, "settled");

        assertion.settled = true;
        assertion.truth = truth;
        emit AssertionSettled(assertionId, truth);

        if (assertion.callbackRecipient != address(0)) {
            IAssertionCallback(assertion.callbackRecipient).assertionResolvedCallback(assertionId, truth);
        }
    }
}
