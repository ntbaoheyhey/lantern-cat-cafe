// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {RelicNFT} from "../src/RelicNFT.sol";
import {RelicMarket} from "../src/RelicMarket.sol";

/// @dev A buyer that cannot receive ERC-1155 tokens (no receiver hook).
contract NonReceiverBuyer {
    function buy(RelicMarket market, uint256 id) external payable {
        market.buy{value: msg.value}(id);
    }
}

/// Edge cases found by the B3-H5 coverage review (docs/contracts-coverage.md). Tests only.
contract RelicEdgesTest is Test {
    uint8 internal constant RARITY = 2;

    RelicNFT internal relic;
    RelicMarket internal market;
    address internal owner = makeAddr("owner");
    address internal signer;
    uint256 internal signerKey;
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");
    uint256 internal nonce;

    function setUp() public {
        vm.chainId(43113);
        vm.warp(1_700_000_000);
        (signer, signerKey) = makeAddrAndKey("signer");
        relic = new RelicNFT(owner, signer, "https://relics.example/{id}.json");
        market = new RelicMarket(address(relic));
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
    }

    function _voucher(address player, uint256 relicId, uint256 expiry)
        internal
        returns (RelicNFT.Voucher memory v, bytes memory sig)
    {
        v = RelicNFT.Voucher({player: player, relicId: relicId, rarity: RARITY, nonce: ++nonce, expiry: expiry});
        (uint8 sv, bytes32 r, bytes32 s) = vm.sign(signerKey, relic.hashVoucher(v));
        sig = abi.encodePacked(r, s, sv);
    }

    function _mint(address player, uint256 relicId, uint256 count) internal {
        for (uint256 i; i < count; ++i) {
            (RelicNFT.Voucher memory v, bytes memory sig) = _voucher(player, relicId, block.timestamp + 1 hours);
            vm.prank(player);
            relic.mint(v, sig);
        }
    }

    function _list(address seller, uint256 relicId, uint256 amount, uint256 price) internal returns (uint256 id) {
        _mint(seller, relicId, amount);
        vm.prank(seller);
        relic.setApprovalForAll(address(market), true);
        vm.prank(seller);
        id = market.list(relicId, amount, price);
    }

    // ---------------------------------------------------------------- RelicNFT

    function test_voucherExpiredLongAgoReverts() public {
        (RelicNFT.Voucher memory v, bytes memory sig) = _voucher(alice, 1, 0);
        vm.prank(alice);
        vm.expectRevert(RelicNFT.VoucherExpired.selector);
        relic.mint(v, sig);
    }

    function test_expiredVoucherDoesNotBurnItsNonce() public {
        (RelicNFT.Voucher memory v,) = _voucher(alice, 1, block.timestamp + 10);
        vm.warp(block.timestamp + 11);
        vm.prank(alice);
        vm.expectRevert(RelicNFT.VoucherExpired.selector);
        relic.mint(v, hex"");
        assertFalse(relic.usedNonces(v.nonce));
    }

    function test_sameRelicMintsTwiceWithDifferentNonces() public {
        _mint(alice, 5, 2);
        assertEq(relic.balanceOf(alice, 5), 2);
        assertEq(relic.rarityOf(5), RARITY);
    }

    function test_failedMintDoesNotUseNonceOrCreateRelic() public {
        (RelicNFT.Voucher memory v, bytes memory sig) = _voucher(alice, 9, block.timestamp + 1 hours);
        vm.prank(bob); // wrong caller
        vm.expectRevert(RelicNFT.NotVoucherPlayer.selector);
        relic.mint(v, sig);
        assertFalse(relic.usedNonces(v.nonce));
        assertFalse(relic.relicExists(9));
        // The right caller can still use it.
        vm.prank(alice);
        relic.mint(v, sig);
        assertEq(relic.balanceOf(alice, 9), 1);
    }

    function test_cancelledNonceLeavesNoRelic() public {
        (RelicNFT.Voucher memory v, bytes memory sig) = _voucher(alice, 4, block.timestamp + 1 hours);
        vm.prank(owner);
        relic.cancelNonce(v.nonce);
        vm.prank(alice);
        vm.expectRevert(RelicNFT.NonceAlreadyUsed.selector);
        relic.mint(v, sig);
        assertEq(relic.balanceOf(alice, 4), 0);
        assertFalse(relic.relicExists(4));
    }

    function test_cancelUnissuedNonceBlocksItLater() public {
        vm.prank(owner);
        relic.cancelNonce(777);
        (RelicNFT.Voucher memory v, bytes memory sig) = _voucher(alice, 1, block.timestamp + 1 hours);
        v.nonce = 777;
        (uint8 sv, bytes32 r, bytes32 s) = vm.sign(signerKey, relic.hashVoucher(v));
        sig = abi.encodePacked(r, s, sv);
        vm.prank(alice);
        vm.expectRevert(RelicNFT.NonceAlreadyUsed.selector);
        relic.mint(v, sig);
    }

    function test_ownershipTransferMovesAdminRights() public {
        vm.prank(owner);
        relic.transferOwnership(bob);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, owner));
        relic.cancelNonce(1);
        vm.prank(bob);
        relic.cancelNonce(1);
        assertTrue(relic.usedNonces(1));
    }

    function test_supportsErc1155Interface() public view {
        assertTrue(relic.supportsInterface(0xd9b67a26)); // ERC-1155
        assertTrue(relic.supportsInterface(type(IERC165).interfaceId));
        assertFalse(relic.supportsInterface(0xffffffff));
    }

    // ---------------------------------------------------------------- RelicMarket

    function test_buyWithZeroValueWrongPaymentReverts() public {
        uint256 id = _list(alice, 1, 1, 1 ether);
        vm.prank(bob);
        vm.expectRevert(RelicMarket.WrongPayment.selector);
        market.buy(id);
        assertTrue(market.isActive(id));
        assertEq(relic.balanceOf(address(market), 1), 1);
    }

    function test_wrongPriceKeepsListingAndEscrow() public {
        uint256 id = _list(alice, 1, 2, 3 ether);
        vm.startPrank(bob);
        vm.expectRevert(RelicMarket.WrongPayment.selector);
        market.buy{value: 3 ether - 1}(id);
        vm.expectRevert(RelicMarket.WrongPayment.selector);
        market.buy{value: 3 ether + 1}(id);
        vm.stopPrank();
        assertTrue(market.isActive(id));
        assertEq(relic.balanceOf(address(market), 1), 2);
        assertEq(address(market).balance, 0);
    }

    function test_cancelByNonSellerLeavesListingIntact() public {
        uint256 id = _list(alice, 1, 1, 1 ether);
        vm.prank(bob);
        vm.expectRevert(RelicMarket.NotSeller.selector);
        market.cancel(id);
        assertTrue(market.isActive(id));
        assertEq(market.getListing(id).seller, alice);
    }

    function test_sellerCanBuyOwnListing() public {
        uint256 id = _list(alice, 1, 1, 1 ether);
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        market.buy{value: 1 ether}(id);
        assertEq(relic.balanceOf(alice, 1), 1);
        assertEq(alice.balance, 1 ether);
        assertFalse(market.isActive(id));
    }

    function test_buyerThatCannotReceiveRevertsAndRefundsEverything() public {
        uint256 id = _list(alice, 1, 1, 1 ether);
        NonReceiverBuyer b = new NonReceiverBuyer();
        vm.deal(address(b), 1 ether);
        vm.expectRevert(); // ERC1155InvalidReceiver bubbles up
        b.buy{value: 1 ether}(market, id);
        assertTrue(market.isActive(id));
        assertEq(relic.balanceOf(address(market), 1), 1);
        assertEq(address(b).balance, 1 ether);
        assertEq(address(market).balance, 0);
    }

    function test_approvedOperatorCannotPushRelicIntoMarket() public {
        _mint(alice, 1, 1);
        vm.prank(alice);
        relic.setApprovalForAll(bob, true);
        vm.prank(bob);
        vm.expectRevert(RelicMarket.UnsolicitedTransfer.selector);
        relic.safeTransferFrom(alice, address(market), 1, 1, "");
        assertEq(relic.balanceOf(alice, 1), 1);
    }

    function test_receiverHooksRevertWhenCalledDirectly() public {
        vm.expectRevert(RelicMarket.UnsolicitedTransfer.selector);
        market.onERC1155Received(address(market), alice, 1, 1, "");
        uint256[] memory ids = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        vm.expectRevert(RelicMarket.UnsolicitedTransfer.selector);
        market.onERC1155BatchReceived(address(market), alice, ids, amounts, "");
    }

    function test_marketSupportsReceiverInterface() public view {
        assertTrue(market.supportsInterface(type(IERC1155Receiver).interfaceId));
    }

    function test_removingMiddleListingKeepsOthersBuyable() public {
        uint256 a = _list(alice, 1, 1, 1 ether);
        uint256 b = _list(bob, 2, 1, 2 ether);
        uint256 c = _list(carol, 3, 1, 3 ether);
        vm.prank(bob);
        market.cancel(b);
        assertEq(market.activeListingCount(), 2);
        assertTrue(market.isActive(a));
        assertTrue(market.isActive(c));
        assertFalse(market.isActive(b));
        vm.prank(bob);
        market.buy{value: 3 ether}(c);
        assertEq(relic.balanceOf(bob, 3), 1);
        assertEq(market.activeListingCount(), 1);
    }

    function test_getListingsEdgePaging() public {
        _list(alice, 1, 1, 1 ether);
        _list(bob, 2, 1, 2 ether);
        (uint256[] memory ids,) = market.getListings(0, 0);
        assertEq(ids.length, 0);
        (ids,) = market.getListings(2, 5); // offset == total
        assertEq(ids.length, 0);
        (ids,) = market.getListings(1, 10); // limit larger than the rest
        assertEq(ids.length, 1);
        (ids,) = market.getListings(type(uint256).max, 5);
        assertEq(ids.length, 0);
    }

    function test_listingAfterBuyUsesNewId() public {
        uint256 first = _list(alice, 1, 1, 1 ether);
        vm.prank(bob);
        market.buy{value: 1 ether}(first);
        vm.startPrank(bob);
        relic.setApprovalForAll(address(market), true);
        uint256 second = market.list(1, 1, 5 ether);
        vm.stopPrank();
        assertEq(second, first + 1);
        assertFalse(market.isActive(first));
        assertTrue(market.isActive(second));
    }
}
