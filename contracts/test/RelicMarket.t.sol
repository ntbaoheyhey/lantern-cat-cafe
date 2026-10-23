// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC1155Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {RelicNFT} from "../src/RelicNFT.sol";
import {RelicMarket} from "../src/RelicMarket.sol";

contract RelicMarketTest is Test {
    event Listed(
        uint256 indexed listingId, address indexed seller, uint256 indexed relicId, uint256 amount, uint256 price
    );
    event Bought(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 relicId,
        uint256 amount,
        uint256 price
    );
    event Cancelled(uint256 indexed listingId, address indexed seller);

    uint256 internal constant RELIC = 7;
    uint8 internal constant RARITY = 3;

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
        vm.deal(bob, 1_000 ether);
        vm.deal(carol, 1_000 ether);
    }

    // ---------- helpers ----------

    /// @dev Signs a real server voucher for `player`; the caller redeems it from `player`.
    function _voucher(address player, uint256 relicId) internal returns (RelicNFT.Voucher memory v, bytes memory sig) {
        v = RelicNFT.Voucher({
            player: player, relicId: relicId, rarity: RARITY, nonce: ++nonce, expiry: block.timestamp + 1 hours
        });
        (uint8 sv, bytes32 r, bytes32 s) = vm.sign(signerKey, relic.hashVoucher(v));
        sig = abi.encodePacked(r, s, sv);
    }

    /// @dev Mints `count` copies of `relicId` to an EOA through real vouchers.
    function _mint(address player, uint256 relicId, uint256 count) internal {
        for (uint256 i; i < count; ++i) {
            (RelicNFT.Voucher memory v, bytes memory sig) = _voucher(player, relicId);
            vm.prank(player);
            relic.mint(v, sig);
        }
    }

    function _approve(address who) internal {
        vm.prank(who);
        relic.setApprovalForAll(address(market), true);
    }

    function _list(address seller, uint256 relicId, uint256 amount, uint256 price) internal returns (uint256 id) {
        _mint(seller, relicId, amount);
        _approve(seller);
        vm.prank(seller);
        id = market.list(relicId, amount, price);
    }

    // ---------- constructor ----------

    function test_constructorRejectsZeroAddress() public {
        vm.expectRevert(RelicMarket.ZeroAddress.selector);
        new RelicMarket(address(0));
    }

    // ---------- list ----------

    function test_listMovesRelicIntoMarket() public {
        _mint(alice, RELIC, 3);
        _approve(alice);

        vm.expectEmit(address(market));
        emit Listed(1, alice, RELIC, 2, 1 ether);
        vm.prank(alice);
        uint256 id = market.list(RELIC, 2, 1 ether);

        assertEq(id, 1);
        assertEq(market.nextListingId(), 2);
        assertEq(relic.balanceOf(alice, RELIC), 1);
        assertEq(relic.balanceOf(address(market), RELIC), 2);
        assertTrue(market.isActive(id));
        RelicMarket.Listing memory l = market.getListing(id);
        assertEq(l.seller, alice);
        assertEq(l.relicId, RELIC);
        assertEq(l.amount, 2);
        assertEq(l.price, 1 ether);
    }

    function test_listingIdsIncrement() public {
        uint256 a = _list(alice, RELIC, 1, 1 ether);
        uint256 b = _list(alice, RELIC, 1, 1 ether);
        uint256 c = _list(bob, 8, 1, 1 ether);
        assertEq(a, 1);
        assertEq(b, 2);
        assertEq(c, 3);
    }

    function test_listWithoutApprovalReverts() public {
        _mint(alice, RELIC, 1);
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(IERC1155Errors.ERC1155MissingApprovalForAll.selector, address(market), alice)
        );
        market.list(RELIC, 1, 1 ether);
    }

    function test_listZeroPriceReverts() public {
        _mint(alice, RELIC, 1);
        _approve(alice);
        vm.prank(alice);
        vm.expectRevert(RelicMarket.ZeroPrice.selector);
        market.list(RELIC, 1, 0);
    }

    function test_listZeroAmountReverts() public {
        _mint(alice, RELIC, 1);
        _approve(alice);
        vm.prank(alice);
        vm.expectRevert(RelicMarket.ZeroAmount.selector);
        market.list(RELIC, 0, 1 ether);
    }

    function test_listMoreThanOwnedReverts() public {
        _mint(alice, RELIC, 1);
        _approve(alice);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IERC1155Errors.ERC1155InsufficientBalance.selector, alice, 1, 2, RELIC));
        market.list(RELIC, 2, 1 ether);
    }

    // ---------- buy ----------

    function test_buyPaysSellerExactlyAndMovesRelic() public {
        uint256 id = _list(alice, RELIC, 2, 1.5 ether);
        uint256 bobBefore = bob.balance;

        vm.expectEmit(address(market));
        emit Bought(id, bob, alice, RELIC, 2, 1.5 ether);
        vm.prank(bob);
        market.buy{value: 1.5 ether}(id);

        assertEq(alice.balance, 1.5 ether);
        assertEq(bob.balance, bobBefore - 1.5 ether);
        assertEq(address(market).balance, 0);
        assertEq(relic.balanceOf(bob, RELIC), 2);
        assertEq(relic.balanceOf(address(market), RELIC), 0);
        assertFalse(market.isActive(id));
        assertEq(market.getListing(id).seller, address(0));
        assertEq(market.activeListingCount(), 0);
    }

    function test_buyUnderpayReverts() public {
        uint256 id = _list(alice, RELIC, 1, 1 ether);
        vm.prank(bob);
        vm.expectRevert(RelicMarket.WrongPayment.selector);
        market.buy{value: 1 ether - 1}(id);
    }

    function test_buyOverpayReverts() public {
        uint256 id = _list(alice, RELIC, 1, 1 ether);
        vm.prank(bob);
        vm.expectRevert(RelicMarket.WrongPayment.selector);
        market.buy{value: 1 ether + 1}(id);
    }

    function test_buyNonexistentListingReverts() public {
        vm.prank(bob);
        vm.expectRevert(RelicMarket.ListingNotActive.selector);
        market.buy{value: 1 ether}(42);
    }

    function test_buyAlreadyBoughtReverts() public {
        uint256 id = _list(alice, RELIC, 1, 1 ether);
        vm.prank(bob);
        market.buy{value: 1 ether}(id);

        vm.prank(carol);
        vm.expectRevert(RelicMarket.ListingNotActive.selector);
        market.buy{value: 1 ether}(id);
    }

    function test_buyCancelledReverts() public {
        uint256 id = _list(alice, RELIC, 1, 1 ether);
        vm.prank(alice);
        market.cancel(id);

        vm.prank(bob);
        vm.expectRevert(RelicMarket.ListingNotActive.selector);
        market.buy{value: 1 ether}(id);
    }

    // ---------- cancel ----------

    function test_cancelReturnsRelicToSeller() public {
        uint256 id = _list(alice, RELIC, 2, 1 ether);

        vm.expectEmit(address(market));
        emit Cancelled(id, alice);
        vm.prank(alice);
        market.cancel(id);

        assertEq(relic.balanceOf(alice, RELIC), 2);
        assertEq(relic.balanceOf(address(market), RELIC), 0);
        assertFalse(market.isActive(id));
        assertEq(market.activeListingCount(), 0);
    }

    function test_onlySellerCanCancel() public {
        uint256 id = _list(alice, RELIC, 1, 1 ether);
        vm.prank(bob);
        vm.expectRevert(RelicMarket.NotSeller.selector);
        market.cancel(id);

        // Deployer has no special powers either.
        vm.expectRevert(RelicMarket.NotSeller.selector);
        market.cancel(id);

        assertTrue(market.isActive(id));
        assertEq(relic.balanceOf(address(market), RELIC), 1);
    }

    function test_cancelTwiceReverts() public {
        uint256 id = _list(alice, RELIC, 1, 1 ether);
        vm.startPrank(alice);
        market.cancel(id);
        vm.expectRevert(RelicMarket.ListingNotActive.selector);
        market.cancel(id);
        vm.stopPrank();
    }

    function test_cancelAfterBuyReverts() public {
        uint256 id = _list(alice, RELIC, 1, 1 ether);
        vm.prank(bob);
        market.buy{value: 1 ether}(id);
        vm.prank(alice);
        vm.expectRevert(RelicMarket.ListingNotActive.selector);
        market.cancel(id);
    }

    // ---------- unsolicited transfers ----------

    function test_directTransferToMarketReverts() public {
        _mint(alice, RELIC, 1);
        vm.prank(alice);
        vm.expectRevert(RelicMarket.UnsolicitedTransfer.selector);
        relic.safeTransferFrom(alice, address(market), RELIC, 1, "");
        assertEq(relic.balanceOf(alice, RELIC), 1);
    }

    function test_directBatchTransferToMarketReverts() public {
        _mint(alice, RELIC, 1);
        uint256[] memory ids = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        ids[0] = RELIC;
        amounts[0] = 1;
        vm.prank(alice);
        vm.expectRevert(RelicMarket.UnsolicitedTransfer.selector);
        relic.safeBatchTransferFrom(alice, address(market), ids, amounts, "");
    }

    function test_transferFromOtherErc1155Reverts() public {
        RelicNFT other = new RelicNFT(owner, signer, "");
        RelicNFT.Voucher memory v = RelicNFT.Voucher({
            player: alice, relicId: RELIC, rarity: RARITY, nonce: 1, expiry: block.timestamp + 1 hours
        });
        (uint8 sv, bytes32 r, bytes32 s) = vm.sign(signerKey, other.hashVoucher(v));
        vm.startPrank(alice);
        other.mint(v, abi.encodePacked(r, s, sv));
        vm.expectRevert(RelicMarket.UnsolicitedTransfer.selector);
        other.safeTransferFrom(alice, address(market), RELIC, 1, "");
        vm.stopPrank();
    }

    function test_marketRejectsPlainAvax() public {
        vm.prank(bob);
        (bool ok,) = address(market).call{value: 1 ether}("");
        assertFalse(ok);
    }

    // ---------- reentrancy ----------

    /// Malicious seller whose receive() re-enters buy() on another listing (and swallows the failure):
    /// the nested call hits the guard, the outer sale settles exactly once.
    function test_maliciousSellerReentryIsBlocked() public {
        MaliciousSeller evil = new MaliciousSeller(relic, market, false);
        (RelicNFT.Voucher memory v, bytes memory sig) = _voucher(address(evil), RELIC);
        evil.mintAndList(v, sig, 1 ether);
        uint256 evilListing = 1;
        uint256 other = _list(alice, 8, 1, 1 ether);
        evil.setTarget(other);

        vm.prank(bob);
        market.buy{value: 1 ether}(evilListing);

        assertTrue(evil.reentryAttempted());
        assertEq(evil.reentryError(), ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        assertEq(address(evil).balance, 1 ether);
        assertEq(relic.balanceOf(bob, RELIC), 1);
        assertEq(relic.balanceOf(address(evil), 8), 0);
        assertTrue(market.isActive(other));
        assertEq(alice.balance, 0);
        assertEq(address(market).balance, 0);
    }

    /// Same seller, but the failed re-entry bubbles up: payment fails, the whole buy reverts and
    /// nothing changes (buyer keeps the AVAX, listing stays active).
    function test_maliciousSellerBubblingReentryRevertsWholeBuy() public {
        MaliciousSeller evil = new MaliciousSeller(relic, market, true);
        (RelicNFT.Voucher memory v, bytes memory sig) = _voucher(address(evil), RELIC);
        evil.mintAndList(v, sig, 1 ether);
        evil.setTarget(_list(alice, 8, 1, 1 ether));
        uint256 bobBefore = bob.balance;

        vm.prank(bob);
        vm.expectRevert(RelicMarket.PaymentFailed.selector);
        market.buy{value: 1 ether}(1);

        assertEq(bob.balance, bobBefore);
        assertTrue(market.isActive(1));
        assertEq(relic.balanceOf(address(market), RELIC), 1);
        assertEq(relic.balanceOf(bob, RELIC), 0);
    }

    /// Malicious buyer whose onERC1155Received re-enters buy() (same listing and another one).
    function test_maliciousBuyerReentryIsBlocked() public {
        uint256 first = _list(alice, RELIC, 1, 1 ether);
        uint256 second = _list(carol, 8, 1, 1 ether);
        MaliciousBuyer evil = new MaliciousBuyer(relic, market);
        vm.deal(address(evil), 3 ether);

        evil.attack(first, second, 1 ether);

        assertEq(evil.attempts(), 2);
        assertEq(evil.failures(), 2);
        assertEq(relic.balanceOf(address(evil), RELIC), 1);
        assertEq(relic.balanceOf(address(evil), 8), 0);
        assertEq(address(evil).balance, 2 ether);
        assertEq(alice.balance, 1 ether);
        assertTrue(market.isActive(second));
        assertEq(address(market).balance, 0);
    }

    function test_sellerThatRejectsAvaxCannotBeBought() public {
        RejectingSeller rs = new RejectingSeller(relic, market);
        (RelicNFT.Voucher memory v, bytes memory sig) = _voucher(address(rs), RELIC);
        rs.mintAndList(v, sig, 1 ether);

        vm.prank(bob);
        vm.expectRevert(RelicMarket.PaymentFailed.selector);
        market.buy{value: 1 ether}(1);

        // The seller can still recover its Relic.
        rs.cancel(1);
        assertEq(relic.balanceOf(address(rs), RELIC), 1);
    }

    // ---------- getListings ----------

    function test_getListingsPaging() public {
        for (uint256 i; i < 5; ++i) {
            _list(alice, 100 + i, 1, (i + 1) * 1 ether);
        }
        assertEq(market.activeListingCount(), 5);

        (uint256[] memory ids, RelicMarket.Listing[] memory items) = market.getListings(0, 2);
        assertEq(ids.length, 2);
        assertEq(ids[0], 1);
        assertEq(ids[1], 2);
        assertEq(items[1].relicId, 101);
        assertEq(items[1].price, 2 ether);

        (ids, items) = market.getListings(2, 2);
        assertEq(ids.length, 2);
        assertEq(ids[0], 3);
        assertEq(ids[1], 4);

        (ids, items) = market.getListings(4, 2);
        assertEq(ids.length, 1);
        assertEq(ids[0], 5);
        assertEq(items[0].seller, alice);

        (ids, items) = market.getListings(5, 2);
        assertEq(ids.length, 0);
        (ids, items) = market.getListings(99, 2);
        assertEq(ids.length, 0);
        (ids, items) = market.getListings(0, 0);
        assertEq(ids.length, 0);

        // Remove two; the remaining page holds exactly the three still-active listings.
        vm.prank(alice);
        market.cancel(2);
        vm.prank(bob);
        market.buy{value: 4 ether}(4);
        assertEq(market.activeListingCount(), 3);

        (ids, items) = market.getListings(0, 10);
        assertEq(ids.length, 3);
        bool[6] memory seen;
        for (uint256 i; i < ids.length; ++i) {
            assertTrue(ids[i] == 1 || ids[i] == 3 || ids[i] == 5);
            assertFalse(seen[ids[i]]);
            seen[ids[i]] = true;
            assertEq(items[i].relicId, 99 + ids[i]);
            assertEq(items[i].seller, alice);
        }
    }

    // ---------- fuzz ----------

    function testFuzz_priceExactPaymentOnly(uint256 price, uint8 amount) public {
        price = bound(price, 1, 1e30);
        amount = uint8(bound(amount, 1, 5));
        uint256 id = _list(alice, RELIC, amount, price);
        vm.deal(bob, price + 1);

        vm.startPrank(bob);
        vm.expectRevert(RelicMarket.WrongPayment.selector);
        market.buy{value: price - 1}(id);
        vm.expectRevert(RelicMarket.WrongPayment.selector);
        market.buy{value: price + 1}(id);

        market.buy{value: price}(id);
        vm.stopPrank();

        assertEq(alice.balance, price);
        assertEq(bob.balance, 1);
        assertEq(relic.balanceOf(bob, RELIC), amount);
        assertEq(address(market).balance, 0);
    }
}

/// @dev Seller contract whose receive() re-enters market.buy on another listing.
contract MaliciousSeller is ERC1155Holder {
    RelicNFT internal relic;
    RelicMarket internal market;
    bool internal bubble;
    uint256 internal target;
    bool public reentryAttempted;
    bytes4 public reentryError;

    constructor(RelicNFT r, RelicMarket m, bool bubble_) {
        relic = r;
        market = m;
        bubble = bubble_;
    }

    function mintAndList(RelicNFT.Voucher calldata v, bytes calldata sig, uint256 price) external {
        relic.mint(v, sig);
        relic.setApprovalForAll(address(market), true);
        market.list(v.relicId, 1, price);
    }

    function setTarget(uint256 id) external {
        target = id;
    }

    receive() external payable {
        reentryAttempted = true;
        if (bubble) {
            market.buy{value: msg.value}(target);
        } else {
            try market.buy{value: msg.value}(target) {}
            catch (bytes memory reason) {
                // forge-lint: disable-next-line(unsafe-typecast)
                reentryError = bytes4(reason); // first 4 bytes = custom error selector
            }
        }
    }
}

/// @dev Buyer contract whose onERC1155Received re-enters market.buy.
contract MaliciousBuyer is ERC1155Holder {
    RelicNFT internal relic;
    RelicMarket internal market;
    uint256 internal first;
    uint256 internal second;
    uint256 internal price;
    bool internal armed;
    uint256 public attempts;
    uint256 public failures;

    constructor(RelicNFT r, RelicMarket m) {
        relic = r;
        market = m;
    }

    function attack(uint256 first_, uint256 second_, uint256 price_) external {
        first = first_;
        second = second_;
        price = price_;
        armed = true;
        market.buy{value: price_}(first_);
    }

    function onERC1155Received(address, address, uint256, uint256, bytes memory) public override returns (bytes4) {
        if (armed && msg.sender == address(relic)) {
            armed = false;
            uint256[2] memory targets = [first, second];
            for (uint256 i; i < 2; ++i) {
                attempts++;
                try market.buy{value: price}(targets[i]) {}
                catch {
                    failures++;
                }
            }
        }
        return this.onERC1155Received.selector;
    }

    receive() external payable {}
}

/// @dev Seller contract that cannot receive AVAX.
contract RejectingSeller is ERC1155Holder {
    RelicNFT internal relic;
    RelicMarket internal market;

    constructor(RelicNFT r, RelicMarket m) {
        relic = r;
        market = m;
    }

    function mintAndList(RelicNFT.Voucher calldata v, bytes calldata sig, uint256 price) external {
        relic.mint(v, sig);
        relic.setApprovalForAll(address(market), true);
        market.list(v.relicId, 1, price);
    }

    function cancel(uint256 id) external {
        market.cancel(id);
    }
}
