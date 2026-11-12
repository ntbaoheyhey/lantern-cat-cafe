# Feature budgets — Fuji only, 2026-11-12

Testnet — no real value. This is a concrete design table, not an enabled payout promise. Existing deployed amounts stay unchanged. New sources/sinks below remain disabled. Research:E1, E14–E18 and T1–T8; conditional measurement:[supply study](../../../reports/chain/SUPPLY-STUDY.md); experiment:[720 runs](../../chain/balance-study.html).

| Feature | YARN amount | Cadence / limit | Destination / status | Reason |
|---|---:|---|---|---|
| Ordinary battle, idle, daily quests, XP/levels, recruit, gear upgrades | 0 | Always | Existing bound currencies | Protect progression and avoid activity emissions or paid power |
| Judge tester pass | +20 | Once/wallet lifetime | Existing funded SeasonRewards | Enough for2-YARN material seal and1-YARN sample purchase; already deployed |
| Judge Relic vouchers | 0 mint fee | Two pass +one fixed boss | Existing signed voucher mint; gas only | Two-minute trial must not require farming |
| Weekly boss, original study proposal | Up to+6 | One verified boss entitlement/UTC week | Disabled routine issuer | Separate from normal repeated battles; completion probability modelled explicitly |
| Closed-season rank, original study proposal | +6 /4 /2 /1 /0 | Top1 /10 /25 /50 /remaining percent, once/13-week season | Disabled; paid starting next season | Corrects erroneous6-per-week rank assumption; final leaderboard receipt needed |
| Limited pilot candidate: boss | Up to+1.5 | One verified entitlement/week; one13-week pilot only | **Disabled**;25% scale experiment | Smaller committed reward exposure; does not make weak demand sustainable |
| Limited pilot candidate: rank | Up to+1.5 /1 /0.5 /0.25 /0 | Same rank tiers; once/season | **Disabled**; shared weekly routine cap | Top account can request3 total in a payout week, not every week |
| Seal Star Thread | −2 | One existing judge source/account;3 seals/day global |100% burn, implemented |10% of20 reference, not a resale floor |
| Seal Epic gear | −10 |3/day, authoritative level≥2 and source |100% burn; catalog-ready, campaign source pending |10% of100 reference; no paid stat premium |
| Seal Legendary gear | −30 | Same cap/source |100% burn; catalog-ready, campaign source pending |10% of300 reference; costly, do not seal on assumed resale demand |
| Relic references |5 /10 /20 /40 seal equivalents | IDs1–4; ordinary Relic sealing source absent | **Reference only**; current judge mint free |10% of50/100/200/400; no extra fee silently added to vouchers |
| P2P V2 sale |5% gross | Each actual sale; price may be zero |2% gross burn/native sink,3% treasury | Existing500bps fee; V1/direct transfers bypass it |
| List / cancel / pull proceeds |0 protocol fee | Gas only | Implemented | No deposit or price band; avoid speculative listing incentives |
| Cosmetic premium forge | −3 +2 already-sealed units | Proposed max4/season; select inputs explicitly | **Unshipped**; YARN burn plus irreversible item custody | Net−2 usable units; nontradable cosmetic output, no new gear power |
| Rename | −2 | Proposed once/season; first name free | **Unshipped**,100% burn | Small optional purchase; cannot affect identity/eligibility |
| Small cafe decor | −4 | Proposed two distinct purchases/season | **Unshipped**,100% burn | Known cosmetic output, no loot box or stat boost |
| Cosmetic season pass | −12 | Proposed once/13-week season | **Unshipped**,100% burn | Known cosmetic catalog only; no YARN rebate, XP, tickets or improved reward odds |
| Move guest assets |0 game fee | Owner-triggered; actual chain gas | Implemented transfers | Transfers are not emission, burns or earned rewards |

## Affordability and budget arithmetic

Use completed eligible boss weeks, not promised hourly earnings. At the **disabled 1.5-YARN pilot ceiling**, a rename at 2 needs at least 2 successful weeks, decor at 4 needs 3, a 3-YARN forge fee needs 2 **plus inputs**, a 12-YARN pass needs 8, Epic sealing at 10 needs 7 and Legendary sealing at 30 needs 20. These are rounded-up completion counts, not elapsed time. A casual 50% completion assumption doubles expected active weeks; policy reductions may make any wait longer or infinite. Initial grants and uncertain sale proceeds are excluded.

The effective forge cost is critical. Preparing two Epic inputs costs 20 in seal burns before the 3 forge fee: **23 YARN, at least 16 successful boss weeks**, exceeding the 21-YARN maximum routine entitlement of one pilot season. Two already-owned inputs still have an opportunity cost; buying inputs has no guaranteed price. One free-source Star Thread per account cannot support repeated two-material recipes. The proposed four-forges/season limit is an upper cap, not an affordability estimate or assumed purchase count. Keep the feature unshipped until its cosmetic desirability and input budget are tested.

At full pilot completion, one account requests at most 19.5 boss + 1.5 rank = 21 routine YARN per season. The aggregate 1,000-account ceiling is **19,500 boss + 242.5 rank = 19,742.5**, not 21,000 for everybody. Top 1/10/25/50% tiers are 1.5/1/0.5/0.25, remainder zero. With exactly 100 qualified accounts this becomes 1,950 + 24.25 = 1,974.25. The 1,000-account tester allocation of 20,000 is separate. Final-season rank remains pending at week 52, with claims starting the following season. Contract 32 total / 12 routine ceilings and policy reduction override these quotes; final eligibility and available cap must be checked before signing.

The unchanged 35% player allocation yields a first-year envelope of about 104.117m. It is not a spending target. At the recorded post-smoke pool of 9,960, at most 498 additional 20-YARN grants are funded **before** outstanding claims or a buffer. A 1,000-new-tester cohort is short 10,040 even with zero routine rewards. This is historical illustrative arithmetic, not a current balance check. Never spend an outstanding signed voucher's reserve again after an RPC timeout; reconcile its nonce/payment or proven expiry first.

## What the multi-seed study supports

The stock-aware study replaces unlimited willingness to seal with a six-item inventory target. At 100% assumed uptake, the original 6/6 proposal fails all 60 mix/seed cases; lower 3/3 and 1.5/1.5 pass all 60. At 50%, 25% or 10% uptake, **all three proposals fail all 60 cases**. The six-item target is a sensitivity assumption, not a new game restriction. Removing it makes the model look healthy because players are assumed to keep sealing unsold items. Seed diversity cannot validate that behavior.

Choose **0 routine YARN enabled now**. Keep the 1.5/<=1.5 pilot as a reviewable, disabled envelope after authority and measured voluntary demand exist. Keep the deployed 20 grant, fees, genesis and allocations unchanged. Do not raise fees or assume future cosmetic buyers to force a pass.

Acceptance before activation: trusted weekly/rank receipts, one closed trial season with measured acquisition/seal uptake/unique buyers/stock, disaggregated organic burns, funded claim reserves and renewed weak-demand/bot cases. The offline planner keeps three disjoint liabilities: signed vouchers, verified unsigned entitlements, and routine budgets already committed but not yet assigned to recipients. `routineAlreadyCommitted` consumes the closed-period demand/announced budget, including paid claims; `routineCommittedUnassigned` reserves only the unpaid portion absent from the other two liabilities. Paid claims are already reflected in the pool snapshot and are not subtracted twice. Proposed tester slots exclude grants already reserved elsewhere. The offline planner `tools/chain/reward-budget.mjs` returns the minimum of unreserved funds, remaining announced pilot cap and **50% of verified voluntary burns less already committed routine budgets**. Missing authority or unmeasured demand makes the candidate zero. The 50% factor is a conservative design experiment, not a benchmark optimum. It never counts treasury transfers or distributor burns as demand and never enables an issuer. Its input provenance still needs verification; a calculator cannot authenticate a ledger.

## Sell-through and seal fees

The 10% reference seal and 5% sale fee remain prototype choices supported by the range of T1–T5 comparisons, not optimized retention parameters. For a sale probability q and gross price P, expected net proceeds before gas/opportunity cost are q × 0.95 × P. Merely recovering the seal fee F requires P >= F/(0.95q). This is **break-even arithmetic, never a price floor, price forecast or listing restriction**.

| Item | Seal F | Gross needed if 100% sold | If 50% sold | If 25% sold |
|---|---:|---:|---:|---:|
| Star Thread | 2 | 2.106 | 4.211 | 8.422 |
| Epic | 10 | 10.527 | 21.053 | 42.106 |
| Legendary | 30 | 31.579 | 63.158 | 126.316 |

Values round upward to 0.001 YARN and exclude chain gas. At a model sale price of 20, a Legendary seal already loses 11 even if sold; bots therefore decline it. The reference value of 300 is not evidence a buyer will pay 300. Lower sell-through requires better utility or a smaller exposure, not a forced market price.

## Implementation contract for later sinks

Forge must receive exactly two owned, non-escrow ERC1155 units into audited irreversible custody; RelicNFT has no burn API. Do not label transfers to a recoverable treasury as item destruction. Lock custody/payment/entitlement atomically or provide an idempotent recovery receipt; a normal transfer or generic ERC20 burn cannot safely prove a particular cosmetic purchase. Output must be deterministic, bound and cosmetic. These features remain out of live acceptance until implemented and tested; the roadmap simulation records each sink separately and is never used to pass current-sink economics.
