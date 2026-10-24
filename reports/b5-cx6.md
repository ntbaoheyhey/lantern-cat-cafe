# B5-CX6: Foundry fuzz and invariant tests

Date: 2026-10-24. Branch: `ai/codex-b5-cx6`. Base: `origin/main` at `e64934d`.

## Changes

- Added `contracts/test/Fuzz.t.sol`: five fuzz tests (256 cases each) for random voucher players, relic IDs, uint8 rarities, nonces and expiries; wrong signer and caller rejection; tampering with each signed field; random marketplace quantities/prices; successful buy/cancel settlement; invalid payments, unauthorized cancellation, zero inputs and inactive listing reuse.
- Added `contracts/test/Invariants.t.sol`: a seven-action handler mixes signed minting, owner nonce cancellation, replay with newly signed vouchers, matching/conflicting rarity mints, listing, buying and cancellation. Only handler actions are targeted; expected reverts are asserted explicitly and unexpected reverts fail the campaign.
- Three invariants check escrow against all active listings and independent ghost accounting, global nonce consumption (including cancelled nonces) with at most one successful mint per nonce, and rarity against the first successful mint. Escrow checks also compare the active set with listing history and verify enumeration without duplicate IDs.
- Inline configuration uses 32 runs with depth 48 (1,536 handler calls), over three players, eight relic IDs and 32 nonces. Bootstrap includes multiple copies and overlapping listings, with rarity 0 and 255. This bounds execution time and encourages collisions. Marketplace fuzz quantities are bounded to 1–8 real voucher mints and prices to 1–uint128 max; voucher IDs/nonces cover uint256 and rarities cover uint8.
- No production contracts or other application sources changed. No contract bug was found, so there is no failing contract sequence to report.

## Validation

Commands below ran locally, with no GitHub Actions invocation. Workspace commands ran at repository root; Forge tests ran in `contracts/`. Captured stdout/stderr follows each command. Outputs are from the final successful checks unless stated otherwise.

Git identity was checked before any work and again before committing:

```text
$ git config user.email && git config user.name
108352255+ntbaoheyhey@users.noreply.github.com
ntbaoheyhey
```

The literal requested syntax `forge --offline test` failed (exit 2) because this Forge version accepts `--offline` as a test subcommand option:

```text
error: unexpected argument '--offline' found

  tip: a similar argument exists: '--profile'

Usage: forge --profile <PROFILE> <COMMAND>

For more information, try '--help'.
real 0.00
user 0.00
sys 0.00
```

An initial timing attempt, `/usr/bin/time -p forge test --offline`, failed (exit 127) because the external `time` process could not resolve the shell's Forge command. Retrying with the absolute executable path succeeded. The first complete successful run took 2.84 seconds; after restricting a helper to `pure` to remove the compiler warning, the final run below took 1.92 seconds, including compilation.

### PASS (exit 0): `pnpm install`

```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 427ms using pnpm v10.28.0
```

### PASS (exit 0): `pnpm typecheck`

```text

> taskbar-hero@0.0.0 typecheck /Users/bao/Documents/ChatGPT/taskbar hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/game-rules typecheck: Done
packages/auth typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

### PASS (exit 0): `pnpm lint`

```text

> taskbar-hero@0.0.0 lint /Users/bao/Documents/ChatGPT/taskbar hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/chain lint: Done
packages/game-rules lint: Done
packages/auth lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done
```

### PASS (exit 0): `pnpm test`

```text

> taskbar-hero@0.0.0 test /Users/bao/Documents/ChatGPT/taskbar hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/game-rules test$ vitest run
supabase/tests test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/packages/game-rules
packages/chain test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/packages/chain
packages/auth test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/packages/auth
supabase/tests test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/supabase/tests
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  13:57:29
packages/chain test:    Duration  370ms (transform 37%, import 34%, worker 18%, tests 10%, environment 1%)
packages/chain test: Done
packages/game-rules test:  Test Files  4 passed (4)
packages/game-rules test:       Tests  63 passed (63)
packages/game-rules test:    Start at  13:57:29
packages/game-rules test:    Duration  465ms (tests 59%, import 24%, transform 11%, worker 5%)
packages/game-rules test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  13:57:29
packages/auth test:    Duration  754ms (import 77%, tests 19%, transform 3%, worker 1%)
packages/auth test: Done
supabase/tests test:  Test Files  12 passed (12)
supabase/tests test:       Tests  301 passed (301)
supabase/tests test:    Start at  13:57:29
supabase/tests test:    Duration  6.28s (tests 79%, import 19%, transform 1%)
supabase/tests test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  13:57:36
packages/api-contract test:    Duration  177ms (import 39%, transform 39%, tests 14%, worker 8%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/apps/web
apps/web test:  Test Files  23 passed (23)
apps/web test:       Tests  188 passed (188)
apps/web test:    Start at  13:57:37
apps/web test:    Duration  4.22s (environment 60%, tests 23%, import 15%, transform 1%, worker 1%)
apps/web test: Environment  jsdom was created 23 times · 21.59s total, 60% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done
```

### PASS (exit 0): `pnpm build`

```text

> taskbar-hero@0.0.0 build /Users/bao/Documents/ChatGPT/taskbar hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
packages/chain build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
packages/chain build: Done
packages/game-rules build: Done
packages/auth build: Done
supabase/tests build: Done
packages/api-contract build$ tsc --noEmit
packages/api-contract build: Done
apps/web build$ tsc --noEmit && vite build
apps/web build: vite v8.3.5 building client environment for production...
apps/web build: transforming...
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/Documents/ChatGPT/taskbar hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1658 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-DotazktF.css               30.48 kB │ gzip:   6.53 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-BcFL8Zlx.js            8.27 kB │ gzip:   3.41 kB
apps/web build: dist/assets/index-CR1S46O6.js                81.94 kB │ gzip:  23.56 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 379ms
apps/web build: Done
```

### PASS (exit 0): `/usr/bin/time -p /Users/bao/.foundry/bin/forge test --offline`

```text
Compiling 1 files with Solc 0.8.24
Solc 0.8.24 finished in 677.93ms
Compiler run successful!

Ran 19 tests for test/RelicEdges.t.sol:RelicEdgesTest
[PASS] test_approvedOperatorCannotPushRelicIntoMarket() (gas: 302759)
[PASS] test_buyWithZeroValueWrongPaymentReverts() (gas: 512295)
[PASS] test_buyerThatCannotReceiveRevertsAndRefundsEverything() (gas: 795985)
[PASS] test_cancelByNonSellerLeavesListingIntact() (gas: 519542)
[PASS] test_cancelUnissuedNonceBlocksItLater() (gas: 144113)
[PASS] test_cancelledNonceLeavesNoRelic() (gas: 139672)
[PASS] test_expiredVoucherDoesNotBurnItsNonce() (gas: 76550)
[PASS] test_failedMintDoesNotUseNonceOrCreateRelic() (gas: 231874)
[PASS] test_getListingsEdgePaging() (gas: 927477)
[PASS] test_listingAfterBuyUsesNewId() (gas: 848835)
[PASS] test_marketSupportsReceiverInterface() (gas: 6239)
[PASS] test_ownershipTransferMovesAdminRights() (gas: 121621)
[PASS] test_receiverHooksRevertWhenCalledDirectly() (gas: 29972)
[PASS] test_removingMiddleListingKeepsOthersBuyable() (gas: 1537984)
[PASS] test_sameRelicMintsTwiceWithDifferentNonces() (gas: 284282)
[PASS] test_sellerCanBuyOwnListing() (gas: 575626)
[PASS] test_supportsErc1155Interface() (gas: 19004)
[PASS] test_voucherExpiredLongAgoReverts() (gas: 73516)
[PASS] test_wrongPriceKeepsListingAndEscrow() (gas: 660023)
Suite result: ok. 19 passed; 0 failed; 0 skipped; finished in 16.53ms (9.72ms CPU time)

Ran 5 tests for test/Fuzz.t.sol:RelicFuzzTest
[PASS] testFuzz_eachVoucherFieldIsSigned(address,uint256,uint8,uint256,uint256,uint8) (runs: 256, μ: 80174, ~: 80023)
[PASS] testFuzz_listBuyCancel(uint256,uint8,uint256,uint256,bool) (runs: 256, μ: 1179268, ~: 1191590)
[PASS] testFuzz_voucherValidation(address,uint256,uint8,uint256,uint256) (runs: 256, μ: 160065, ~: 209830)
[PASS] testFuzz_wrongPlayerAndSigner(address,uint256,uint8,uint256,uint256,uint256) (runs: 256, μ: 272770, ~: 275828)
[PASS] testFuzz_zeroListingInputs(uint256,uint256) (runs: 256, μ: 79266, ~: 79259)
Suite result: ok. 5 passed; 0 failed; 0 skipped; finished in 369.57ms (682.95ms CPU time)

Ran 10 tests for test/RelicMarketFuzz.t.sol:RelicMarketFuzzTest
[PASS] testFuzz_cancelledAndNonexistentListingsKeepBuyerFunds(uint256,uint256,uint256) (runs: 256, μ: 1547292, ~: 1550109)
[PASS] testFuzz_cancelledNonceCannotMint(uint256,uint256) (runs: 256, μ: 128944, ~: 128660)
[PASS] testFuzz_expiredVoucherDoesNotConsumeNonce(uint256,uint256) (runs: 256, μ: 75796, ~: 76329)
[PASS] testFuzz_nonReceiverBuyerRollsBack(uint256) (runs: 256, μ: 633026, ~: 632554)
[PASS] testFuzz_rejectedSellerPaymentRollsBackAndCanRetry(uint256,uint256) (runs: 256, μ: 2298082, ~: 2292357)
[PASS] testFuzz_replayedVoucherCannotMintAgain(uint256,uint256) (runs: 256, μ: 208593, ~: 208311)
[PASS] testFuzz_revokedApprovalAndEmptySellerBalanceCannotInvalidateEscrow(uint256,uint256) (runs: 256, μ: 1639305, ~: 1633778)
[PASS] testFuzz_voucherValidAtExpiryButNotOneSecondLater(uint256,uint256) (runs: 256, μ: 214569, ~: 214297)
[PASS] testFuzz_wrongPaymentsRollbackThenExactPaymentSettlesOnce(uint256,uint256,uint256) (runs: 256, μ: 2348711, ~: 2352853)
[PASS] test_exactPaymentAtUint256Max() (gas: 592063)
Suite result: ok. 10 passed; 0 failed; 0 skipped; finished in 369.68ms (1.47s CPU time)

Ran 26 tests for test/RelicNFT.t.sol:RelicNFTTest
[PASS] testFuzz_nonSignerVoucherNeverMints(uint256,address,uint256,uint8,uint256,uint256) (runs: 256, μ: 76013, ~: 75792)
[PASS] test_cancelUsedNonceReverts() (gas: 263477)
[PASS] test_cannotSetZeroSigner() (gas: 35185)
[PASS] test_compactSignatureRejected() (gas: 55309)
[PASS] test_documented_rarityRaceBricksLaterVoucher() (gas: 253749)
[PASS] test_expiredVoucherReverts() (gas: 202594)
[PASS] test_hashVoucherMatchesManualEip712() (gas: 19233)
[PASS] test_highSSignatureRejected() (gas: 56400)
[PASS] test_malformedSignatureReverts() (gas: 40410)
[PASS] test_nonOwnerCannotCancelNonce() (gas: 36234)
[PASS] test_nonOwnerCannotChangeSigner() (gas: 64023)
[PASS] test_nonceIsGlobalAcrossPlayers() (gas: 205636)
[PASS] test_otherChainReplayReverts() (gas: 63408)
[PASS] test_ownerCanSetURI() (gas: 51349)
[PASS] test_ownerCancelsNonceThenVoucherReverts() (gas: 117439)
[PASS] test_ownerRotatesSignerAndOldVouchersFail() (gas: 265053)
[PASS] test_rarityMismatchReverts() (gas: 239045)
[PASS] test_receiverHookCannotReplayVoucher() (gas: 1394954)
[PASS] test_renounceOwnershipAlwaysReverts() (gas: 32171)
[PASS] test_replayOnSecondInstanceRejected() (gas: 69221)
[PASS] test_reusedNonceReverts() (gas: 186072)
[PASS] test_tamperedVoucherReverts() (gas: 62046)
[PASS] test_typehashMatchesDocumentedString() (gas: 5859)
[PASS] test_validVoucherMints() (gas: 205265)
[PASS] test_voucherForXSentByYReverts() (gas: 51536)
[PASS] test_wrongSignerReverts() (gas: 64746)
Suite result: ok. 26 passed; 0 failed; 0 skipped; finished in 369.69ms (81.32ms CPU time)

Ran 27 tests for test/RelicMarket.t.sol:RelicMarketTest
[PASS] testFuzz_priceExactPaymentOnly(uint256,uint8) (runs: 256, μ: 808328, ~: 755769)
[PASS] test_buyAlreadyBoughtReverts() (gas: 605240)
[PASS] test_buyCancelledReverts() (gas: 589678)
[PASS] test_buyNonexistentListingReverts() (gas: 53257)
[PASS] test_buyOverpayReverts() (gas: 504350)
[PASS] test_buyPaysSellerExactlyAndMovesRelic() (gas: 709178)
[PASS] test_buyUnderpayReverts() (gas: 504349)
[PASS] test_cancelAfterBuyReverts() (gas: 598603)
[PASS] test_cancelReturnsRelicToSeller() (gas: 669776)
[PASS] test_cancelTwiceReverts() (gas: 580666)
[PASS] test_constructorRejectsZeroAddress() (gas: 4421)
[PASS] test_directBatchTransferToMarketReverts() (gas: 248593)
[PASS] test_directTransferToMarketReverts() (gas: 249811)
[PASS] test_getListingsPaging() (gas: 2453563)
[PASS] test_listMoreThanOwnedReverts() (gas: 437958)
[PASS] test_listMovesRelicIntoMarket() (gas: 706101)
[PASS] test_listWithoutApprovalReverts() (gas: 386071)
[PASS] test_listZeroAmountReverts() (gas: 261508)
[PASS] test_listZeroPriceReverts() (gas: 261492)
[PASS] test_listingIdsIncrement() (gas: 1214647)
[PASS] test_maliciousBuyerReentryIsBlocked() (gas: 1911828)
[PASS] test_maliciousSellerBubblingReentryRevertsWholeBuy() (gas: 2092070)
[PASS] test_maliciousSellerReentryIsBlocked() (gas: 2080658)
[PASS] test_marketRejectsPlainAvax() (gas: 38177)
[PASS] test_onlySellerCanCancel() (gas: 548738)
[PASS] test_sellerThatRejectsAvaxCannotBeBought() (gas: 1503494)
[PASS] test_transferFromOtherErc1155Reverts() (gas: 224848)
Suite result: ok. 27 passed; 0 failed; 0 skipped; finished in 369.71ms (374.21ms CPU time)

Ran 1 test for test/Deploy.t.sol:DeployTest
[PASS] test_deployScript_wiresContractsAndWritesAddresses() (gas: 11216985)
Suite result: ok. 1 passed; 0 failed; 0 skipped; finished in 371.64ms (364.11ms CPU time)

Ran 1 test for test/Invariants.t.sol:RelicInvariantsTest
[PASS]
RelicInvariantsTest invariants:
[PASS] invariant_escrowEqualsActiveListings
[PASS] invariant_nonceNeverUsedTwice
[PASS] invariant_rarityNeverChanges
 RelicInvariantsTest invariants (runs: 32, calls: 1536, reverts: 0)

╭-----------------------+---------------------------+-------+---------+----------╮
| Contract              | Selector                  | Calls | Reverts | Discards |
+================================================================================+
| RelicInvariantHandler | buy                       | 250   | 0       | 0        |
|-----------------------+---------------------------+-------+---------+----------|
| RelicInvariantHandler | cancel                    | 218   | 0       | 0        |
|-----------------------+---------------------------+-------+---------+----------|
| RelicInvariantHandler | cancelNonce               | 219   | 0       | 0        |
|-----------------------+---------------------------+-------+---------+----------|
| RelicInvariantHandler | list                      | 219   | 0       | 0        |
|-----------------------+---------------------------+-------+---------+----------|
| RelicInvariantHandler | mint                      | 195   | 0       | 0        |
|-----------------------+---------------------------+-------+---------+----------|
| RelicInvariantHandler | mintSameOrDifferentRarity | 225   | 0       | 0        |
|-----------------------+---------------------------+-------+---------+----------|
| RelicInvariantHandler | replay                    | 210   | 0       | 0        |
╰-----------------------+---------------------------+-------+---------+----------╯

Suite result: ok. 1 passed; 0 failed; 0 skipped; finished in 1.12s (1.10s CPU time)

Ran 7 test suites in 1.13s (2.99s CPU time): 89 tests passed, 0 failed, 0 skipped (89 total tests)
real 1.92
user 4.25
sys 0.14
```

### PASS (exit 0): formatting and whitespace

```sh
forge fmt contracts/test/Fuzz.t.sol contracts/test/Invariants.t.sol
forge fmt --check contracts/test/Fuzz.t.sol contracts/test/Invariants.t.sol
git diff --check
```

Formatting initially reported both new files formatted; the subsequent checks produced no output and exited 0. The final Forge run reports 89 passed, zero failed and zero skipped across seven suites. This Forge version groups the three invariant assertions into one invariant campaign in its total.

## Limitations and open questions

- Randomized campaigns are bounded testing, not an exhaustive proof. The invariant handler uses EOAs; existing receiver/reentrancy tests ran as part of the complete contract suite.
- `pnpm install` warned about ignored dependency build scripts; installation and every required check still passed. The production build emitted a browser externalization warning for `node:worker_threads` in a dependency and completed successfully.
- Web e2e tests and redesign screenshots were not applicable: this card only adds contract tests and the report, with no `apps/web` changes. No PR was opened, following the task's explicit no-PR instruction.
- No blocked checks or open questions remain.
