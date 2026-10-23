// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {RelicNFT} from "../src/RelicNFT.sol";
import {RelicMarket} from "../src/RelicMarket.sol";

/// @notice Deploys RelicNFT and RelicMarket, then writes their addresses to
///         `packages/chain/deployments/<chainId>.json`.
/// @dev Env: DEPLOYER_PRIVATE_KEY (also becomes the RelicNFT owner), VOUCHER_SIGNER_ADDRESS,
///      RELIC_BASE_URI. See docs/deploy.md.
contract Deploy is Script {
    function run() external returns (RelicNFT nft, RelicMarket market) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address voucherSigner = vm.envAddress("VOUCHER_SIGNER_ADDRESS");
        string memory baseURI = vm.envString("RELIC_BASE_URI");

        vm.startBroadcast(deployerKey);
        nft = new RelicNFT(vm.addr(deployerKey), voucherSigner, baseURI);
        market = new RelicMarket(address(nft));
        vm.stopBroadcast();

        string memory key = "deployment";
        vm.serializeAddress(key, "RelicNFT", address(nft));
        string memory json = vm.serializeAddress(key, "RelicMarket", address(market));
        vm.writeJson(json, deploymentPath());
    }

    function deploymentPath() public view returns (string memory) {
        return string.concat(
            vm.projectRoot(), "/../packages/chain/deployments/", vm.toString(block.chainid), ".json"
        );
    }
}
