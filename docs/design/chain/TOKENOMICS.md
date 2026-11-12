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

YARN is earned only through a tester grant, weekly boss eligibility and season rank. No per-battle, per-hour or trading-volume payment. Prototype: 20 YARN one-time judge grant; 6 weekly-boss + up to 6 rank YARN; total contract cap 32 YARN per player per UTC Monday week including a grant. Claims are signed, expiring, recipient-bound and globally nonce-protected. A season is exactly 13 weeks from an explicit epoch; expired season claims fail. The judge demo issues only the tester grant; ordinary ranked/weekly issuance needs authoritative C2 progression.

Sealing burns 10% of fixed reference value (2 YARN for Star Thread). Market V2 charges 5% of seller's chosen gross price: 2% burned and 3% treasury, subject to integer rounding. Same 5% for AVAX, but its sink is native AVAX, never included in YARN burn metrics. Seller gets 95% via pull payment. Fee rate is fixed at deploy, <=10%; old listings cannot be repriced by an admin. Free gifts and dust prices remain allowed. Existing V1 remains fee-free and cannot be modified; migrations are voluntary and fees can be bypassed using V1/direct transfers. No claims of universal fee enforcement.

Other proposed sinks: cosmetic Relic forge, season-pass cosmetics, cafe decor and rename. No combat benefit or improved reward eligibility is sold. Forging should consume sealed items into an irrecoverable sink; existing RelicNFT has no burn entry point, so sunk units remain in ERC-1155 total records and are tracked as unusable inventory. These optional sinks are simulation assumptions until shipped, never reported as measured demand.

## Controller and measurement

Measure actual reward claims (emission into player circulation), true ERC-20 burns, treasury receipts separately, net supply, unique active players, sealed stock, irreversible item sinks, YARN per active hour and top-1% **player** reward share. Global concentration also includes vesting holders/distributor and must not be confused with player concentration. Fiat price is absent from all targets.

At season end target burn/emission >=1.0. If below 0.8, next season's routine cap is multiplied by min(0.8, observed ratio/0.8). The deployed contracts implement this automatically: YarnToken records actual burns in UTC-Monday weeks; SeasonRewards totals 13 closed weeks and **all claims, including tester grants**, then rolls the policy on the next claim or permissionless rollSeasons call. Read-only currentRoutineBudget previews the same result. Integer wei arithmetic rounds down. Treasury payments, AVAX sinks and transfers do not count as YARN burns.

The initial routine ceiling is 12 YARN per account/week; signed entitlements may be lower. Actual payout is limited by the lesser of entitlement and remaining cap, not automatically scaled for every casual player. The total weekly cap of 32 includes the separate, lifetime-once 20-YARN TesterClaim. Routine signing still requires a trusted campaign source and is not enabled in this demo. Unused tokens stay reserved; previous player balances are not clawed back. Zero multiplier is permanent in this deployment, while a new tester can still claim 20. Any holder's genuine burn, including distributor-funded burns, contributes to the on-chain metric; that fact is not evidence of organic demand. A healthy 0.8 boundary does not guarantee the 1.0 goal.

## Simulation and limits

Run `node tools/chain/token-sim.mjs`; fixed seeds, 52 weeks, three 1,000-account cohorts, 16 scenarios. Outputs in `docs/chain/tokenomics.html`, JSON and CSVs. Profiles separate (1) the current one-time judge demo, (2) proposed routine issuance using only implemented seal/sale sinks, and (3) unshipped forge/cosmetic demand. Compare the uncontrolled case; stress 10% demand, zero demand, 50% bot wallets and 80% V2-fee bypass. Bots are not assumed to buy cosmetic utility. Counterfactual cohorts assume adequate allocation funding: their initial grants need 20,000 YARN, more than the live pool.

Acceptance is cumulative week-52 emissions/burn <=2 in all three standard mixes, including the tester subsidy, and farmer routine reward/hour <=3× casual. **Not met:** implemented-sink scenarios return 2.3904 / 2.5332 / 2.7797. Low demand returns 19.2330; zero burn is undefined and fails, rather than silently dividing by a substitute denominator. Farmer/hour passes, but 50% bot wallets capture 53.24% of rewards in that stress scenario. Low top-1% wallet concentration does not prove low concentration per human. These are scenario outputs, not measured behavior or token price estimates.

The default command exits successfully when model invariants hold and reports economic acceptance separately as NOT MET. Use `node tools/chain/token-sim.mjs --require-sustainability` for the economic acceptance gate; it currently exits 1. Unit tests match deployed policy fixtures, enforce conservation in integer wei, exclude future sinks from the live profile, and prevent repeated fixture issuance. CI model correctness must not be described as an economic pass. See [audit](../../../reports/chain/TOKENOMICS-AUDIT.md).

C2 OUTBOX checked 2026-11-12: only SLOTS/PILOTS readiness, no weekly supply. Provisional per-active-player weekly inputs must be explicit in the script; they are not C2 estimates. Re-run with C2-supplied figures before claiming calibrated economics. A model passing assumed demand is not evidence of real sustainability. Low-demand/zero-demand stress must show reduced or stopped rewards. Unlock releases are tracked independently from routine emission; allocation dilution cannot be justified by a healthy small reward loop.

## Trading and authority

See [trade rules](TRADE-RULES.md). Only server-created inventory can be sealed. Reserving an intent locks the source copy; finalizing a verified burn consumes it and returns a recoverable voucher for the existing NFT contract. Browser save imports never create entitlements. Sealed ownership follows balanceOf; market escrow removes the usable copy. No unseal API. Chain treasures have zero combat effect; matching gear templates cannot exceed the grindable same-tier alternative by 5% Power. Full campaign rewards and combat equipment integration require authoritative C2 work.

Vietnam restrictions and uncertainty are described in E11/E12; testnet labelling is not a legal exemption. No mainnet, fiat redemption, promised price, earnings forecast or commercial authorization is part of this task.
