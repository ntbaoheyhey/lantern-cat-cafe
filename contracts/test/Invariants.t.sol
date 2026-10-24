// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {RelicNFT} from "../src/RelicNFT.sol";
import {RelicMarket} from "../src/RelicMarket.sol";

/// @dev Small domains deliberately cause nonce reuse, rarity conflicts and overlapping listings.
/// Ghost state is recorded independently of contract getters and checked after every action.
contract RelicInvariantHandler is Test {
    uint256 public constant RELIC_COUNT = 8;
    uint256 public constant NONCE_COUNT = 32;
    RelicNFT internal immutable RELIC;
    RelicMarket internal immutable MARKET;
    uint256 internal immutable SIGNER_KEY;
    address[3] internal actors;
    mapping(uint256 => bool) public spent;
    mapping(uint256 => uint256) public mintCount;
    mapping(uint256 => bool) public exists;
    mapping(uint256 => uint8) public firstRarity;
    mapping(uint256 => uint256) public expectedEscrow;

    constructor(RelicNFT relic, RelicMarket market, uint256 signerKey) {
        RELIC = relic;
        MARKET = market;
        SIGNER_KEY = signerKey;
        actors = [makeAddr("invariant alice"), makeAddr("invariant bob"), makeAddr("invariant carol")];
        for (uint256 i; i < actors.length; ++i) {
            vm.prank(actors[i]);
            relic.setApprovalForAll(address(market), true);
        }
    }

    function _voucher(address player, uint256 id, uint8 rarity, uint256 nonce)
        internal
        pure
        returns (RelicNFT.Voucher memory)
    {
        return RelicNFT.Voucher(player, id, rarity, nonce, type(uint256).max);
    }

    function _sign(RelicNFT.Voucher memory voucher) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SIGNER_KEY, RELIC.hashVoucher(voucher));
        return abi.encodePacked(r, s, v);
    }

    function mint(uint256 actorSeed, uint256 idSeed, uint8 rarity, uint256 nonceSeed) public {
        uint256 id = idSeed % RELIC_COUNT;
        uint256 nonce = nonceSeed % NONCE_COUNT;
        address player = actors[actorSeed % actors.length];
        RelicNFT.Voucher memory voucher = _voucher(player, id, rarity, nonce);
        bytes memory signature = _sign(voucher);
        vm.prank(player);
        if (spent[nonce]) {
            vm.expectRevert(RelicNFT.NonceAlreadyUsed.selector);
            RELIC.mint(voucher, signature);
        } else if (exists[id] && firstRarity[id] != rarity) {
            vm.expectRevert(RelicNFT.RarityMismatch.selector);
            RELIC.mint(voucher, signature);
        } else {
            RELIC.mint(voucher, signature);
            spent[nonce] = true;
            mintCount[nonce]++;
            if (!exists[id]) {
                exists[id] = true;
                firstRarity[id] = rarity;
            }
        }
    }

    function cancelNonce(uint256 nonceSeed) external {
        uint256 nonce = nonceSeed % NONCE_COUNT;
        if (spent[nonce]) vm.expectRevert(RelicNFT.NonceAlreadyUsed.selector);
        RELIC.cancelNonce(nonce); // Handler owns the NFT; cancellation competes with minting.
        spent[nonce] = true;
    }

    function replay(uint256 nonceSeed, uint256 actorSeed, uint256 idSeed) external {
        // Select a spent nonce, then try a fresh signature for another player/relic.
        for (uint256 i; i < NONCE_COUNT; ++i) {
            uint256 nonce = (nonceSeed % NONCE_COUNT + i) % NONCE_COUNT;
            if (!spent[nonce]) continue;
            mint(actorSeed, idSeed, 0, nonce);
            return;
        }
    }

    function mintSameOrDifferentRarity(uint256 idSeed, uint256 actorSeed, uint256 nonceSeed, bool change) external {
        uint256 id = idSeed % RELIC_COUNT;
        if (!exists[id]) return;
        // Find a fresh nonce so a rarity rejection cannot be masked by nonce validation.
        for (uint256 i; i < NONCE_COUNT; ++i) {
            uint256 nonce = (nonceSeed % NONCE_COUNT + i) % NONCE_COUNT;
            if (spent[nonce]) continue;
            mint(actorSeed, id, change ? firstRarity[id] ^ uint8(1) : firstRarity[id], nonce);
            return;
        }
    }

    function list(uint256 actorSeed, uint256 idSeed, uint256 amountSeed, uint256 priceSeed) public {
        address seller = actors[actorSeed % actors.length];
        uint256 id = idSeed % RELIC_COUNT;
        uint256 balance = RELIC.balanceOf(seller, id);
        if (balance == 0) return;
        uint256 amount = bound(amountSeed, 1, balance);
        uint256 price = bound(priceSeed, 1, type(uint128).max);
        vm.prank(seller);
        MARKET.list(id, amount, price);
        expectedEscrow[id] += amount;
    }

    function buy(uint256 listingSeed, uint256 actorSeed) external {
        (uint256[] memory ids,) = MARKET.getListings(0, MARKET.activeListingCount());
        if (ids.length == 0) return;
        uint256 id = ids[listingSeed % ids.length];
        RelicMarket.Listing memory listing = MARKET.getListing(id);
        address buyer = actors[actorSeed % actors.length];
        vm.deal(buyer, listing.price);
        vm.prank(buyer);
        MARKET.buy{value: listing.price}(id);
        expectedEscrow[listing.relicId] -= listing.amount;
    }

    function cancel(uint256 listingSeed) external {
        (uint256[] memory ids,) = MARKET.getListings(0, MARKET.activeListingCount());
        if (ids.length == 0) return;
        uint256 id = ids[listingSeed % ids.length];
        RelicMarket.Listing memory listing = MARKET.getListing(id);
        vm.prank(listing.seller);
        MARKET.cancel(id);
        expectedEscrow[listing.relicId] -= listing.amount;
    }
}

contract RelicInvariantsTest is StdInvariant, Test {
    RelicNFT internal relic;
    RelicMarket internal market;
    RelicInvariantHandler internal handler;

    function setUp() public {
        vm.chainId(43113);
        vm.warp(1_700_000_000);
        (address signer, uint256 signerKey) = makeAddrAndKey("invariant signer");
        relic = new RelicNFT(address(this), signer, "https://relics.example/{id}.json");
        market = new RelicMarket(address(relic));
        handler = new RelicInvariantHandler(relic, market, signerKey);
        relic.transferOwnership(address(handler));
        // Start with multiple copies and overlapping listings, so every campaign has escrow.
        handler.mint(0, 0, 0, 0);
        handler.mint(0, 0, 0, 1);
        handler.mint(1, 1, 255, 2);
        handler.list(0, 0, 1, 1);
        handler.list(0, 0, 1, type(uint128).max);
        handler.list(1, 1, 1, 1 ether);
        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = handler.mint.selector;
        selectors[1] = handler.cancelNonce.selector;
        selectors[2] = handler.replay.selector;
        selectors[3] = handler.mintSameOrDifferentRarity.selector;
        selectors[4] = handler.list.selector;
        selectors[5] = handler.buy.selector;
        selectors[6] = handler.cancel.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
        targetContract(address(handler));
    }

    /// forge-config: default.invariant.runs = 32
    /// forge-config: default.invariant.depth = 48
    /// forge-config: default.invariant.fail-on-revert = true
    function invariant_escrowEqualsActiveListings() public view {
        uint256[8] memory totals;
        uint256 count;
        // Scan the entire listing history independently of the active-set enumeration.
        for (uint256 id = 1; id < market.nextListingId(); ++id) {
            RelicMarket.Listing memory listing = market.getListing(id);
            bool active = listing.seller != address(0);
            assertEq(market.isActive(id), active);
            if (active) {
                totals[listing.relicId] += listing.amount;
                count++;
            }
        }
        assertEq(market.activeListingCount(), count);
        (uint256[] memory ids, RelicMarket.Listing[] memory listings) = market.getListings(0, count);
        assertEq(ids.length, count);
        assertEq(listings.length, count);
        for (uint256 i; i < ids.length; ++i) {
            assertTrue(market.isActive(ids[i]));
            assertEq(keccak256(abi.encode(listings[i])), keccak256(abi.encode(market.getListing(ids[i]))));
            for (uint256 j; j < i; ++j) {
                assertTrue(ids[i] != ids[j]);
            }
        }
        for (uint256 id; id < 8; ++id) {
            assertEq(relic.balanceOf(address(market), id), totals[id]);
            assertEq(totals[id], handler.expectedEscrow(id));
        }
    }

    /// forge-config: default.invariant.runs = 32
    /// forge-config: default.invariant.depth = 48
    /// forge-config: default.invariant.fail-on-revert = true
    function invariant_nonceNeverUsedTwice() public view {
        for (uint256 nonce; nonce < 32; ++nonce) {
            assertEq(relic.usedNonces(nonce), handler.spent(nonce));
            assertLe(handler.mintCount(nonce), 1);
        }
    }

    /// forge-config: default.invariant.runs = 32
    /// forge-config: default.invariant.depth = 48
    /// forge-config: default.invariant.fail-on-revert = true
    function invariant_rarityNeverChanges() public view {
        for (uint256 id; id < 8; ++id) {
            assertEq(relic.relicExists(id), handler.exists(id));
            assertEq(relic.rarityOf(id), handler.firstRarity(id));
        }
    }
}
