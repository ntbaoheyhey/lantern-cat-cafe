// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../script/Deploy.s.sol";
import {RelicNFT} from "../src/RelicNFT.sol";
import {RelicMarket} from "../src/RelicMarket.sol";

/// @dev Runs the deploy script in the in-process EVM as chain 31337 with anvil's first default key,
///      so the written packages/chain/deployments/31337.json matches a real `anvil` deploy.
contract DeployTest is Test {
    // anvil / hardhat default account #0, public test key, never funded on a real network.
    uint256 internal constant ANVIL_KEY_0 = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    address internal constant VOUCHER_SIGNER = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

    function test_deployScript_wiresContractsAndWritesAddresses() public {
        vm.chainId(31337);
        vm.setEnv("DEPLOYER_PRIVATE_KEY", vm.toString(bytes32(ANVIL_KEY_0)));
        vm.setEnv("VOUCHER_SIGNER_ADDRESS", vm.toString(VOUCHER_SIGNER));
        vm.setEnv("RELIC_BASE_URI", "https://relics.example/{id}.json");

        Deploy script = new Deploy();
        (RelicNFT nft, RelicMarket market) = script.run();

        assertEq(nft.signer(), VOUCHER_SIGNER);
        assertEq(nft.owner(), vm.addr(ANVIL_KEY_0));
        assertEq(nft.uri(1), "https://relics.example/{id}.json");
        assertEq(address(market.relicNFT()), address(nft));

        string memory json = vm.readFile(script.deploymentPath());
        assertEq(vm.parseJsonAddress(json, ".RelicNFT"), address(nft));
        assertEq(vm.parseJsonAddress(json, ".RelicMarket"), address(market));
    }
}
