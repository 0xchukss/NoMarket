// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {NoMarket} from "../src/NoMarket.sol";

contract DeployNoMarket is Script {
    function run() external returns (NoMarket noMarket) {
        address optimisticOracle = vm.envAddress("UMA_OPTIMISTIC_ORACLE_V3");
        address currency = vm.envAddress("UMA_CURRENCY");
        uint256 bond = vm.envOr("UMA_BOND_WEI", uint256(0));
        uint64 liveness = uint64(vm.envOr("UMA_LIVENESS_SECONDS", uint256(7200)));
        bytes32 identifier = vm.envOr("UMA_ASSERTION_IDENTIFIER", bytes32(0));
        bytes32 domain = vm.envOr("UMA_DOMAIN", bytes32(0));

        vm.startBroadcast(vm.envUint("DEPLOYER_PRIVATE_KEY"));
        noMarket = new NoMarket(optimisticOracle, currency, bond, liveness, identifier, domain);
        vm.stopBroadcast();
    }
}
