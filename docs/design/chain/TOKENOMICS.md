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

At season end target burn/emission >=1.0. If below 0.8, next season's reward budget is multiplied by min(0.8, observed ratio/0.8); zero burn means no routine rewards next season. Unused budget stays reserved. Never take back past player balances. This operator policy is modeled, but SeasonRewards alone does not autonomously observe all game sinks: operators must publish the calculation before signing next-season vouchers. The contract independently limits weekly claims and season/replay domains.

## Simulation and limits

Run `node tools/chain/token-sim.mjs`; fixed seeds, 52 weeks, three 1,000-player cohorts and a demand-shock stress case. Outputs in `docs/chain/tokenomics.html` and CSVs. Compare uncontrolled requested emissions against the policy-controlled case so feedback does not hide failing demand. Acceptance: cumulative week-52 routine emissions/burn <=2 in every standard mix; farmer reward/hour <=3× casual. Report one-time tester subsidy separately **and** an inclusive ratio; no division-by-zero magic.

C2 OUTBOX checked 2026-11-12: only SLOTS/PILOTS readiness, no weekly supply. Provisional per-active-player weekly inputs must be explicit in the script; they are not C2 estimates. Re-run with C2-supplied figures before claiming calibrated economics. A model passing assumed demand is not evidence of real sustainability. Low-demand/zero-demand stress must show reduced or stopped rewards. Unlock releases are tracked independently from routine emission; allocation dilution cannot be justified by a healthy small reward loop.

## Trading and authority

See [trade rules](TRADE-RULES.md). Only server-created inventory can be sealed. Reserving an intent locks the source copy; finalizing a verified burn consumes it and returns a recoverable voucher for the existing NFT contract. Browser save imports never create entitlements. Sealed ownership follows balanceOf; market escrow removes the usable copy. No unseal API. Chain treasures have zero combat effect; matching gear templates cannot exceed the grindable same-tier alternative by 5% Power. Full campaign rewards and combat equipment integration require authoritative C2 work.

Vietnam restrictions and uncertainty are described in E11/E12; testnet labelling is not a legal exemption. No mainnet, fiat redemption, promised price, earnings forecast or commercial authorization is part of this task.
