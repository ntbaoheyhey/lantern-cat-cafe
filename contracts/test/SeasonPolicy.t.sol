// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {YarnToken} from "../src/YarnToken.sol";
import {SeasonRewards} from "../src/SeasonRewards.sol";

contract SeasonPolicyTest is Test {
    YarnToken yarn;
    SeasonRewards rewards;
    uint256 signerKey;
    uint256 epoch;
    uint256 nonce;
    address alice = makeAddr("policy alice");
    address bob = makeAddr("policy bob");

    function setUp() public {
        vm.chainId(43113);
        vm.warp(1_800_000_000);
        epoch = block.timestamp - (block.timestamp - 4 days) % 1 weeks;
        signerKey = uint256(keccak256("disposable policy test signer"));
        yarn = new YarnToken(address(this));
        rewards = new SeasonRewards(address(yarn), address(this), vm.addr(signerKey), 32 ether, epoch);
        yarn.transfer(address(rewards), 10000 ether);
    }

    function voucher(address player, uint256 amount) internal returns (SeasonRewards.Claim memory) {
        return SeasonRewards.Claim(player, amount, rewards.currentSeason(), ++nonce, block.timestamp + 1 hours);
    }

    function sign(SeasonRewards.Claim memory c, bool tester) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, tester ? rewards.hashTesterClaim(c) : rewards.hashClaim(c));
        return abi.encodePacked(r, s, v);
    }

    function take(address player, uint256 amount, bool tester) internal {
        SeasonRewards.Claim memory c = voucher(player, amount);
        bytes memory signature = sign(c, tester);
        vm.prank(player);
        if (tester) rewards.claimTester(c, signature);
        else rewards.claim(c, signature);
    }

    function test_burnHistoryIncludesSealBurnFromAndDirectBurnButNotTransfers() public {
        uint256 week = rewards.currentWeek();
        yarn.transfer(alice, 10 ether);
        assertEq(yarn.burnedInWeek(week), 0);
        vm.startPrank(alice);
        yarn.seal(keccak256("policy material"), 2 ether);
        yarn.burn(1 ether);
        yarn.approve(bob, 3 ether);
        vm.stopPrank();
        vm.prank(bob);
        yarn.burnFrom(alice, 3 ether);
        yarn.burn(0);
        assertEq(yarn.burnedInWeek(week), 6 ether);
        assertEq(rewards.burnedInSeason(0), 6 ether);
        vm.warp((week + 1) * 1 weeks + 4 days);
        yarn.burn(4 ether);
        assertEq(yarn.burnedInWeek(week), 6 ether);
        assertEq(yarn.burnedInWeek(week + 1), 4 ether);
        assertEq(rewards.burnedInSeason(0), 10 ether);
    }

    function test_testerAndRoutineHaveSeparateSignaturesLifetimeAndWeeklyLimits() public {
        SeasonRewards.Claim memory c = voucher(alice, 20 ether);
        bytes memory testerSig = sign(c, true);
        bytes memory routineSig = sign(c, false);
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.InvalidSignature.selector);
        rewards.claim(c, testerSig);
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.InvalidSignature.selector);
        rewards.claimTester(c, routineSig);
        vm.prank(alice);
        rewards.claimTester(c, testerSig);
        assertTrue(rewards.testerClaimed(alice));
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.NonceUsed.selector);
        rewards.claimTester(c, testerSig);
        take(alice, 12 ether, false);
        assertEq(yarn.balanceOf(alice), 32 ether);
        assertEq(rewards.claimedInWeek(alice, rewards.currentWeek()), 32 ether);
        assertEq(rewards.routineClaimedInWeek(alice, rewards.currentWeek()), 12 ether);
        assertEq(rewards.emittedInSeason(0), 32 ether);
        c = voucher(alice, 20 ether);
        testerSig = sign(c, true);
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.InvalidClaim.selector);
        rewards.claimTester(c, testerSig);
        c = voucher(bob, 19 ether);
        testerSig = sign(c, true);
        vm.prank(bob);
        vm.expectRevert(SeasonRewards.InvalidClaim.selector);
        rewards.claimTester(c, testerSig);
        assertFalse(rewards.usedNonces(c.nonce));
    }

    function test_zeroDemandStopsRoutineRewardsAutomaticallyButNotNewTesterGrant() public {
        take(alice, 12 ether, false);
        vm.warp(epoch + 13 weeks);
        assertEq(rewards.currentRoutineBudget(), 0);
        SeasonRewards.Claim memory c = voucher(alice, 1);
        bytes memory signature = sign(c, false);
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.WeeklyCap.selector);
        rewards.claim(c, signature);
        assertFalse(rewards.usedNonces(c.nonce));
        take(bob, 20 ether, true);
        assertEq(rewards.lastPolicySeason(), 1);
        assertEq(rewards.policyMultiplier(1), 0);
        assertEq(rewards.emittedInSeason(1), 20 ether);
        yarn.burn(100 ether);
        vm.warp(epoch + 26 weeks);
        rewards.rollSeasons();
        assertEq(rewards.currentRoutineBudget(), 0);
    }

    function test_closedSeasonAccountingExcludesLateBurnAndIncludesTesterEmission() public {
        take(alice, 20 ether, true);
        take(alice, 12 ether, false);
        yarn.burn(16 ether); // 16/32 = 0.5; next multiplier = 0.625.
        vm.warp(epoch + 13 weeks);
        yarn.burn(100 ether); // Must not repair the closed season retroactively.
        assertEq(rewards.burnedInSeason(0), 16 ether);
        assertEq(rewards.burnedInSeason(1), 100 ether);
        assertEq(rewards.currentRoutineBudget(), 7.5 ether);
        take(alice, 7.5 ether, false);
        assertEq(rewards.policyMultiplier(1), 0.625 ether);
        assertEq(yarn.balanceOf(alice), 39.5 ether);
        SeasonRewards.Claim memory c = voucher(alice, 1);
        bytes memory signature = sign(c, false);
        vm.prank(alice);
        vm.expectRevert(SeasonRewards.WeeklyCap.selector);
        rewards.claim(c, signature);
    }

    function test_healthyBoundaryDoesNotReduceAndEmptySeasonsDoNotIncreaseBudget() public {
        take(alice, 10 ether, false);
        yarn.burn(8 ether);
        vm.warp(epoch + 13 weeks);
        assertEq(rewards.currentRoutineBudget(), 12 ether);
        rewards.rollSeasons();
        assertEq(rewards.policyMultiplier(1), 1 ether);
        take(alice, 10 ether, false);
        yarn.burn(7 ether);
        vm.warp(epoch + 26 weeks);
        assertEq(rewards.currentRoutineBudget(), 9.6 ether);
        vm.warp(epoch + 65 weeks); // Catch up across three unobserved, empty seasons.
        rewards.rollSeasons();
        assertEq(rewards.lastPolicySeason(), 5);
        assertEq(rewards.currentRoutineBudget(), 9.6 ether);
        rewards.rollSeasons();
        assertEq(rewards.currentRoutineBudget(), 9.6 ether);
    }

    function test_insufficientPoolRollsBackTesterAndRoutineAccounting() public {
        rewards = new SeasonRewards(address(yarn), address(this), vm.addr(signerKey), 32 ether, epoch);
        SeasonRewards.Claim memory c = voucher(alice, 20 ether);
        bytes memory signature = sign(c, true);
        vm.prank(alice);
        vm.expectRevert();
        rewards.claimTester(c, signature);
        assertFalse(rewards.testerClaimed(alice));
        assertFalse(rewards.usedNonces(c.nonce));
        assertEq(rewards.emittedInSeason(0), 0);
        assertEq(rewards.claimedInWeek(alice, rewards.currentWeek()), 0);
        c = voucher(alice, 6 ether);
        signature = sign(c, false);
        vm.prank(alice);
        vm.expectRevert();
        rewards.claim(c, signature);
        assertEq(rewards.routineClaimedInWeek(alice, rewards.currentWeek()), 0);
        assertEq(rewards.emittedInSeason(0), 0);
    }

    function testFuzz_lowDemandBudgetIsEnforcedForAnySignedAmount(uint96 rawBurn, uint96 rawClaim) public {
        take(alice, 10 ether, false);
        uint256 burned = bound(rawBurn, 0, 8 ether - 1);
        yarn.burn(burned);
        vm.warp(epoch + 13 weeks);
        uint256 budget = rewards.currentRoutineBudget();
        assertLe(budget, 9.6 ether);
        uint256 amount = bound(rawClaim, 1, 12 ether);
        SeasonRewards.Claim memory c = voucher(alice, amount);
        bytes memory signature = sign(c, false);
        vm.prank(alice);
        if (amount > budget) vm.expectRevert(SeasonRewards.WeeklyCap.selector);
        rewards.claim(c, signature);
        assertLe(rewards.routineClaimedInWeek(alice, rewards.currentWeek()), budget);
    }
}
