// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {Script, console2} from "forge-std/Script.sol";
import {RelicForge} from "../src/RelicForge.sol";
import {YarnToken} from "../src/YarnToken.sol";

/// @notice Optional USER-RUN deployment. Preserves all existing Fuji contracts.
contract DeployRelicForge is Script {
    function run() external returns (RelicForge vault) {
        require(block.chainid == 43113, "Fuji only");
        address nft = 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D;
        address token = 0x3ae1b898c1Ded263b30D968D26Fe65211f102d6b;
        require(nft.code.length > 0 && token.code.length > 0, "Existing contracts missing");
        require(YarnToken(token).decimals() == 18, "Token mismatch");
        uint256 key = vm.envUint("CHAIN_FORGE_DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(key);
        vault = new RelicForge(nft, token);
        vm.stopBroadcast();
        console2.log("RelicForge", address(vault));
    }
}
