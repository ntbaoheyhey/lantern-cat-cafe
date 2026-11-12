# Feature budgets — Fuji only, 2026-11-12

Testnet — no real value. This is a concrete design table, not an enabled payout promise. Existing deployed amounts stay unchanged. Local styles and finite forge are implemented behind separate flags; public activation remains deferred. Routine sources stay disabled. Research:E1, E14–E18 and T1–T8; conditional measurement:[supply study](../../../reports/chain/SUPPLY-STUDY.md); experiment:[720 runs](../../chain/balance-study.html).

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
| Finite cosmetic forge | −3 +2 already-sealed Epics | Three permanent designs per wallet, once each | **Implemented locally**, separate flag/vault; public deployment deferred | Net−2 usable units, irreversible custody; no stats or token output |
| Rename | −2 | Proposed once/season; first name free | **Unshipped**,100% burn | Small optional purchase; cannot affect identity/eligibility |
| Permanent room styles | −4 each | Three distinct styles per account, once each | **Implemented locally**, separate frontend/server flags;100% burn | Known cosmetic output, free preview/reset; no stat boost |
| Cosmetic season pass | −12 | Proposed once/13-week season | **Unshipped**,100% burn | Known cosmetic catalog only; no YARN rebate, XP, tickets or improved reward odds |
| Move guest assets |0 game fee | Owner-triggered; actual chain gas | Implemented transfers | Transfers are not emission, burns or earned rewards |

## Affordability and budget arithmetic

Use completed eligible boss weeks, not promised hourly earnings. At the **disabled 1.5-YARN pilot ceiling**, a rename at 2 needs at least 2 successful weeks, decor at 4 needs 3, a 3-YARN forge fee needs 2 **plus inputs**, a 12-YARN pass needs 8, Epic sealing at 10 needs 7 and Legendary sealing at 30 needs 20. These are rounded-up completion counts, not elapsed time. A casual 50% completion assumption doubles expected active weeks; policy reductions may make any wait longer or infinite. Initial grants and uncertain sale proceeds are excluded.

The effective forge cost is critical. Preparing two Epic inputs costs 20 in seal burns before the 3 forge fee: **23 YARN, at least 16 successful boss weeks**, exceeding the 21-YARN maximum routine entitlement of one pilot season. Two already-owned inputs still have an opportunity cost; buying inputs has no guaranteed price. One free-source Star Thread per account cannot support repeated two-material recipes. The earlier four-forges/season roadmap remains a hypothetical comparison only. The implemented catalog has three lifetime designs, not a recurring seasonal allowance. Local execution tests do not establish cosmetic desirability or affordability for actual players.

At full pilot completion, one account requests at most 19.5 boss + 1.5 rank = 21 routine YARN per season. The aggregate 1,000-account ceiling is **19,500 boss + 242.5 rank = 19,742.5**, not 21,000 for everybody. Top 1/10/25/50% tiers are 1.5/1/0.5/0.25, remainder zero. With exactly 100 qualified accounts this becomes 1,950 + 24.25 = 1,974.25. The 1,000-account tester allocation of 20,000 is separate. Final-season rank remains pending at week 52, with claims starting the following season. Contract 32 total / 12 routine ceilings and policy reduction override these quotes; final eligibility and available cap must be checked before signing.

**Program duration is explicit.** The limited candidate earns only in weeks1–13. Its already-earned rank can settle in weeks14–26 under the deployed reduced cap; it does not earn another leaderboard or boss reward after week13. The earlier52-week/five-year1.5 studies are recurring-policy counterfactuals. [The finite pilot comparison](../../chain/pilot-window-study.html) keeps those controls and adds54 paired cases+18 stresses. At100% assumed participation,9/9 finite cases pass the cumulative2× and farming3× gates; at50% or10%,0/9 pass. Worst finite ratios:1.296/2.623/13.688. No case meets all four seasonal health targets; a scheduled end is not sustained activity. These results do not activate routine issuance.

The unchanged 35% player allocation yields a first-year envelope of about 104.117m. It is not a spending target. At the recorded post-smoke pool of 9,960, at most 498 additional 20-YARN grants are funded **before** outstanding claims or a buffer. A 1,000-new-tester cohort is short 10,040 even with zero routine rewards. This is historical illustrative arithmetic, not a current balance check. Never spend an outstanding signed voucher's reserve again after an RPC timeout; reconcile its nonce/payment or proven expiry first.

## What the multi-seed study supports

The stock-aware study replaces unlimited willingness to seal with a six-item inventory target. At 100% assumed uptake, the original 6/6 proposal fails all 60 mix/seed cases; lower 3/3 and 1.5/1.5 pass all 60. At 50%, 25% or 10% uptake, **all three proposals fail all 60 cases**. The six-item target is a sensitivity assumption, not a new game restriction. Removing it makes the model look healthy because players are assumed to keep sealing unsold items. Seed diversity cannot validate that behavior.

Choose **0 routine YARN enabled now**. Keep the 1.5/<=1.5 pilot as a reviewable, disabled envelope after authority and measured voluntary demand exist. Keep the deployed 20 grant, fees, genesis and allocations unchanged. Do not raise fees or assume future cosmetic buyers to force a pass.

Acceptance before activation: trusted weekly/rank receipts, one closed trial season with measured acquisition/seal uptake/unique buyers/stock, disaggregated organic burns, funded claim reserves and renewed weak-demand/bot cases. The offline planner keeps three disjoint liabilities: signed vouchers, verified unsigned entitlements, and routine budgets already committed but not yet assigned to recipients. `routineAlreadyCommitted` consumes the closed-period demand/announced budget, including paid claims; `routineCommittedUnassigned` reserves only the unpaid portion absent from the other two liabilities. Paid claims are already reflected in the pool snapshot and are not subtracted twice. Proposed tester slots exclude grants already reserved elsewhere. The offline planner `tools/chain/reward-budget.mjs` returns the minimum of unreserved funds, remaining announced pilot cap and **50% of verified voluntary burns less already committed routine budgets**. Missing authority or unmeasured demand makes the candidate zero. The 50% factor is a conservative design experiment, not a benchmark optimum. It never counts treasury transfers or distributor burns as demand and never enables an issuer. Its input provenance still needs verification; a calculator cannot authenticate a ledger. The current planner additionally requires complete cumulative claims and reviewed burn at the same block/hash as the pool snapshot. New routine headroom is capped at max(0,2×eligibleBurn−all prior gross claims−disjoint unpaid promises−20×new tester slots). Recycled claims remain in that denominator. Missing history disables a candidate; budget credit cannot hide an inherited grant deficit. No future spending is forecast into this bound; the seasonal≥1 health target remains separate. See GRANT-FEASIBILITY.md.

## Sell-through and seal fees

The 10% reference seal and 5% sale fee remain prototype choices supported by the range of T1–T5 comparisons, not optimized retention parameters. For a sale probability q and gross price P, expected net proceeds before gas/opportunity cost are q × 0.95 × P. Merely recovering the seal fee F requires P >= F/(0.95q). This is **break-even arithmetic, never a price floor, price forecast or listing restriction**.

| Item | Seal F | Gross needed if 100% sold | If 50% sold | If 25% sold |
|---|---:|---:|---:|---:|
| Star Thread | 2 | 2.106 | 4.211 | 8.422 |
| Epic | 10 | 10.527 | 21.053 | 42.106 |
| Legendary | 30 | 31.579 | 63.158 | 126.316 |

Values round upward to 0.001 YARN and exclude chain gas. At a model sale price of 20, a Legendary seal already loses 11 even if sold; bots therefore decline it. The reference value of 300 is not evidence a buyer will pay 300. Lower sell-through requires better utility or a smaller exposure, not a forced market price.

## Implemented finite sinks and remaining proposals

RelicForge atomically receives two owned canonical Epic units, burns3 YARN and unlocks one bound design. The vault has no owner, upgrade, approval or withdrawal route. ERC1155 totalSupply is unchanged; only usable supply falls. Unit/fuzz/invariant and real browser checks verify custody, rollback and lost-response recovery. This is local engineering evidence, not an external security audit or public deployment. Styles use domain-separated existing YARN seal receipts plus unique server orders. Rename and recurring pass remain proposals. All finite and hypothetical demand comparisons are separately labelled; none establishes current organic demand.

## Next price experiment and finite grant enforcement

[The exact basket study](../../chain/catalog-budget-study.html) compares10/5/2.5/0% reference sealing,0/3/21 hypothetical additional income,0/6 available Epics and0/2 retained YARN. It does not modify game prices or forecast purchases. At5%, one completed forge13 +style4 +Star Thread seal1 leaves2 from the unchanged20 grant. This is the next candidate for an eventual voluntary trial against10%, with authoritative inputs; lower fee is not automatically better. All50/25/10% cohort bounds still fail even when every active human buys a maximum affordable complete basket. Keep default10% and routine issuance0 until evidence supports a change.

The optional `CHAIN_TESTER_BUDGET_ENABLED` path reserves each20-YARN entitlement against a reviewed lifetime ceiling before signing. Retries/expiry never create new slots. Funding protects all charged gifts, every routine ceiling and explicit legacy liabilities. `chain_reward_budget_register` shares its lock, registers a new routine plan disabled and denies direct service-role inserts. The40-YARN fixture is only a test budget, not the public program size. These protections apply to the new guarded path; previously issued/untracked vouchers require a conservative protected reserve before migration. No new public program is enabled.

Campaign rewards also force this grant reservation path when `CHAIN_CAMPAIGN_REWARDS_ENABLED=1`, even if the separate tester flag is absent. Missing funding rows refuse signing. Keep the tester flag enabled after a campaign pause until all legacy/current liabilities have been reconciled. An eight-wallet Anvil attack is bounded to40 but captures100% of the approved budget; this is loss containment, not per-person fairness.

Latest conditional frontier:1,650 runs, two selection seeds and three separate validation seeds, plus42 stresses. The same144 synthetic source traces are reused, so the validation seeds do not validate human behavior. At60/75/100% persistent participation, the10% seal candidate selects0.3 boss/week and the5% trial selects0.6; all9 held-out cases per selected condition meet2× flow and95% first-forge-by13. None meets the first-season1.0 health target. At50/10%, no nonzero candidate qualifies. Do not activate these nominations. See campaign-frontier-study.html and operator-study.html for the failed hourly/identity cases, original seasonal gate and per-feature completion outcomes.


## Price calibration: completed value versus burn

The [216 paired fee cases +36 stresses](../../chain/seal-fee-study.html) now test10/7.5/5/2.5% with identical grant20, style4, forge3, sale5%, C2 input and one13-week1.5 pilot. Both forge-first and style-first priorities remain visible. No runtime/signed price changed.

| Seal trial | Star Thread | Epic | Legendary | Full self-source forge |50%-participation worst claims/burn, forge-first|
|---|---:|---:|---:|---:|---:|
|10% current|2|10|30|23|2.623|
|7.5% experiment|1.5|7.5|22.5|18|2.598|
|5% next trial candidate|1|5|15|13|2.395|
|2.5% experiment|0.5|2.5|7.5|8|2.788|

5% is the highest rate that fits one forge, one style, one existing Star Thread seal and2 retained YARN in20. It improves access and output under the tested behavior; it does not pass weak participation or validate actual preference. At50% participation, every price fails0/9 flow gates; at10%, all fail again. No unconditional claim that cheaper is better, no additional grants to hide unaffordability, no floor/ceiling on resale.

Saving for all three designs can displace styles even at5%. The complete-basket table proves possibility only; the simulation retains both priorities and reports first-output timing by player type. A future price trial must preserve existing intents, expose the whole cost, retain nonbuyers and respect marketplace interference (E23/E24). It must not depend on spending to qualify for rewards.

Implementation follow-up: [SEAL-PRICE-TRIAL.md](SEAL-PRICE-TRIAL.md) makes the5% candidate locally executable behind a default-off server flag. Existing seal reservations retain their original exact cost. A real Anvil20 grant completes the18-YARN basket and leaves2, with no extra funds. This proves feasibility only; the216-case participation failures and0 observed people remain unchanged.
