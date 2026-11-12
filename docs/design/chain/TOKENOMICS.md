# YARN — Fuji testnet design

**Testnet — no real value.** Chain 43113 only. Sources and dates: [research](TOKENOMICS-RESEARCH.md). This design is a budget policy plus a testnet contract implementation, not a valuation or investment offer.

## Supply and allocation

Soft currency remains unlimited, off chain and nontransferable. YARN has exactly 1,000,000,000 × 10^18 units minted to a distributor at genesis; no owner or future mint function. Burning only lowers supply. EIP-2612 permit has chain/contract domain separation.

| Allocation | Share / YARN | Schedule |
|---|---:|---|
| Player rewards | 35% / 350m | Five annual budget envelopes, each 80% of prior year |
| Team | 15% / 150m | 12-month no-release cliff, then 36 months linear |
| Community treasury | 12% / 120m | At most 2% **of this bucket** each quarter; unused balance stays reserved |
| Investors | 12% / 120m | 12-month cliff, then 24 months linear |
| Ecosystem/tournaments/artists | 10% / 100m | 48 months linear; grants require delivery |
| Early testers | 6% / 60m | 25% at TGE; remaining 75% over six months |
| Liquidity | 5% / 50m | Reserved at TGE; no real-money pool in this demo |
| Advisors | 3% / 30m | 12-month cliff, then 24 months linear |
| Partner reserve | 2% / 20m | Six-month lock; release is a ceiling, not a promise |

Total: 100%. First-year player budget = 350m/(1+.8+.64+.512+.4096) = approximately 104.117m; the five envelopes sum to 350m. Annual/weekly budgets are maxima, never an obligation to distribute unused tokens. Caps and weak demand normally leave most reserved. Retaining the allocation avoids pretending a small demo can absorb a 104m annual release. E9 supports durations, not the exact percentages. The operator-controlled genesis distributor **does not enforce allocation vesting**; production would require separate reviewed vesting wallets/multisig. Do not advertise these schedules as contract guarantees.

## Rewards, sinks and access

YARN is earned only through a tester grant, weekly boss eligibility and season rank. No per-battle, per-hour or trading-volume payment. Prototype: 20 YARN one-time judge grant; up to 6 YARN for one verified weekly boss and up to 6 YARN **once per closed 13-week season** for rank; total contract cap 32 YARN per player per UTC Monday week including a grant. Claims are signed, expiring, recipient-bound and globally nonce-protected. A season is exactly 13 weeks from an explicit epoch; expired season claims fail. The judge demo issues only the tester grant; ordinary ranked/weekly issuance needs authoritative C2 progression.

Sealing burns 10% of fixed reference value (2 YARN for Star Thread). Market V2 charges 5% of seller's chosen gross price: 2% burned and 3% treasury, subject to integer rounding. Same 5% for AVAX, but its sink is native AVAX, never included in YARN burn metrics. Seller gets 95% via pull payment. Fee rate is fixed at deploy, <=10%; old listings cannot be repriced by an admin. Free gifts and dust prices remain allowed. Existing V1 remains fee-free and cannot be modified; migrations are voluntary and fees can be bypassed using V1/direct transfers. No claims of universal fee enforcement.

Other proposed sinks: cosmetic Relic forge, season-pass cosmetics, cafe decor and rename. No combat benefit or improved reward eligibility is sold. Forging should consume sealed items into an irrecoverable sink; existing RelicNFT has no burn entry point, so sunk units remain in ERC-1155 total records and are tracked as unusable inventory. These optional sinks are simulation assumptions until shipped, never reported as measured demand.

## Controller and measurement

Measure actual reward claims (emission into player circulation), true ERC-20 burns, treasury receipts separately, net supply, unique active players, sealed stock, irreversible item sinks, YARN per active hour and top-1% **player** reward share. Global concentration also includes vesting holders/distributor and must not be confused with player concentration. Fiat price is absent from all targets.

At season end target burn/emission >=1.0. If below 0.8, next season's routine cap is multiplied by min(0.8, observed ratio/0.8). The deployed contracts implement this automatically: YarnToken records actual burns in UTC-Monday weeks; SeasonRewards totals 13 closed weeks and **all claims, including tester grants**, then rolls the policy on the next claim or permissionless rollSeasons call. Read-only currentRoutineBudget previews the same result. Integer wei arithmetic rounds down. Treasury payments, AVAX sinks and transfers do not count as YARN burns.

The initial routine ceiling is 12 YARN per account/week; signed entitlements may be lower. An authoritative issuer must sign at most the lesser of entitlement and remaining cap. The contract rejects oversized vouchers rather than partially paying them; it does not automatically scale every casual entitlement. The total weekly cap of 32 includes the separate, lifetime-once 20-YARN TesterClaim. Routine signing still requires a trusted campaign source and is not enabled in this demo. Unused tokens stay reserved; previous player balances are not clawed back. Zero multiplier is permanent in this deployment, while a new tester can still claim 20. Any holder's genuine burn, including distributor-funded burns, contributes to the on-chain metric; that fact is not evidence of organic demand. A healthy 0.8 boundary does not guarantee the 1.0 goal.

## Simulation and limits

The historical source control is reproduced with `node tools/chain/supply-study.mjs`, `node tools/chain/token-sim.mjs` and `node tools/chain/balance-study.mjs`. Default source hashes and measured rates are checked; stale snapshots are rejected. An explicit `--supply=path.json` remains attributed to its provenance. The old0.4 rare/0.08 Epic fixture is not the report default. C2 has now supplied600 simulated accounts over30 days. Reproduce the newer integrated scenarios with `node tools/chain/c2-study.mjs` and `node tools/chain/pilot-window-study.mjs`; both reconcile pinned per-item/per-profile evidence, partial week5, actual3.5/7/21-hour profiles and separate10/30 Epic/Legendary fees. Bots and future weeks remain assumptions. Gross creation before salvage/use is not inventory authority or observed demand. Keep the historical control distinct from the new C2 model.

The source experiment covers 1,000 seeds for each of four schedules over eight weeks. Conditional Epic+ means are 2.699/week for casual, 12.585 for regular and 12.638 for farmer/bot. All runs assume chapter 3 unlocked, scheduled encounters won and daily inventory space. This is not measured retention, win rate, hours, or secure earning evidence. No recurring tradable rare material exists in those rules. Funded equipment invitations are measured separately and excluded from the default, as are crafting and selectors; a joint soft-currency budget is needed before adding them.

The token model runs 52 weeks, three fixed 1,000-wallet cohorts (including 20% bots), 16 main scenarios and 63 reward/demand cases. A second study uses 20 seeds per mix, four adoption levels and three reward scales: 720 runs plus 12 structural stress cases. Model version 5 fixes rank cadence and distinguishes a pending fourth-season entitlement from a paid claim; week 53 settlement is tested separately. Rank requests can expire or be reduced by the shared cap, so pending figures are conditional ceilings, not debt.

Demand assumptions are explicit: 90% weekly activity, persistent adopters, a generic 20-YARN sale price, buyers stopping at four owned units and sealers stopping at six unsold/owned units. Six is a behavioral inventory target, **not a protocol cap**. Targets 2/24/1000 are stress cases; the high target recreates the optimistic unbounded-sealing model. Bots do not buy cosmetic utility or pay 30 to seal an item for 19 net resale proceeds. Bound inventory occupancy, correlations between skill and spending, actual item preferences, churn, invitation/crafting budgets and endogenous prices remain unmeasured. Random seed variation does not quantify those uncertainties.

Current acceptance remains **NOT MET**: default source-derived claims/burn ratios are 2.0674 / 2.2120 / 2.4054, above the requested cumulative week-52 ceiling of 2 in every mix. Farmer routine YARN/hour passes the <=3× casual gate under the assumed hours; it is not a proof of human fairness. No future forge/cosmetic sink is counted in current acceptance. With the original 6-weekly/6-seasonal reward proposal, 0/60 full-adoption mix/seed cases pass; at 3/3 and 1.5/1.5, 60/60 pass **only at assumed full adoption**. Every tested reward scale fails all 60 cases at 50%, 25% and 10% adoption. The nominal pilot ceiling is therefore not calibrated for launch.

The 63-case single-seed grid's largest tested all-mix maximum is 6 YARN in a rank payout week (boss 3 + rank at most 3) at full adoption; none passes at 50% or 10%. That maximum is not payable every week. It supersedes the old 3/0.6 result from the weekly-rank, unbounded-stock placeholder model. Those earlier values must not be presented as current recommendations.

The default CLI exits 0 only for accounting correctness and labels economics separately. `--require-sustainability` exits 1 while any standard mix fails. Exact bigint invariants cover tokens, reward channels and item inventory. A closed cohort with no token inflows obeys claims = player balances + treasury + burns: cumulative burn/claims reaching 1 requires exhausting balances and treasury. A season can burn earlier balances, but that is finite stock, not endlessly renewed demand. Treasury receipts, resale transfers, item custody and YARN burns remain separate.

[FEATURE-BUDGETS](FEATURE-BUDGETS.md) specifies every feature's candidate price, cadence and effective item-input cost. Routine rewards remain disabled. The 1.5 weekly / <=1.5 seasonal pilot is a smaller experimental envelope, not a proven sustainable setting. [Reward-budget examples](../../chain/reward-budget.json) protect pending claims, unassigned committed budgets and tester grants before new rewards; the offline planner cannot attest the inputs or reserve balances on a server. The 50% organic-burn budget factor is an original conservative experiment, not a contract change or research-established optimum. An authority adapter and measured voluntary uptake remain activation conditions.

The global allocation/unlock scenario is tracked separately from this tiny reward loop. A model assuming 1,000 initial grants requires 20,000 YARN; the recorded post-smoke pool of 9,960 cannot cover it. That snapshot is historical, not a fresh balance. Sponsored/distributor burns may improve the deployed controller's ratio without demonstrating player demand. See [research](TOKENOMICS-RESEARCH.md), [balance study](../../chain/balance-study.html) and [latest validation](../../../reports/chain/ECONOMY-VALIDATION.md).

## Trading and authority

See [trade rules](TRADE-RULES.md). Only server-created inventory can be sealed. Reserving an intent locks the source copy; finalizing a verified burn consumes it and returns a recoverable voucher for the existing NFT contract. Browser save imports never create entitlements. Sealed ownership follows balanceOf; market escrow removes the usable copy. No unseal API. Chain treasures have zero combat effect; matching gear templates cannot exceed the grindable same-tier alternative by 5% Power. Full campaign rewards and combat equipment integration require authoritative C2 work.

Vietnam restrictions and uncertainty are described in E11/E12; testnet labelling is not a legal exemption. No mainnet, fiat redemption, promised price, earnings forecast or commercial authorization is part of this task.

## Autonomous calibration and implementation follow-up

Local finite styles (three lifetime choices at4 YARN) and RelicForge (three lifetime designs at3 YARN plus2 sealed Epics) are now implemented and tested behind independent default-off flags. The historical recurring-roadmap profile is a different counterfactual; do not replace its assumed purchases with the finite catalog. Public deployment and voluntary adoption remain unverified. See [round2](CALIBRATION-ROUND-2.md), [forge proof](../../../reports/chain/FORGE-REVIEW.md) and [pilot](COSMETIC-PILOT.md).

Additional studies:1,440 closed-period cases,360 five-year durability cases,324 alternative-recipe cases,648 finite-style cases,216 shared-budget forge cases and144 treasury-recycling cases, with89 structural stresses. Recycling reports gross claims separately from fresh reserve release and spends only closed treasury cash. It still fails weak-demand and late-activity requirements. No tested policy closes all gates.

Further integrated studies add144 grant-headroom cases,162 completion cases,486 C2-supply cases and54 finite-program cases. The documented pilot now has an explicit13-week earning cutoff; prior rank may settle in the next season, while earning never silently renews. Worst one-season claims/burn is1.296/2.623/13.688 at100/50/10% assumed participation. Only full participation passes every tested mix/seed; no scenario proves sustained demand. A finite program ending is not a healthy recurring tail. All affected historical controls are regenerated with unchanged numerical outcomes and current fingerprints, rather than editing cached hashes.

The reserve planner now also charges prior tester/recycled claims and every unpaid promise against cumulative reviewed-burn headroom.50 exact grant-budget cases show where a one-time candidate is arithmetically supportable; these are not observations or a launch calibration. Missing complete history or source authority keeps the candidate disabled. Grant20, seal10%, sale5%, genesis and allocation shares remain unchanged.

Paid ownership stays cosmetic.69,888 paired diagnostic/candidate battle executions found legacy Relic bonuses exceeding3 percentage points; even50bps stat bonus yielded4.69pp in a selected held-out case. A25bps candidate's observed maximum0.68pp is not a global guarantee. No C2 battle/drop source changed.
