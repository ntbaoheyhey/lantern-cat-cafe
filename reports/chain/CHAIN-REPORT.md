# CHAIN checkpoint — 2026-11-12

The authenticated judge demo works on a disposable local chain with Fuji ID43113. Guest gas, boss proof, Relic mint/list/buy/cancel, YARN claims, material sealing, fee accounting and asset migration execute real local transactions. This is a reviewed local implementation, not a claim that public Fuji deployment or every campaign requirement is complete.

Validated implementation: `b6712694557c06161ccc6cdd54099d8bc8b22f71`. This checkpoint adds reports and evidence only; implementation files are unchanged.

Draft PR: https://github.com/ntbaoheyhey/taskbar-hero/pull/441 — base `codex/cardrpg-c-2026-11-11`. Worktree: `/Users/bao/taskbar-hero-chain`. Existing Fuji NFT/market addresses are unchanged. Every new feature remains gated; live defaults stay off.

| Card | Result and evidence | Score / disposition |
|---|---|---|
| H0 | Audit28 lines; original Forge96 baseline; repaired cold lazy-import race without skipping tests | 9 |
| H1 | Versioned browser key, SIWE, export warning, chain guard, repeat-login/no-key-payload browser test; actual V1/V2 escrow/proceeds/NFT/YARN/AVAX migration via `check-move.mjs` | 9 |
| H2 | Real0.05 AVAX drip; address/IP/day/reserve limits and crash recovery; SQL/RLS tests plus `check-drip.mjs` | 9; deployment/proxy verification user-only |
| H3 | Deterministic Anvil/PGlite/SIWE harness, dedicated CI job; three consecutive fresh full browser passes | 9 |
| H4 | Judge vouchers and authoritative fixed starter boss; on-chain Bag/listings/history, cosmetic Treasure, art/receipt links and retries | 8 for judge demo; ordinary campaign authority remains open |
| H4b | Full catalog policy, stable IDs, 5% Power test, 10% seal burn, 5% sales, arbitrary prices, anti-abuse, filters/stats; material trading and recovery proved in browser | 7; requeue #1 attempted, ordinary campaign issuance/use awaits authoritative C2 inputs |
| H5 | 22 distinct dated sources, allocations/vesting design, three52-week cohorts incl20% bots, CSV/JSON/charts, Vietnamese pitch; conservation and thresholds pass with provisional supply | 7; requeue #1 attempted, C2 supply and routine reward/controller wiring still open |
| H6 | YARN fixed genesis/burn/permit; AVAX/YARN V2 escrow and pull proceeds; signed season claims/caps/replay/signer rotation; deploy script and Vietnamese user guide | 9; no public broadcast |
| H7 | Commit/reveal recruit not implemented because H1–H6 required gate is not green | Gated stretch, not claimed complete |
| H8 | User-run Fuji smoke script; Anvil dry run18 receipts; architecture/registry/judge guide, desktop/mobile review, contracts docs | 9 for authorized local work; real Fuji timing/proof awaits user |
| H8b | C-Chain now/L1 later design, YARN gas, ICTT vs ERC-1155 adapter distinction, validator plan | 9; design only |
| H9 | Acceptance matrix, evidence, risks, self-scores, one requeue, deployment actions and Vietnamese handoff recorded | 9 |

## Validation

- Full `pnpm test`: 11 script tests; web2394, game-rules1352, SQL597, chain32, auth24, API16 pass. Two expected failures and11 skips are inherited unchanged from the base; CHAIN added no skips. Typecheck, lint and production build pass. Build retains existing chunk/dynamic-import warnings.
- `forge test --root contracts`: 111 passed, zero failed/skipped. Unit, fuzz and invariants cover fixed supply, burn accounting, market liabilities, fee math over arbitrary prices, reentrancy, ERC-1155 receiver checks, weekly caps, signature/domain/replay/expiry/season behavior and deployment configuration.
- `forge coverage`: new-contract line coverage YARN100%, SeasonRewards100%, RelicMarketV2 95.95%. This is line coverage, not a security-audit claim. Full repository coverage includes legacy/tests and is lower.
- `pnpm chain:test`: `chain-guest.spec.ts` proves SIWE → gas → boss → mint → V1 list/buy/cancel → YARN grants → paid seal → recovery → arbitrary-price V2 sale → correct burn/treasury/payout/ownership, under120 seconds locally. `guest-wallet.spec.ts` proves repeat login retains the address and no private key is sent. Three independent starts, retries0.
- Final browser gate after the UI repairs: full-loop 24.4s / 22.2s / 24.9s; complete two-spec runs 35.4s / 31.7s / 34.7s. All three start fresh chains and pass with retries disabled. Local timings do not prove public Fuji meets the two-minute goal.
- Anvil smoke18 confirmed receipts, drip recovery and complete asset migration passed. Local hashes in `FUJI-SMOKE-DRY-RUN.md` do not exist on Snowtrace. `FUJI-SMOKE.md` is deliberately absent until the user runs the public smoke.
- Simulation subsidy-inclusive emission/burn at week52: casual-heavy1.6364×, balanced1.7704×, farmer-heavy1.9922× (limit2×). Farmer/casual reward per hour ~0.20× (limit3×). The farmer-heavy margin is narrow. Zero-demand stress fails sustainability and stops routine rewards after week13. Supply0.4 rare/0.08 Epic per active week and optional sinks are assumptions, not C2 data or measured demand.

Evidence: `tests/full-unit-final.log`, `full-forge-final.log`, `coverage-final.log`, `e2e-final-{1,2,3}.log`, `drip-final.log`, `move-final.log`, `smoke-final.log`, `simulation-final.log`, `docs-review.log`, `typecheck-final.log`, `lint-final.log`, `build-final.log`. Screenshots: `shots/H1-guest.png`, `H3-market.png`, `H3-history.png`, `H4-mobile.png`, `H4b-market.png`, `H6-mobile.png`, `H5-tokenomics{,-mobile}.png`, `H8-docs{,-mobile}.png`.

## Remaining work and risks

1. **User deployment:** follow `USER-DEPLOY-VI.md`: deploy only the three new contracts, fund SeasonRewards, apply the three explicit migrations, deploy three Edge Functions, configure the demo flags/metadata host, validate trusted IP forwarding, seed/run the bot and run public Fuji smoke. Never put keys in reports or chat. Public deployment and real-key transactions were not performed by this session.
2. **C2 integration:** OUTBOX was rechecked and still contains only SLOTS/PILOTS readiness. Ordinary offline campaign saves are untrusted and cannot authorize mintable inventory. `REQUESTS-TO-C2.md` specifies the missing weekly supply and authoritative earning/consumption/rank interface. Catalog eligibility is not delivered campaign issuance. The fixed starter boss/Star Thread is the current authoritative source.
3. **Economy enforcement:** demo claims are one-time tester grants. Routine weekly/rank issuance and automatic season-budget calculation are not wired; auto-reduction exists in the simulation/design only. Genesis distributor custody does not enforce allocation vesting. Optional pass/cafe/forge sinks are hypotheses. No price forecast or guaranteed earnings.
4. **Security/abuse:** browser keys depend on local storage and XSS prevention; losing the key loses guest access. Wallet/IP quotas are not proof of human uniqueness. V1/direct transfers bypass V2 fees/cooldowns. No new NFT adds combat power; legacy Relic combat effects remain unproven against the win-rate rule and are not enabled by CHAIN. History reads a bounded120,000-block window.
5. **Remote verification:** GitHub Actions cannot start because the account billing/spending limit blocks the changes job, reconfirmed on check130978962411; local passes are not remote green. An earlier Vercel taskbarhero build reported a rate limit; current preview checks were still pending at the final handoff review. No deployment retry was requested or triggered manually.

The full requirement-by-requirement status is in `ACCEPTANCE.md`. Cards below8 were returned once to `QUEUE.md`; the unresolved authority/calibration inputs remain explicit. No merge, public deploy, secret inspection or subagent was used.
