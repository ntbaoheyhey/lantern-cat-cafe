// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC1155Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {RelicNFT} from "../src/RelicNFT.sol";
import {RelicMarket} from "../src/RelicMarket.sol";

contract RelicMarketFuzzTest is Test {
    uint256 internal constant RELIC = 7;
    RelicNFT internal relic;
    RelicMarket internal market;
    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");
    uint256 internal signerKey;
    uint256 internal nonce;

    function setUp() public {
        vm.chainId(43113);
        vm.warp(1_700_000_000);
        address signer;
        (signer, signerKey) = makeAddrAndKey("signer");
        relic = new RelicNFT(owner, signer, "https://relics.example/{id}.json");
        market = new RelicMarket(address(relic));
    }

    // ---------- helpers ----------

    function _voucher(uint256 voucherNonce, uint256 expiry) internal view returns (RelicNFT.Voucher memory) {
        return RelicNFT.Voucher({player: alice, relicId: RELIC, rarity: 3, nonce: voucherNonce, expiry: expiry});
    }

    function _sign(RelicNFT.Voucher memory v) internal view returns (bytes memory) {
        (uint8 sv, bytes32 r, bytes32 s) = vm.sign(signerKey, relic.hashVoucher(v));
        return abi.encodePacked(r, s, sv);
    }

    function _mint(address player, uint256 count) internal {
        for (uint256 i; i < count; ++i) {
            RelicNFT.Voucher memory v = _voucher(++nonce, block.timestamp + 1 hours);
            v.player = player;
            bytes memory sig = _sign(v);
            vm.prank(player);
            relic.mint(v, sig);
        }
    }

    function _list(address seller, uint256 amount, uint256 price) internal returns (uint256 id) {
        _mint(seller, amount);
        vm.startPrank(seller);
        relic.setApprovalForAll(address(market), true);
        id = market.list(RELIC, amount, price);
        vm.stopPrank();
    }

    function _assertActive(uint256 id, address seller, uint256 amount, uint256 price) internal view {
        assertTrue(market.isActive(id));
        RelicMarket.Listing memory l = market.getListing(id);
        assertEq(l.seller, seller);
        assertEq(l.relicId, RELIC);
        assertEq(l.amount, amount);
        assertEq(l.price, price);
    }

    function _assertRemoved(uint256 id) internal view {
        assertFalse(market.isActive(id));
        RelicMarket.Listing memory l = market.getListing(id);
        assertEq(l.seller, address(0));
        assertEq(l.relicId, 0);
        assertEq(l.amount, 0);
        assertEq(l.price, 0);
    }

    // ---------- payments and escrow ----------

    function testFuzz_wrongPaymentsRollbackThenExactPaymentSettlesOnce(uint256 price, uint256 amount, uint256 delta)
        public
    {
        price = bound(price, 1, type(uint128).max);
        amount = bound(amount, 1, 16); // Mint real signed vouchers; bound loop cost only.
        delta = bound(delta, 1, price);
        CountingRelicSeller seller = new CountingRelicSeller();
        uint256 id = _list(address(seller), amount, price);
        vm.deal(bob, price + delta);
        uint256 totalBefore = bob.balance + address(seller).balance + address(market).balance;

        uint256[2] memory wrongValues = [price - delta, price + delta];
        for (uint256 i; i < wrongValues.length; ++i) {
            vm.prank(bob);
            vm.expectRevert(RelicMarket.WrongPayment.selector);
            market.buy{value: wrongValues[i]}(id);
            assertEq(bob.balance, price + delta);
            assertEq(address(seller).balance, 0);
            assertEq(seller.payments(), 0);
            assertEq(address(market).balance, 0);
            assertEq(relic.balanceOf(bob, RELIC), 0);
            assertEq(relic.balanceOf(address(market), RELIC), amount);
            _assertActive(id, address(seller), amount, price);
            assertEq(market.activeListingCount(), 1);
        }

        vm.prank(bob);
        market.buy{value: price}(id);
        assertEq(bob.balance, delta);
        assertEq(address(seller).balance, price);
        assertEq(seller.payments(), 1);
        assertEq(relic.balanceOf(bob, RELIC), amount);
        assertEq(relic.balanceOf(address(market), RELIC), 0);
        _assertRemoved(id);
        assertEq(market.activeListingCount(), 0);

        vm.deal(carol, price);
        vm.prank(carol);
        vm.expectRevert(RelicMarket.ListingNotActive.selector);
        market.buy{value: price}(id);
        assertEq(carol.balance, price);
        assertEq(relic.balanceOf(carol, RELIC), 0);
        assertEq(seller.payments(), 1);
        assertEq(address(seller).balance, price);
        assertEq(address(market).balance, 0);
        assertEq(bob.balance + address(seller).balance + address(market).balance, totalBefore);
    }

    function testFuzz_cancelledAndNonexistentListingsKeepBuyerFunds(uint256 price, uint256 amount, uint256 missing)
        public
    {
        price = bound(price, 1, type(uint128).max);
        amount = bound(amount, 1, 16);
        uint256 id = _list(alice, amount, price);
        vm.prank(alice);
        market.cancel(id);
        // Includes id zero as well as ids beyond nextListingId.
        if (missing == id) missing = 0;
        vm.deal(bob, price);
        uint256[2] memory ids = [id, missing];
        for (uint256 i; i < ids.length; ++i) {
            vm.prank(bob);
            vm.expectRevert(RelicMarket.ListingNotActive.selector);
            market.buy{value: price}(ids[i]);
            _assertRemoved(ids[i]);
            assertEq(bob.balance, price);
            assertEq(alice.balance, 0);
            assertEq(address(market).balance, 0);
            assertEq(relic.balanceOf(alice, RELIC), amount);
            assertEq(relic.balanceOf(bob, RELIC), 0);
            assertEq(relic.balanceOf(address(market), RELIC), 0);
            assertEq(market.activeListingCount(), 0);
        }
    }

    function testFuzz_revokedApprovalAndEmptySellerBalanceCannotInvalidateEscrow(uint256 price, uint256 amount) public {
        price = bound(price, 1, type(uint128).max);
        amount = bound(amount, 1, 16);
        uint256 id = _list(alice, amount, price);
        _mint(alice, 1);
        vm.startPrank(alice);
        relic.setApprovalForAll(address(market), false);
        relic.safeTransferFrom(alice, carol, RELIC, 1, "");
        vm.stopPrank();
        assertFalse(relic.isApprovedForAll(alice, address(market)));
        assertEq(relic.balanceOf(alice, RELIC), 0);
        assertEq(relic.balanceOf(address(market), RELIC), amount);

        vm.deal(bob, price);
        vm.prank(bob);
        market.buy{value: price}(id);
        assertEq(bob.balance, 0);
        assertEq(alice.balance, price);
        assertEq(address(market).balance, 0);
        assertEq(relic.balanceOf(bob, RELIC), amount);
        assertEq(relic.balanceOf(carol, RELIC), 1);
        assertEq(relic.balanceOf(alice, RELIC), 0);
        assertEq(relic.balanceOf(address(market), RELIC), 0);
        _assertRemoved(id);
        assertEq(market.activeListingCount(), 0);
    }

    function testFuzz_rejectedSellerPaymentRollsBackAndCanRetry(uint256 price, uint256 amount) public {
        price = bound(price, 1, type(uint128).max);
        amount = bound(amount, 1, 16);
        CountingRelicSeller seller = new CountingRelicSeller();
        uint256 id = _list(address(seller), amount, price);
        seller.setRejectPayment(true);
        vm.deal(bob, price);
        vm.prank(bob);
        vm.expectRevert(RelicMarket.PaymentFailed.selector);
        market.buy{value: price}(id);
        _assertActive(id, address(seller), amount, price);
        assertEq(market.activeListingCount(), 1);
        assertEq(bob.balance, price);
        assertEq(address(seller).balance, 0);
        assertEq(address(market).balance, 0);
        assertEq(seller.payments(), 0);
        assertEq(relic.balanceOf(bob, RELIC), 0);
        assertEq(relic.balanceOf(address(market), RELIC), amount);

        seller.setRejectPayment(false);
        vm.prank(bob);
        market.buy{value: price}(id);
        assertEq(bob.balance, 0);
        assertEq(address(seller).balance, price);
        assertEq(address(market).balance, 0);
        assertEq(seller.payments(), 1);
        assertEq(relic.balanceOf(bob, RELIC), amount);
        assertEq(relic.balanceOf(address(market), RELIC), 0);
        _assertRemoved(id);
    }

    function testFuzz_nonReceiverBuyerRollsBack(uint256 price) public {
        price = bound(price, 1, type(uint128).max);
        uint256 id = _list(alice, 1, price);
        // This test contract intentionally has no ERC-1155 receiver hook.
        vm.deal(address(this), price);
        vm.expectRevert(abi.encodeWithSelector(IERC1155Errors.ERC1155InvalidReceiver.selector, address(this)));
        market.buy{value: price}(id);
        _assertActive(id, alice, 1, price);
        assertEq(market.activeListingCount(), 1);
        assertEq(address(this).balance, price);
        assertEq(alice.balance, 0);
        assertEq(address(market).balance, 0);
        assertEq(relic.balanceOf(address(this), RELIC), 0);
        assertEq(relic.balanceOf(address(market), RELIC), 1);
    }

    function test_exactPaymentAtUint256Max() public {
        uint256 price = type(uint256).max;
        uint256 id = _list(alice, 1, price);
        vm.deal(bob, price);
        vm.prank(bob);
        market.buy{value: price}(id);
        assertEq(alice.balance, price);
        assertEq(bob.balance, 0);
        assertEq(address(market).balance, 0);
        assertEq(relic.balanceOf(bob, RELIC), 1);
        _assertRemoved(id);
    }

    // ---------- voucher boundaries ----------

    function testFuzz_replayedVoucherCannotMintAgain(uint256 voucherNonce, uint256 expiry) public {
        expiry = bound(expiry, block.timestamp, type(uint256).max);
        RelicNFT.Voucher memory v = _voucher(voucherNonce, expiry);
        bytes memory sig = _sign(v);
        vm.startPrank(alice);
        relic.mint(v, sig);
        vm.expectRevert(RelicNFT.NonceAlreadyUsed.selector);
        relic.mint(v, sig);
        vm.stopPrank();
        assertEq(relic.balanceOf(alice, RELIC), 1);
        assertTrue(relic.usedNonces(voucherNonce));
        assertEq(relic.rarityOf(RELIC), 3);
    }

    function testFuzz_expiredVoucherDoesNotConsumeNonce(uint256 voucherNonce, uint256 expiry) public {
        expiry = bound(expiry, 0, block.timestamp - 1);
        RelicNFT.Voucher memory v = _voucher(voucherNonce, expiry);
        bytes memory sig = _sign(v);
        vm.prank(alice);
        vm.expectRevert(RelicNFT.VoucherExpired.selector);
        relic.mint(v, sig);
        assertFalse(relic.usedNonces(voucherNonce));
        assertFalse(relic.relicExists(RELIC));
        assertEq(relic.balanceOf(alice, RELIC), 0);
    }

    function testFuzz_voucherValidAtExpiryButNotOneSecondLater(uint256 voucherNonce, uint256 expiry) public {
        expiry = bound(expiry, block.timestamp, type(uint256).max - 1);
        RelicNFT.Voucher memory v = _voucher(voucherNonce, expiry);
        bytes memory sig = _sign(v);
        vm.warp(expiry + 1);
        vm.prank(alice);
        vm.expectRevert(RelicNFT.VoucherExpired.selector);
        relic.mint(v, sig);
        assertFalse(relic.usedNonces(voucherNonce));
        // Rewind to the exact boundary to check the same signed input independently.
        vm.warp(expiry);
        vm.prank(alice);
        relic.mint(v, sig);
        assertTrue(relic.usedNonces(voucherNonce));
        assertEq(relic.balanceOf(alice, RELIC), 1);
    }

    function testFuzz_cancelledNonceCannotMint(uint256 voucherNonce, uint256 expiry) public {
        expiry = bound(expiry, block.timestamp, type(uint256).max);
        RelicNFT.Voucher memory v = _voucher(voucherNonce, expiry);
        bytes memory sig = _sign(v);
        vm.prank(owner);
        relic.cancelNonce(voucherNonce);
        vm.prank(alice);
        vm.expectRevert(RelicNFT.NonceAlreadyUsed.selector);
        relic.mint(v, sig);
        assertTrue(relic.usedNonces(voucherNonce));
        assertFalse(relic.relicExists(RELIC));
        assertEq(relic.balanceOf(alice, RELIC), 0);
    }
}

/// @dev Counts successful payment callbacks and can reject payment to exercise atomic rollback.
contract CountingRelicSeller is ERC1155Holder {
    uint256 public payments;
    bool internal rejectPayment;

    function setRejectPayment(bool reject) external {
        rejectPayment = reject;
    }

    receive() external payable {
        require(!rejectPayment, "seller rejects payment");
        payments++;
    }
}
