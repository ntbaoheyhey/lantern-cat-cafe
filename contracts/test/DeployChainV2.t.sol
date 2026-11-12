// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {Test} from "forge-std/Test.sol";
import {DeployChainV2} from "../script/DeployChainV2.s.sol";
import {RelicNFT} from "../src/RelicNFT.sol";
import {YarnToken} from "../src/YarnToken.sol";
import {RelicMarketV2} from "../src/RelicMarketV2.sol";
import {SeasonRewards} from "../src/SeasonRewards.sol";

contract DeployChainV2Test is Test {
    function test_scriptKeepsExistingNFTAndConfiguresNewContracts() public {
        vm.chainId(43113);
        vm.warp(1800000000);
        address fixedNFT = 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D;
        uint256 key = uint256(keccak256("disposable deploy test"));
        address signer = makeAddr("signer");
        // Foundry environment mutations are process-wide, including concurrently running suites.
        // Keep V2 variables distinct from the legacy deployment test/script.
        vm.setEnv("CHAIN_DEPLOYER_PRIVATE_KEY", vm.toString(key));
        vm.setEnv("CHAIN_VOUCHER_SIGNER_ADDRESS", vm.toString(signer));
        vm.setEnv("YARN_DISTRIBUTOR_ADDRESS", vm.toString(vm.addr(key)));
        vm.setEnv("YARN_TREASURY_ADDRESS", vm.toString(makeAddr("treasury")));
        vm.setEnv("MARKET_FEE_BPS", "500");
        RelicNFT template = new RelicNFT(address(this), signer, "");
        vm.etch(fixedNFT, address(template).code);
        vm.mockCall(fixedNFT, abi.encodeWithSignature("signer()"), abi.encode(signer));
        bytes32 beforeHash = fixedNFT.codehash;
        DeployChainV2 script = new DeployChainV2();
        (YarnToken y, RelicMarketV2 m, SeasonRewards r) = script.run();
        assertEq(fixedNFT.codehash, beforeHash);
        assertEq(address(m.relicNFT()), fixedNFT);
        assertEq(address(m.yarn()), address(y));
        assertEq(m.feeBps(), 500);
        assertEq(r.signer(), signer);
        assertEq(r.weeklyCap(), 32 ether);
        assertEq(y.balanceOf(vm.addr(key)), 1_000_000_000 ether);
        vm.chainId(43114);
        vm.expectRevert("Fuji only");
        script.run();
    }
}
