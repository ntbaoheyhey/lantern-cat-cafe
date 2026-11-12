// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {Script, console2} from "forge-std/Script.sol";
import {RelicNFT} from "../src/RelicNFT.sol";
import {YarnToken} from "../src/YarnToken.sol";
import {RelicMarketV2} from "../src/RelicMarketV2.sol";
import {SeasonRewards} from "../src/SeasonRewards.sol";

/// @notice USER RUNS THIS. Does not redeploy either existing Relic contract.
contract DeployChainV2 is Script {
    function run() external returns (YarnToken token, RelicMarketV2 market, SeasonRewards rewards) {
        require(block.chainid == 43113, "Fuji only");
        address nft = 0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D;
        require(nft.code.length > 0, "Existing NFT missing");
        uint256 key = vm.envUint("CHAIN_DEPLOYER_PRIVATE_KEY");
        address distributor = vm.envAddress("YARN_DISTRIBUTOR_ADDRESS");
        address treasury = vm.envAddress("YARN_TREASURY_ADDRESS");
        address signer = vm.envAddress("CHAIN_VOUCHER_SIGNER_ADDRESS");
        require(RelicNFT(nft).signer() == signer, "Existing signer mismatch");
        uint256 fee = vm.envOr("MARKET_FEE_BPS", uint256(500));
        uint256 epoch = block.timestamp - (block.timestamp - 4 days) % 1 weeks;
        vm.startBroadcast(key);
        token = new YarnToken(distributor);
        market = new RelicMarketV2(nft, address(token), treasury, fee);
        rewards = new SeasonRewards(address(token), vm.addr(key), signer, 32 ether, epoch);
        vm.stopBroadcast();
        console2.log("YarnToken", address(token));
        console2.log("RelicMarketV2", address(market));
        console2.log("SeasonRewards", address(rewards));
        console2.log("Epoch", epoch);
    }
}
