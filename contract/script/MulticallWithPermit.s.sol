// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {MulticallWithPermit} from "../src/MulticallWithPermit.sol";
import {Config} from "./Config.sol";

contract MulticallWithPermitScript is Script {
    MulticallWithPermit public multicaller;
    Config.NetworkConfig public networkConfig;

    address public owner = vm.envAddress("OWNER");

    function setUp() public {
        networkConfig = Config.getActiveNetworkConfig();
    }

    function run() public {
        vm.startBroadcast();

        multicaller =
            new MulticallWithPermit{salt: 0x00000000000000000000000000000000047d5e872f1b40dea95d3401c9a7b2d9}(owner);

        multicaller.initialize(networkConfig.usdc, networkConfig.messenger);

        vm.stopBroadcast();
    }
}
