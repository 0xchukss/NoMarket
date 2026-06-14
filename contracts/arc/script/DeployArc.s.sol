// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import { ArcUmaOOV2Resolver } from "../src/ArcUmaOOV2Resolver.sol";
import { NoMarketArc } from "../src/NoMarketArc.sol";
import { MockOOv3 } from "shared/MockOOv3.sol";

contract DeployArc is Script {
    bytes32 internal constant YES_OR_NO_QUERY = 0x5945535f4f525f4e4f5f51554552590000000000000000000000000000000000;

    function run() external returns (NoMarketArc noMarket, address oracle) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        oracle = vm.envOr("ARC_UMA_RESOLVER_ADDRESS", address(0));
        address ooV2 = vm.envOr("UMA_OOV2_ADDRESS_ARC", address(0));
        address collateral = vm.envOr("ARC_UMA_COLLATERAL_ADDRESS", address(0));
        uint256 liveness = vm.envOr("ARC_UMA_LIVENESS_SECONDS", uint256(60));
        uint256 creationFee = vm.envOr("ARC_MARKET_CREATION_DEPOSIT_WEI", uint256(5 ether));
        uint256 betFeeBps = vm.envOr("ARC_BET_FEE_BPS", uint256(200));

        vm.startBroadcast(deployerKey);
        if (oracle == address(0)) {
            if (ooV2 != address(0) && collateral != address(0)) {
                oracle = address(new ArcUmaOOV2Resolver(ooV2, collateral, YES_OR_NO_QUERY, liveness));
            } else {
                oracle = address(new MockOOv3());
            }
        }
        noMarket = new NoMarketArc(oracle, creationFee, betFeeBps);
        vm.stopBroadcast();
    }
}
