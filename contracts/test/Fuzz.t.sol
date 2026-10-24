// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {RelicNFT} from "../src/RelicNFT.sol";
import {RelicMarket} from "../src/RelicMarket.sol";

contract RelicFuzzTest is Test {
    RelicNFT internal relic;
    RelicMarket internal market;
    uint256 internal signerKey;
    address internal seller = makeAddr("fuzz seller");
    address internal buyer = makeAddr("fuzz buyer");

    function setUp() public {
        vm.chainId(43113);
        vm.warp(1_700_000_000);
        address signer;
        (signer, signerKey) = makeAddrAndKey("fuzz signer");
        relic = new RelicNFT(address(this), signer, "https://relics.example/{id}.json");
        market = new RelicMarket(address(relic));
    }

    function _sign(RelicNFT.Voucher memory voucher, uint256 key) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, relic.hashVoucher(voucher));
        return abi.encodePacked(r, s, v);
    }

    function _player(address seed) internal view returns (address player) {
        player = address(uint160(bound(uint256(uint160(seed)), 0x10000, type(uint160).max)));
        vm.assume(player.code.length == 0);
    }

    function testFuzz_voucherValidation(address player, uint256 relicId, uint8 rarity, uint256 nonce, uint256 expiry)
        public
    {
        player = _player(player);
        RelicNFT.Voucher memory voucher = RelicNFT.Voucher(player, relicId, rarity, nonce, expiry);
        bytes memory signature = _sign(voucher, signerKey);
        vm.prank(player);
        if (expiry < block.timestamp) {
            vm.expectRevert(RelicNFT.VoucherExpired.selector);
            relic.mint(voucher, signature);
            assertFalse(relic.usedNonces(nonce));
            assertFalse(relic.relicExists(relicId));
            assertEq(relic.balanceOf(player, relicId), 0);
        } else {
            relic.mint(voucher, signature);
            assertTrue(relic.usedNonces(nonce));
            assertTrue(relic.relicExists(relicId));
            assertEq(relic.rarityOf(relicId), rarity);
            assertEq(relic.balanceOf(player, relicId), 1);
            vm.prank(player);
            vm.expectRevert(RelicNFT.NonceAlreadyUsed.selector);
            relic.mint(voucher, signature);
            assertEq(relic.balanceOf(player, relicId), 1);
        }
    }

    function testFuzz_wrongPlayerAndSigner(
        address player,
        uint256 relicId,
        uint8 rarity,
        uint256 nonce,
        uint256 expiry,
        uint256 wrongKey
    ) public {
        player = _player(player);
        expiry = bound(expiry, block.timestamp, type(uint256).max);
        // secp256k1 private key range; these are local test keys only.
        wrongKey = bound(wrongKey, 1, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140);
        vm.assume(wrongKey != signerKey);
        RelicNFT.Voucher memory voucher = RelicNFT.Voucher(player, relicId, rarity, nonce, expiry);
        bytes memory signature = _sign(voucher, wrongKey);
        vm.prank(player);
        vm.expectRevert(RelicNFT.InvalidSignature.selector);
        relic.mint(voucher, signature);

        signature = _sign(voucher, signerKey);
        address stranger = player == seller ? buyer : seller;
        vm.prank(stranger);
        vm.expectRevert(RelicNFT.NotVoucherPlayer.selector);
        relic.mint(voucher, signature);
        assertFalse(relic.usedNonces(nonce));
        assertFalse(relic.relicExists(relicId));
        assertEq(relic.balanceOf(player, relicId), 0);

        vm.prank(player);
        relic.mint(voucher, signature);
        assertEq(relic.balanceOf(player, relicId), 1);
    }

    function testFuzz_eachVoucherFieldIsSigned(
        address player,
        uint256 relicId,
        uint8 rarity,
        uint256 nonce,
        uint256 expiry,
        uint8 field
    ) public {
        player = _player(player);
        // Keep both the original and altered expiry valid, isolating signature validation.
        expiry = bound(expiry, block.timestamp + 1, type(uint256).max);
        RelicNFT.Voucher memory voucher = RelicNFT.Voucher(player, relicId, rarity, nonce, expiry);
        bytes memory signature = _sign(voucher, signerKey);
        field = uint8(bound(field, 0, 4));
        if (field == 0) voucher.player = player == seller ? buyer : seller;
        else if (field == 1) voucher.relicId ^= 1;
        else if (field == 2) voucher.rarity ^= 1;
        else if (field == 3) voucher.nonce ^= 1;
        else voucher.expiry -= 1;
        vm.prank(voucher.player);
        vm.expectRevert(RelicNFT.InvalidSignature.selector);
        relic.mint(voucher, signature);
        assertFalse(relic.usedNonces(voucher.nonce));
        assertFalse(relic.relicExists(voucher.relicId));
    }

    function testFuzz_listBuyCancel(uint256 relicId, uint8 rarity, uint256 quantity, uint256 price, bool cancel)
        public
    {
        quantity = bound(quantity, 1, 8); // Each copy requires a real signed voucher.
        price = bound(price, 1, type(uint128).max);
        for (uint256 i; i < quantity; ++i) {
            RelicNFT.Voucher memory voucher = RelicNFT.Voucher(seller, relicId, rarity, i, block.timestamp);
            bytes memory signature = _sign(voucher, signerKey);
            vm.prank(seller);
            relic.mint(voucher, signature);
        }
        vm.startPrank(seller);
        relic.setApprovalForAll(address(market), true);
        uint256 id = market.list(relicId, quantity, price);
        vm.stopPrank();
        RelicMarket.Listing memory listing = market.getListing(id);
        assertEq(listing.seller, seller);
        assertEq(listing.relicId, relicId);
        assertEq(listing.amount, quantity);
        assertEq(listing.price, price);
        assertEq(relic.balanceOf(address(market), relicId), quantity);
        assertEq(relic.balanceOf(seller, relicId), 0);
        assertTrue(market.isActive(id));
        assertEq(market.activeListingCount(), 1);

        vm.prank(buyer);
        vm.expectRevert(RelicMarket.NotSeller.selector);
        market.cancel(id);
        vm.deal(buyer, price);
        vm.prank(buyer);
        vm.expectRevert(RelicMarket.WrongPayment.selector);
        market.buy{value: price - 1}(id);
        assertEq(relic.balanceOf(address(market), relicId), quantity);
        assertTrue(market.isActive(id));
        if (cancel) {
            vm.prank(seller);
            market.cancel(id);
        } else {
            vm.prank(buyer);
            market.buy{value: price}(id);
        }
        assertEq(relic.balanceOf(cancel ? seller : buyer, relicId), quantity);
        assertEq(relic.balanceOf(address(market), relicId), 0);
        assertEq(seller.balance, cancel ? 0 : price);
        assertEq(buyer.balance, cancel ? price : 0);
        assertEq(address(market).balance, 0);
        assertFalse(market.isActive(id));
        assertEq(market.getListing(id).seller, address(0));
        assertEq(market.activeListingCount(), 0);
        vm.prank(seller);
        vm.expectRevert(RelicMarket.ListingNotActive.selector);
        market.cancel(id);
        vm.prank(buyer);
        vm.expectRevert(RelicMarket.ListingNotActive.selector);
        market.buy(id);
    }

    function testFuzz_zeroListingInputs(uint256 price, uint256 quantity) public {
        vm.expectRevert(RelicMarket.ZeroAmount.selector);
        market.list(0, 0, price);
        quantity = bound(quantity, 1, type(uint256).max);
        vm.expectRevert(RelicMarket.ZeroPrice.selector);
        market.list(0, quantity, 0);
        assertEq(market.nextListingId(), 1);
        assertEq(market.activeListingCount(), 0);
    }
}
