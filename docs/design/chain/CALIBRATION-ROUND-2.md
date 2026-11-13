# Calibration round 2 — 2026-11-12

The original default still fails economic acceptance. This round develops and tests alternatives, builds a finite cosmetic sink, and prepares stronger evidence collection. No live fees, grants, allocation, contract, C2 battle values or drop rates changed. Routine rewards remain disabled. Sources justify mechanisms and measurement choices, not the hypothetical demand coefficients below.

## What was tested

| Study | Cases | Question and result |
|---|---:|---|
| Closed-period policies | 1,440 ×52 weeks +21 stresses | Fixed6, fixed1.5, 25/50/75% burn budgets and opt-in-grant sensitivity. Five development plus15 holdout seeds per mix. At full assumed adoption, closed50 passes45/45 holdout flow/farming checks; worst claims/burn1.310. At50/25/10% adoption it passes0/45 each. |
| Durability | 360 ×260 weeks | Six policies, four adoption levels, three mixes, five new seeds. Fixed1.5 passes first-year affordability/flow under full adoption but all15 such cases fail the last-four-season activity check. Closed50 also fails affordability and late activity. No policy passes the whole grid. |
| Finite forge recipes | 324 ×260 weeks +20 stresses | Two Epic inputs plus3 YARN; sealed input costs23 self-sourced, authenticated unsealed input costs3. Finite8/40 cosmetic outputs over1/5years. Unsealed40-output/fixed1.5/full-adoption passes9/9 weaker flow/affordability/activity checks, but0/9 meet burn/claims≥1 in all four tail seasons. At50% adoption,0/9 pass the original flow gate. Recipe utility remains unimplemented and assumed. |
| Implemented finite styles | 648 ×260 weeks | One or three permanent4-YARN choices, zero/10/50/100% style interest among chain adopters, three policies, three mixes and three seeds. At50% interest/full chain adoption, fixed1.5 passes9/9 cumulative gates but0/9 late-activity checks. At50% chain adoption it passes0/9. Buying styles can displace seals. |

These add **2,772 main cases and41 structural stresses** beyond the earlier720-case stock study. The same deterministic cohort is used within paired counterfactuals; fresh seeds measure simulation variation only. No count of simulated runs is a count of people or evidence of willingness. All datasets, failed rows, source hashes and seeds are saved under `docs/chain/`.

## Constraints the calibration must respect

- Closed-cohort conservation: `claims = burns + wallet balances + treasury`. Reducing future rewards cannot remove20-YARN grants already held by people who never spend. A two-layer economy can leave token rewards optional while free game progression remains meaningful.
- With market fees alone and the deployed40% fee-burn share, total burn cannot exceed40% of claims if there are no external inflows, treasury recycling or other sinks. Thus even exhausting all balances cannot meet the requested50% cumulative burn boundary. A necessary theoretical direct-burn share is at least1/6 of claims under those assumptions. This is a bound, not a player spending quota or forecast. `flow-feasibility.mjs` verifies it with integer arithmetic.
- A one-time cosmetic catalog has a finite budget. Three styles can consume at most12 YARN/account. Spending12 of a20 grant leaves8, which cannot also pay a10-YARN Epic seal. Appending cosmetic burns to an unchanged seal baseline double-counts money.
- Passing cumulative claims/burn≤2 is weaker than seasonal burn/claims≥1. Neither proves affordable content or activity in later seasons. Zero claims and zero burns is not healthy engagement. The deployed controller's zero cap is absorbing; the study never overrides it to manufacture recovery.
- Allocation unlocks are separate ceilings. `allocation-envelope.mjs` tracks all buckets, sequential cliffs, linear releases and quarterly treasury ceilings through five years. Locked/unspent budget is not market demand and distributor custody is not enforced vesting.

## Work that now runs locally

1. Source adapter: disabled trusted-server seam, immutable source receipt and instance deduplication, wallet/rules/level/normalization binding, no browser write route. A real Anvil Epic source→seal→trade is tested. This prepares C2 integration; it cannot authenticate existing browser campaign saves.
2. Routine preparation: disabled source authority callback, pinned Fuji policy snapshot, unique nonce, budget/contract/rules/period/amount/cap binding and conservative expiry. SQL reserves before any later signer; there is no public route or signer. Eight real PostgreSQL sessions contest a3-YARN budget: exactly two1.5 reservations succeed. Removing the lock in the disposable negative control oversubscribes; eight source retries resolve one inventory item.
3. Burn accounting: full-genesis public token history reconciles supply and every touched balance at block60940929, with agreement from two public endpoints at the same hash. The2.024691357824691357 YARN burns are all recorded scripted smoke activity; **organic evidence is0**. Endpoint agreement does not prove independent infrastructure or human identity. No public write was made.
4. Cosmetic product: three finite4-YARN styles, free preview/reset, no Power or better rewards. Exact quote validation, domain-separated payment intent, server finalization and recovery are tested in browser and Anvil. The[protocol](COSMETIC-PILOT.md) and read-only receipt verifier count nonbuyers and avoid biased incomplete follow-up.

## Decision and next evidence

Keep deployed20 grant,10% seal reference,5% sale fee and all allocation shares. Keep1.5 boss/week and at most1.5 closed-season rank as a disabled candidate, with closed50 as a distinct budget experiment. Do not claim either is calibrated. The finite style pilot is ready for the user's later backend deployment and reviewed voluntary cohort; its price remains a hypothesis.

Before a routine-reward proposal can be accepted, obtain authoritative campaign/week/rank receipts, a complete closed13-week token ledger, reviewed voluntary behavior and source consumption, funded disjoint liabilities, and failures/recovery data. A7-day style test informs feature taste only. It does not prove recurring demand, close a season or certify bots. C2 combat/drop work and user-operated deployment are separately recorded; they did not block this round's implementation and local validation.

Reproduce: `node tools/chain/{calibration-study,durability-study,utility-study,cosmetic-pilot-study}.mjs` (run each separately). `--render-only` verifies cached fingerprints before rendering; it is not a new simulation run. Run `node --test tools/chain/*.test.mjs`, `node tools/chain/check-cosmetics.mjs`, `node tools/chain/check-source.mjs`, `node tools/chain/check-routine.mjs`, and `node tools/chain/check-reservations-postgres.mjs` for the associated implementation proofs. `token-sim.mjs --require-sustainability` still exits1.

## Completed continuation: finite forge, recycling and grant headroom

The forge is now implemented locally:2 canonical sealed Epics +3 YARN →one bound permanent ornament, three designs per wallet. It uses a new ownerless irreversible vault and the existing NFT/YARN; no public deploy. Three consecutive fresh browser runs passed without retries. `FORGE-LOCAL.json` proves2 source fixtures →seal →arbitrary-price trade →forge,23.28 total YARN burn,0.42 treasury and no recovered-item or duplicate-charge path. This does not turn synthetic source receipts into ordinary C2 authority.

Shared-budget forge study:216×260-week cases+24 stresses; interest in styles/forge is separately assumed, and both spend orders compete for one actual balance. Recycling study:144×260-week cases+24 stresses;50% and100% closed-treasury reuse retain the original gross-claims metric. At50% chain adoption recycling passes only3/9 initial-year cases per policy;25/10% pass0/9. No tested case retains all four tail seasons as active. Total continuation studies now3,132 main cases+89 stresses, beyond the earlier720+12. Cache-only rendering verifies fingerprints; it is not another simulation run.

Grant-headroom repair: period burn credit alone could propose rewards despite inherited grant liabilities. The offline planner now requires complete cumulative history at the pool block/hash, counts all prior grants and recycled claims, reserves all disjoint unpaid promises and future20-YARN tester slots, and caps new budget by remaining2× headroom. Missing history fails closed.50 exact synthetic cases quantify the remaining burn required for a1974.25-YARN100-account pilot. No new live reward source was enabled.

Combat counterfactual:43,008 additional battles across seven bonus levels and six selected cases.50bps bonus still produces4.69pp in a held-out case.25bps has0.68pp worst observed, but its simultaneous upper bound exceeds3pp; only0 is structurally identical combat input. Keep CHAIN Treasure/styles/forge cosmetic. C2 owns legacy stats, and the request now includes reproducible failed seeds and candidates.

The implementation gates can be completed locally. The original economic acceptance remains open: measured voluntary use and authoritative ordinary campaign receipts are still absent. These are explicit evidence limits, not reasons to leave available engineering work untested or unpushed.
