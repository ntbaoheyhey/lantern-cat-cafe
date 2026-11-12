// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {RelicNFT} from "../src/RelicNFT.sol";
import {YarnToken} from "../src/YarnToken.sol";
import {RelicForge} from "../src/RelicForge.sol";

contract RelicForgeTest is Test {
    RelicNFT nft;
    YarnToken yarn;
    RelicForge vault;
    address alice = makeAddr("forge alice");
    address bob = makeAddr("forge bob");
    uint256 signerKey;
    uint256 nonce;

    function setUp() public {
        vm.chainId(43113);
        vm.warp(1_800_000_000);
        (address signer, uint256 key) = makeAddrAndKey("forge signer");
        signerKey = key;
        nft = new RelicNFT(address(this), signer, "test://{id}");
        yarn = new YarnToken(address(this));
        vault = new RelicForge(address(nft), address(yarn));
        yarn.transfer(alice, 20 ether);
        vm.startPrank(alice);
        nft.setApprovalForAll(address(vault), true);
        yarn.approve(address(vault), 9 ether);
        vm.stopPrank();
    }

    function mint(address who, uint256 id, uint8 rarity) internal {
        RelicNFT.Voucher memory v = RelicNFT.Voucher(who, id, rarity, ++nonce, block.timestamp + 1 hours);
        (uint8 vv, bytes32 r, bytes32 s) = vm.sign(signerKey, nft.hashVoucher(v));
        vm.prank(who);
        nft.mint(v, abi.encodePacked(r, s, vv));
    }

    function pair() internal {
        mint(alice, 20020, 2);
        mint(alice, 20723, 2);
    }

    function untouched() internal view {
        assertEq(nft.balanceOf(alice, 20020), 1);
        assertEq(nft.balanceOf(alice, 20723), 1);
        assertEq(nft.balanceOf(address(vault), 20020), 0);
        assertEq(vault.consumedOf(20020), 0);
        assertEq(vault.totalCrafted(), 0);
        assertEq(yarn.balanceOf(alice), 20 ether);
        assertFalse(vault.hasDesign(alice, 0));
    }

    function test_atomicCustodyAndActualBurn() public {
        pair();
        uint256 supply = yarn.totalSupply();
        vm.prank(alice);
        vault.forge(0, 20020, 20723);
        assertEq(nft.balanceOf(alice, 20020), 0);
        assertEq(nft.balanceOf(alice, 20723), 0);
        assertEq(nft.balanceOf(address(vault), 20020), 1);
        assertEq(nft.balanceOf(address(vault), 20723), 1);
        assertEq(vault.consumedOf(20020), 1);
        assertEq(vault.totalCrafted(), 1);
        assertTrue(vault.hasDesign(alice, 0));
        assertFalse(vault.hasDesign(bob, 0));
        assertEq(yarn.totalSupply(), supply - 3 ether);
        assertEq(yarn.balanceOf(alice), 17 ether);
        assertEq(yarn.balanceOf(address(vault)), 0);
        assertEq(yarn.burnedInWeek((block.timestamp - 4 days) / 1 weeks), 3 ether);
        vm.prank(alice);
        vm.expectRevert(RelicForge.AlreadyForged.selector);
        vault.forge(0, 20020, 20723);
        assertEq(yarn.totalSupply(), supply - 3 ether);
    }

    function test_sameIdConsumesExactlyTwo() public {
        mint(alice, 20020, 2);
        vm.prank(alice);
        vm.expectRevert();
        vault.forge(0, 20020, 20020);
        assertEq(nft.balanceOf(alice, 20020), 1);
        assertFalse(vault.hasDesign(alice, 0));
        mint(alice, 20020, 2);
        vm.prank(alice);
        vault.forge(0, 20020, 20020);
        assertEq(nft.balanceOf(address(vault), 20020), 2);
        assertEq(vault.consumedOf(20020), 2);
    }

    function test_failedPaymentRollsBackBothItems() public {
        pair();
        vm.prank(alice);
        yarn.approve(address(vault), 3 ether - 1);
        vm.prank(alice);
        vm.expectRevert();
        vault.forge(0, 20020, 20723);
        untouched();
    }

    function test_missingApprovalOrOwnershipNeverCharges() public {
        pair();
        vm.prank(alice);
        nft.setApprovalForAll(address(vault), false);
        vm.prank(alice);
        vm.expectRevert();
        vault.forge(0, 20020, 20723);
        untouched();
        vm.prank(bob);
        vm.expectRevert();
        vault.forge(0, 20020, 20723);
        untouched();
    }

    function test_rejectsNonEpicAndUnknownInputs() public {
        mint(alice, 20020, 1); // maliciously signed inconsistent rarity is rejected.
        mint(alice, 20723, 2);
        vm.prank(alice);
        vm.expectRevert(RelicForge.InvalidInput.selector);
        vault.forge(0, 20020, 20723);
        vm.prank(alice);
        vm.expectRevert(RelicForge.InvalidInput.selector);
        vault.forge(0, 20120, 20723); // catalog ID but never minted.
        for (uint256 i; i < 4; i++) {
            uint256 id = [uint256(3), 10001, 20030, 20820][i];
            vm.prank(alice);
            vm.expectRevert(RelicForge.InvalidInput.selector);
            vault.forge(0, id, 20723);
        }
        untouched();
    }

    function test_unpromptedTransfersAndFakeHooksRejected() public {
        pair();
        vm.prank(alice);
        vm.expectRevert(RelicForge.UnsolicitedTransfer.selector);
        nft.safeTransferFrom(alice, address(vault), 20020, 1, "");
        uint256[] memory ids = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        ids[0] = 20020;
        amounts[0] = 1;
        vm.prank(alice);
        vm.expectRevert(RelicForge.UnsolicitedTransfer.selector);
        nft.safeBatchTransferFrom(alice, address(vault), ids, amounts, "");
        vm.expectRevert(RelicForge.UnsolicitedTransfer.selector);
        vault.onERC1155BatchReceived(address(vault), alice, ids, amounts, "");
        untouched();
    }

    function test_noWithdrawalOrApprovalRoute() public {
        pair();
        vm.prank(alice);
        vault.forge(0, 20020, 20723);
        (bool ok,) = address(vault).call(abi.encodeWithSignature("withdraw(address,uint256)", alice, 20020));
        assertFalse(ok);
        (ok,) = address(vault).call(abi.encodeWithSignature("setApprovalForAll(address,bool)", alice, true));
        assertFalse(ok);
        vm.prank(alice);
        vm.expectRevert();
        nft.safeTransferFrom(address(vault), alice, 20020, 1, "");
        assertTrue(vault.supportsInterface(0x4e2312e0));
    }

    function test_constructorAndDesignGuards() public {
        vm.expectRevert(RelicForge.InvalidConfig.selector);
        new RelicForge(address(0), address(yarn));
        vm.expectRevert(RelicForge.InvalidConfig.selector);
        new RelicForge(address(nft), bob);
        vm.expectRevert(RelicForge.InvalidConfig.selector);
        new RelicForge(address(nft), address(nft));
        vm.chainId(43114);
        vm.expectRevert(RelicForge.InvalidConfig.selector);
        new RelicForge(address(nft), address(yarn));
        vm.chainId(43113);
        vm.expectRevert(RelicForge.InvalidDesign.selector);
        vault.forge(3, 20020, 20723);
    }

    function testFuzz_catalogAndFiniteThreeDesigns(uint256 id, uint8 design) public {
        bool expected = id >= 20020 && id <= 20723 && id % 100 >= 20 && id % 100 <= 23;
        assertEq(vault.validInputId(id), expected);
        design = uint8(bound(design, 0, 2));
        pair();
        vm.prank(alice);
        vault.forge(design, 20020, 20723);
        assertTrue(vault.hasDesign(alice, design));
    }
}

contract ForgeHandler is ERC1155Holder {
    RelicForge vault;

    constructor(RelicForge v, RelicNFT nft, YarnToken yarn) {
        vault = v;
        nft.setApprovalForAll(address(v), true);
        yarn.approve(address(v), 9 ether);
    }

    function craft(uint8 design) external {
        try vault.forge(design % 4, 20020, 20020) {} catch {}
    }
}

contract ForgeInvariantTest is StdInvariant, Test {
    RelicNFT nft;
    YarnToken yarn;
    RelicForge vault;
    ForgeHandler handler;

    function setUp() public {
        vm.chainId(43113);
        vm.warp(1_800_000_000);
        (address signer, uint256 key) = makeAddrAndKey("forge invariant signer");
        nft = new RelicNFT(address(this), signer, "test://{id}");
        yarn = new YarnToken(address(this));
        vault = new RelicForge(address(nft), address(yarn));
        handler = new ForgeHandler(vault, nft, yarn);
        yarn.transfer(address(handler), 9 ether);
        for (uint256 i; i < 6; i++) {
            RelicNFT.Voucher memory v = RelicNFT.Voucher(address(handler), 20020, 2, i, block.timestamp + 1 hours);
            (uint8 vv, bytes32 r, bytes32 s) = vm.sign(key, nft.hashVoucher(v));
            vm.prank(address(handler));
            nft.mint(v, abi.encodePacked(r, s, vv));
        }
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = ForgeHandler.craft.selector;
        targetSelector(FuzzSelector(address(handler), selectors));
        targetContract(address(handler));
    }

    function invariant_itemsAndTokensConserveWithoutExit() public view {
        uint256 count = vault.totalCrafted();
        assertLe(count, 3);
        assertEq(nft.balanceOf(address(vault), 20020), 2 * count);
        assertEq(vault.consumedOf(20020), 2 * count);
        assertEq(nft.balanceOf(address(handler), 20020) + 2 * count, 6);
        assertEq(yarn.totalSupply() + count * 3 ether, 1_000_000_000 ether);
        assertEq(yarn.balanceOf(address(handler)) + count * 3 ether, 9 ether);
        uint256 unlocked;
        for (uint8 i; i < 3; i++) {
            if (vault.hasDesign(address(handler), i)) unlocked++;
        }
        assertEq(count, unlocked);
    }
}
