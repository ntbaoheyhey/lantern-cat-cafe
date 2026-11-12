// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {YarnToken} from "../src/YarnToken.sol";
import {RelicNFT} from "../src/RelicNFT.sol";
import {RelicMarketV2} from "../src/RelicMarketV2.sol";
import {SeasonRewards} from "../src/SeasonRewards.sol";

contract RejectNative {
    receive() external payable {
        revert("reject");
    }
}

contract ReenterBuyer is ERC1155Holder {
    RelicMarketV2 market;
    bool public blocked;

    constructor(RelicMarketV2 m) {
        market = m;
    }

    function buy(uint256 id) external payable {
        market.buy{value: msg.value}(id);
    }

    function onERC1155Received(address, address, uint256, uint256, bytes memory) public override returns (bytes4) {
        try market.buy(1) {
            blocked = false;
        } catch {
            blocked = true;
        }
        return this.onERC1155Received.selector;
    }
}

contract ChainV2Test is Test {
    YarnToken yarn;
    RelicNFT nft;
    RelicMarketV2 market;
    SeasonRewards rewards;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address treasury = makeAddr("treasury");
    address signer;
    uint256 signerKey;
    uint256 nonce;

    function setUp() public {
        vm.chainId(43113);
        vm.warp(1_800_000_000);
        (signer, signerKey) = makeAddrAndKey("v2 signer");
        yarn = new YarnToken(address(this));
        nft = new RelicNFT(address(this), signer, "test://{id}");
        market = new RelicMarketV2(address(nft), address(yarn), treasury, 500);
        uint256 epoch = block.timestamp - (block.timestamp - 4 days) % 1 weeks;
        rewards = new SeasonRewards(address(yarn), address(this), signer, 32 ether, epoch);
        yarn.transfer(address(rewards), 10000 ether);
        yarn.transfer(bob, 1000 ether);
        vm.deal(bob, 1000 ether);
        vm.prank(bob);
        yarn.approve(address(market), type(uint256).max);
    }

    function mint(address who, uint256 id) internal {
        RelicNFT.Voucher memory v = RelicNFT.Voucher(who, id, 1, ++nonce, block.timestamp + 1 hours);
        (uint8 vv, bytes32 r, bytes32 s) = vm.sign(signerKey, nft.hashVoucher(v));
        vm.prank(who);
        nft.mint(v, abi.encodePacked(r, s, vv));
        vm.prank(who);
        nft.setApprovalForAll(address(market), true);
    }

    function listing(uint256 price, uint8 currency) internal returns (uint256 id) {
        mint(alice, 10001);
        vm.prank(alice);
        return market.list(10001, 1, price, currency);
    }

    function claimData(uint256 amount, uint256 n) internal view returns (SeasonRewards.Claim memory) {
        return SeasonRewards.Claim(alice, amount, rewards.currentSeason(), n, block.timestamp + 1 hours);
    }

    function signature(SeasonRewards.Claim memory c) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, rewards.hashClaim(c));
        return abi.encodePacked(r, s, v);
    }

    function test_genesisBurnAndSeal() public {
        assertEq(yarn.totalSupply(), 1_000_000_000 ether);
        assertEq(yarn.decimals(), 18);
        yarn.transfer(alice, 10 ether);
        vm.prank(alice);
        yarn.seal(keccak256("intent"), 2 ether);
        assertEq(yarn.balanceOf(alice), 8 ether);
        assertEq(yarn.sealPayments(alice, keccak256("intent")), 2 ether);
        vm.prank(alice);
        vm.expectRevert(YarnToken.InvalidSeal.selector);
        yarn.seal(keccak256("intent"), 2 ether);
        assertEq(yarn.totalSupply(), yarn.GENESIS_SUPPLY() - 2 ether);
        vm.expectRevert(YarnToken.InvalidSeal.selector);
        yarn.seal(0, 1);
        vm.expectRevert(YarnToken.InvalidSeal.selector);
        yarn.seal(keccak256("intent"), 0);
        vm.chainId(43114);
        vm.expectRevert(YarnToken.FujiOnly.selector);
        new YarnToken(address(this));
    }

    function test_permitReplayAndDomain() public {
        (address holder, uint256 key) = makeAddrAndKey("permit");
        uint256 expiry = block.timestamp + 1 hours;
        bytes32 hash = keccak256(
            abi.encodePacked(
                "\x19\x01",
                yarn.DOMAIN_SEPARATOR(),
                keccak256(
                    abi.encode(
                        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                        holder,
                        bob,
                        2 ether,
                        0,
                        expiry
                    )
                )
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, hash);
        yarn.permit(holder, bob, 2 ether, expiry, v, r, s);
        assertEq(yarn.allowance(holder, bob), 2 ether);
        vm.expectRevert();
        yarn.permit(holder, bob, 2 ether, expiry, v, r, s);
        vm.chainId(43114);
        vm.expectRevert();
        yarn.permit(holder, bob, 2 ether, expiry, v, r, s);
    }

    function test_yarnFeeWithdrawalAndConservation() public {
        uint256 id = listing(100 ether, 1);
        uint256 beforeSupply = yarn.totalSupply();
        vm.prank(bob);
        market.buy(id);
        assertEq(nft.balanceOf(bob, 10001), 1);
        assertEq(nft.balanceOf(alice, 10001), 0);
        assertEq(market.proceeds(alice, 1), 95 ether);
        assertEq(market.proceeds(treasury, 1), 3 ether);
        assertEq(yarn.totalSupply(), beforeSupply - 2 ether);
        assertEq(market.activeListingCount(), 0);
        vm.prank(alice);
        market.withdraw(1, alice);
        vm.prank(treasury);
        market.withdraw(1, treasury);
        assertEq(yarn.balanceOf(alice), 95 ether);
        assertEq(yarn.balanceOf(treasury), 3 ether);
        assertEq(yarn.balanceOf(address(market)), 0);
        vm.prank(alice);
        vm.expectRevert(RelicMarketV2.InvalidWithdrawal.selector);
        market.withdraw(1, alice);
    }

    function test_nativePullRejectingRecipientAndNoYarnBurn() public {
        uint256 id = listing(1 ether, 0);
        uint256 supply = yarn.totalSupply();
        uint256 sink = address(0).balance;
        vm.prank(bob);
        market.buy{value: 1 ether}(id);
        assertEq(alice.balance, 0);
        assertEq(address(0).balance, sink + 0.02 ether);
        assertEq(yarn.totalSupply(), supply);
        RejectNative reject = new RejectNative();
        vm.prank(alice);
        vm.expectRevert(RelicMarketV2.TransferFailed.selector);
        market.withdraw(0, address(reject));
        assertEq(market.proceeds(alice, 0), 0.95 ether);
        vm.prank(alice);
        market.withdraw(0, bob);
        assertEq(market.proceeds(alice, 0), 0);
        vm.prank(treasury);
        market.withdraw(0, treasury);
        assertEq(treasury.balance, 0.03 ether);
    }

    function test_anyPriceFreeGiftCooldownAndPagination() public {
        uint256 free = listing(0, 1);
        uint256 huge = listing(type(uint256).max, 0);
        (uint256[] memory ids, RelicMarketV2.Listing[] memory ls) = market.getListings(0, 1);
        assertEq(ids.length, 1);
        assertEq(ls[0].price, 0);
        (ids, ls) = market.getListings(2, 10);
        assertEq(ids.length, 0);
        assertEq(ls.length, 0);
        (ids, ls) = market.getListings(0, 10);
        assertEq(ids.length, 2);
        assertEq(ls[1].price, type(uint256).max);
        vm.prank(bob);
        market.buy(free);
        vm.prank(bob);
        nft.setApprovalForAll(address(market), true);
        vm.prank(bob);
        vm.expectRevert(RelicMarketV2.Cooldown.selector);
        market.list(10001, 1, 1, 0);
        vm.warp(block.timestamp + 10 minutes);
        vm.prank(bob);
        market.list(10001, 1, 1, 0);
        vm.prank(alice);
        market.cancel(huge);
        assertEq(nft.balanceOf(alice, 10001), 1);
        assertEq(market.getListing(huge).seller, address(0));
    }

    function test_invalidInputsAndEscrowProtection() public {
        vm.expectRevert(RelicMarketV2.InvalidConfig.selector);
        new RelicMarketV2(address(nft), address(yarn), treasury, 1001);
        vm.expectRevert(RelicMarketV2.InvalidConfig.selector);
        new RelicMarketV2(address(0), address(yarn), treasury, 500);
        vm.expectRevert(RelicMarketV2.InvalidConfig.selector);
        new RelicMarketV2(address(nft), address(yarn), address(0), 500);
        vm.expectRevert(RelicMarketV2.InvalidConfig.selector);
        new RelicMarketV2(address(nft), address(0), treasury, 500);
        vm.chainId(1);
        vm.expectRevert(RelicMarketV2.InvalidConfig.selector);
        new RelicMarketV2(address(nft), address(yarn), treasury, 500);
        vm.chainId(43113);
        vm.expectRevert(RelicMarketV2.InvalidListing.selector);
        market.list(1, 0, 1, 0);
        vm.expectRevert(RelicMarketV2.InvalidListing.selector);
        market.list(1, 1, 1, 2);
        vm.expectRevert(RelicMarketV2.InvalidListing.selector);
        market.buy(100);
        vm.expectRevert(RelicMarketV2.InvalidListing.selector);
        market.cancel(100);
        uint256 id = listing(1 ether, 0);
        vm.prank(bob);
        vm.expectRevert(RelicMarketV2.WrongPayment.selector);
        market.buy(id);
        vm.prank(bob);
        vm.expectRevert(RelicMarketV2.NotSeller.selector);
        market.cancel(id);
        vm.expectRevert(RelicMarketV2.InvalidWithdrawal.selector);
        market.withdraw(2, alice);
        vm.expectRevert(RelicMarketV2.InvalidWithdrawal.selector);
        market.withdraw(0, address(0));
        vm.expectRevert(RelicMarketV2.UnsolicitedTransfer.selector);
        market.onERC1155Received(address(market), alice, 1, 1, "");
        vm.expectRevert(RelicMarketV2.UnsolicitedTransfer.selector);
        market.onERC1155BatchReceived(alice, alice, new uint256[](0), new uint256[](0), "");
        mint(alice, 2);
        vm.prank(alice);
        vm.expectRevert(RelicMarketV2.UnsolicitedTransfer.selector);
        nft.safeTransferFrom(alice, address(market), 2, 1, "");
        id = listing(1 ether, 1);
        vm.prank(bob);
        vm.expectRevert(RelicMarketV2.WrongPayment.selector);
        market.buy{value: 1}(id);
    }

    function test_receiverCannotReenterBuy() public {
        uint256 id = listing(0, 0);
        ReenterBuyer attacker = new ReenterBuyer(market);
        attacker.buy(id);
        assertTrue(attacker.blocked());
        assertEq(nft.balanceOf(address(attacker), 10001), 1);
    }

    function testFuzz_feeMathAndNoFloor(uint256 price, uint16 rawBps) public {
        uint256 bps = bound(rawBps, 0, 1000);
        RelicMarketV2 m = new RelicMarketV2(address(nft), address(yarn), treasury, bps);
        (uint256 fee, uint256 burned, uint256 t, uint256 seller) = m.quote(price);
        assertEq(fee + seller, price);
        assertEq(burned + t, fee);
        assertLe(fee, price / 10);
        assertLe(burned, fee);
    }

    function test_claimCapReplayAndMondayReset() public {
        SeasonRewards.Claim memory c = claimData(32 ether, 100);
        bytes memory sig = signature(c);
        vm.prank(alice);
        rewards.claim(c, sig);
        assertEq(yarn.balanceOf(alice), 32 ether);
        assertEq(rewards.claimedInWeek(alice, rewards.currentWeek()), 32 ether);
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.NonceUsed.selector);
        rewards.claim(c, sig);
        c = claimData(1, 101);
        sig = signature(c);
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.WeeklyCap.selector);
        rewards.claim(c, sig);
        vm.warp((rewards.currentWeek() + 1) * 1 weeks + 4 days);
        c = claimData(32 ether, 102);
        sig = signature(c);
        vm.prank(alice);
        rewards.claim(c, sig);
        assertEq(yarn.balanceOf(alice), 64 ether);
    }

    function test_claimBadSignaturesRecipientExpirySeasonAndRotation() public {
        SeasonRewards.Claim memory c = claimData(2 ether, 100);
        bytes memory sig = signature(c);
        vm.prank(bob);
        vm.expectRevert(SeasonRewards.InvalidClaim.selector);
        rewards.claim(c, sig);
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.InvalidSignature.selector);
        rewards.claim(c, hex"1234");
        c.amount++;
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.InvalidSignature.selector);
        rewards.claim(c, sig);
        c = claimData(0, 100);
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.InvalidClaim.selector);
        rewards.claim(c, sig);
        c = claimData(2 ether, 100);
        c.expiry = block.timestamp - 1;
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.InvalidClaim.selector);
        rewards.claim(c, sig);
        c = claimData(2 ether, 100);
        c.season++;
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.InvalidClaim.selector);
        rewards.claim(c, sig);
        c = claimData(2 ether, 100);
        sig = signature(c);
        rewards.setSigner(bob);
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.InvalidSignature.selector);
        rewards.claim(c, sig);
        vm.prank(bob);
        vm.expectRevert();
        rewards.setSigner(signer);
        rewards.setSigner(signer);
        vm.prank(alice);
        rewards.claim(c, sig);
        vm.expectRevert(SeasonRewards.InvalidConfig.selector);
        rewards.setSigner(address(0));
        vm.expectRevert(SeasonRewards.RenounceDisabled.selector);
        rewards.renounceOwnership();
    }

    function test_claimSeasonTransitionAndDomain() public {
        SeasonRewards.Claim memory c = claimData(2 ether, 100);
        bytes memory sig = signature(c);
        vm.chainId(43114);
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.InvalidSignature.selector);
        rewards.claim(c, sig);
        vm.chainId(43113);
        c.expiry = block.timestamp + 26 weeks;
        sig = signature(c);
        vm.warp(rewards.seasonEpoch() + 13 weeks);
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.InvalidClaim.selector);
        rewards.claim(c, sig);
        c = claimData(2 ether, 101);
        sig = signature(c);
        vm.prank(alice);
        rewards.claim(c, sig);
        assertEq(rewards.currentSeason(), 1);
    }

    function test_rewardConfigurationAndPoolFailureAreAtomic() public {
        uint256 epoch = rewards.seasonEpoch();
        vm.expectRevert(SeasonRewards.InvalidConfig.selector);
        new SeasonRewards(address(0), address(this), signer, 1, epoch);
        vm.expectRevert(SeasonRewards.InvalidConfig.selector);
        new SeasonRewards(address(yarn), address(this), signer, 0, epoch);
        vm.expectRevert(SeasonRewards.InvalidConfig.selector);
        new SeasonRewards(address(yarn), address(this), signer, 1, epoch + 1);
        vm.expectRevert(SeasonRewards.InvalidConfig.selector);
        new SeasonRewards(address(yarn), address(this), signer, 1, 0);
        vm.expectRevert(SeasonRewards.InvalidConfig.selector);
        new SeasonRewards(address(yarn), address(this), signer, 1, epoch + 1 weeks);
        vm.expectRevert(SeasonRewards.InvalidConfig.selector);
        new SeasonRewards(address(yarn), address(this), address(0), 1, epoch);
        vm.chainId(1);
        vm.expectRevert(SeasonRewards.InvalidConfig.selector);
        new SeasonRewards(address(yarn), address(this), signer, 1, epoch);
        vm.chainId(43113);
        rewards = new SeasonRewards(address(yarn), address(this), signer, 32 ether, epoch);
        SeasonRewards.Claim memory c = claimData(2 ether, 100);
        bytes memory sig = signature(c);
        vm.prank(alice);
        vm.expectRevert();
        rewards.claim(c, sig);
        assertFalse(rewards.usedNonces(100));
        assertEq(rewards.claimedInWeek(alice, rewards.currentWeek()), 0);
    }

    function testFuzz_claimCap(uint128 rawAmount) public {
        uint256 amount = bound(rawAmount, 1, 33 ether);
        SeasonRewards.Claim memory c = claimData(amount, 1);
        bytes memory sig = signature(c);
        vm.prank(alice);
        if (amount > 32 ether) vm.expectRevert(SeasonRewards.WeeklyCap.selector);
        rewards.claim(c, sig);
        assertLe(rewards.claimedInWeek(alice, rewards.currentWeek()), 32 ether);
    }
}

/// Stateful burns, transfers, real market purchases and signed claims across weeks.
contract ChainV2Handler is Test, ERC1155Holder {
    YarnToken public yarn;
    RelicNFT nft;
    RelicMarketV2 public market;
    SeasonRewards public rewards;
    uint256 signerKey;
    uint256 n;
    uint256 public burned;
    uint256 public initialSupply;
    address public seller = address(0xBEEF);
    address public treasury = address(0xCAFE);
    uint256[] public weeksTouched;

    constructor() {
        vm.chainId(43113);
        vm.warp(1_800_000_000);
        signerKey = uint256(keccak256("disposable invariant signer"));
        yarn = new YarnToken(address(this));
        nft = new RelicNFT(address(this), vm.addr(signerKey), "");
        market = new RelicMarketV2(address(nft), address(yarn), treasury, 500);
        rewards = new SeasonRewards(
            address(yarn),
            address(this),
            vm.addr(signerKey),
            32 ether,
            block.timestamp - (block.timestamp - 4 days) % 1 weeks
        );
        yarn.transfer(address(rewards), 1_000_000 ether);
        yarn.approve(address(market), type(uint256).max);
        initialSupply = yarn.totalSupply();
    }

    function seal(uint96 amount) external {
        uint256 a = bound(amount, 1, 100 ether);
        if (yarn.balanceOf(address(this)) < a) return;
        yarn.seal(bytes32(++n), a);
        burned += a;
    }

    function trade(uint96 rawPrice) external {
        uint256 price = bound(rawPrice, 0, 100 ether);
        if (yarn.balanceOf(address(this)) < price) return;
        RelicNFT.Voucher memory v = RelicNFT.Voucher(seller, 10001, 1, ++n, block.timestamp + 1 hours);
        (uint8 vv, bytes32 r, bytes32 s) = vm.sign(signerKey, nft.hashVoucher(v));
        vm.startPrank(seller);
        nft.mint(v, abi.encodePacked(r, s, vv));
        nft.setApprovalForAll(address(market), true);
        uint256 id = market.list(10001, 1, price, 1);
        vm.stopPrank();
        market.buy(id);
        (, uint256 b,,) = market.quote(price);
        burned += b;
    }

    function claim(uint96 amount, bool nextWeek) external {
        if (nextWeek) vm.warp(block.timestamp + 1 weeks);
        uint256 week = rewards.currentWeek();
        uint256 cap = rewards.weeklyCap() - rewards.claimedInWeek(address(this), week);
        if (cap == 0) return;
        uint256 a = bound(amount, 1, cap);
        SeasonRewards.Claim memory c =
            SeasonRewards.Claim(address(this), a, rewards.currentSeason(), ++n, block.timestamp + 1 hours);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, rewards.hashClaim(c));
        rewards.claim(c, abi.encodePacked(r, s, v));
        weeksTouched.push(week);
    }

    function capInvariant() external view returns (bool) {
        for (uint256 i; i < weeksTouched.length; i++) {
            if (rewards.claimedInWeek(address(this), weeksTouched[i]) > 32 ether) return false;
        }
        return true;
    }
}

/// forge-config: default.invariant.runs = 64
/// forge-config: default.invariant.depth = 64
contract ChainV2Invariant is StdInvariant, Test {
    ChainV2Handler handler;

    function setUp() public {
        handler = new ChainV2Handler();
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = handler.seal.selector;
        selectors[1] = handler.trade.selector;
        selectors[2] = handler.claim.selector;
        targetSelector(FuzzSelector(address(handler), selectors));
        targetContract(address(handler));
    }

    function invariant_totalSupplyOnlyFallsByBurns() public view {
        assertEq(handler.yarn().totalSupply() + handler.burned(), handler.initialSupply());
    }

    function invariant_marketLiabilitiesFullyFunded() public view {
        RelicMarketV2 m = handler.market();
        assertEq(
            handler.yarn().balanceOf(address(m)), m.proceeds(handler.seller(), 1) + m.proceeds(handler.treasury(), 1)
        );
    }

    function invariant_weeklyCapsHold() public view {
        assertTrue(handler.capInvariant());
    }
}
