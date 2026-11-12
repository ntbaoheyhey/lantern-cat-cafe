# Autonomous economy follow-up — 2026-11-12

No user wallet action is needed to reproduce this work. No deployed fee, reward cap, allocation or C2 stat/drop table changed. H4b/H5 remain open for ordinary campaign authority and demand validation; this follow-up completes the independent catalog, measurement, budget and model work.

## Corrections with consequences

1. Trade policy used the legacy 48-item catalog while Depth contains 128 templates. All 128 are now classified exactly once; 64 Epic+ templates receive stable IDs. Existing IDs are preserved. A normalized sealed preview has zero enhancement and minimum affix rolls, retaining set/unique definitions. All 64 are checked against reachable same-tier gear at companion levels 1/10/30. Chain ownership still has zero combat effect; Power checks alone are not a win-rate study.
2. Rank is a closed-season reward, not a weekly payout. Model claims start at weeks 14/27/40/53, share the same weekly cap as boss rewards, disclose pending fourth-season amounts and expire unpaid conditional rank at the next close. A source earning season must be stored separately from the signed claim season.
3. Conditional supply is measured using real source functions, daily caps and 4,000 schedule cohorts, not 0.4/0.08 placeholders. No recurring tradable rare material was found. The source study does not authenticate client inventory or predict combat success. Invitation supply is isolated; crafting/selector and shared soft-currency allocation remain excluded, so the totals are not an exhaustive gameplay forecast.
4. Low adoption is a persistent group, not a new chance every week for every wallet to become a buyer. Unsold inventory limits voluntary sealing. A six-item target is behavioral, not a deployed cap; alternative targets expose how strongly this assumption affects results. Artificially unlimited sealing makes the token ratio look healthier while the item stock grows.
5. Feature budgets include cadence, reward eligibility, input costs and funding obligations. The offline planner protects signed claims, verified unsigned entitlements, unassigned routine commitments and tester grants, subtracts already committed period budgets and yields zero candidate routine budget without authority and measured demand. It does not sign, reserve on chain, deploy or validate its own input provenance.

## 720-run result

Each row aggregates three mixes ×20 seeds over 52 weeks. Amounts are weekly-boss ceiling / once-per-season rank ceiling, not two weekly rewards. A pass means only the requested flow and farmer/hour gates under those assumptions. Behavioral uncertainty is larger than seed variation.

| Persistent adoption | Boss / rank YARN | Passing cases | Worst claims/burn |
|---|---:|---:|---:|
| 100% | 6 / 6 | 0/60 | 2.418× |
| 100% | 3 / 3 | 60/60 | 1.926× |
| 100% | 1.5 / 1.5 | 60/60 | 1.388× |
| 50% | 6 / 6 | 0/60 | 4.786× |
| 50% | 3 / 3 | 0/60 | 3.531× |
| 50% | 1.5 / 1.5 | 0/60 | 3.005× |
| 25% | 6 / 6 | 0/60 | 7.822× |
| 25% | 3 / 3 | 0/60 | 6.356× |
| 25% | 1.5 / 1.5 | 0/60 | 4.907× |
| 10% | 6 / 6 | 0/60 | 19.933× |
| 10% | 3 / 3 | 0/60 | 14.734× |
| 10% | 1.5 / 1.5 | 0/60 | 15.426× |

All low-adoption rows fail. Full adoption with smaller rewards is a scenario result, not observed demand. The active issuer remains disabled. The separate 12 stresses include zero demand, half bots, bot rank advantage, fee bypass, no buyers, week53 settlement, obsolete weekly rank and unlimited/repeated-opportunity optimism. CSV/JSON expose player balances, treasury, burn, sealed/unsealed stock, top1% wallet reward share and conditional rank.

A useful conservation check: with no external token inflows, claims = balances + treasury + burns. Cumulative burn/claims at1 requires exhausting both balances and treasury. A season may burn balances saved from previous seasons, but that cannot be assumed indefinitely. Forging items, burning YARN and transferring proceeds are separate flows.

## Research and budget decisions

Research now contains 27 distinct dated URLs, including ten item-trading entries (one overlaps the economy section). E14/E15 support separating season completion from payout; E16/E17/E18 support distinguishing inventory consumption, production and currency flows. E1 was re-read from the publisher during this follow-up. These sources motivate the design mechanisms; none proves our exact price, reward or uptake coefficient.

Concrete proposal: ordinary progression costs0 YARN; retain the existing20 tester grant,10% reference seal and5% sale fee. Keep routine rewards disabled. A possible pilot ceiling of1.5 boss/week and <=1.5 rank/season is still experimental. Cosmetic candidates: rename2, decor4, pass12, forge3 plus two sealed units. Preparing two Epic forge inputs makes23 total YARN, more than one pilot season's maximum21. No unshipped sink is used to pass current economics. Full amounts and break-even examples: docs/design/chain/FEATURE-BUDGETS.md.

## Reproduce and inspect

- `node tools/chain/trade-doc.mjs` regenerates catalog policy and public metadata.
- `node tools/chain/supply-study.mjs` records conditional drops and source hashes.
- `node tools/chain/token-sim.mjs` defaults to the source-study artifact; custom `--supply=path.json` requires provenance. Default runs reject changed source hashes or rates that disagree with the measurement; rerun the source study after reviewing a rule update.
- `node tools/chain/balance-study.mjs` runs720 seeded cases plus12 stresses.
- `node tools/chain/reward-budget.mjs --out=docs/chain/reward-budget.json` writes illustrative reserve examples; `--input=path.json` accepts explicit offline decimal-string inputs.
- `node --test tools/chain/*.test.mjs` verifies exact conservation, policy arithmetic, season settlement, saturation and reserve math.
- `node tools/chain/token-sim.mjs --require-sustainability` must currently exit1. Economic rejection is preserved and distinct from passing software tests.

The defaults deliberately do not manufacture sustainable demand. No public transaction is needed for these checks. Test logs, UI screenshots and the tested SHA are indexed in CHAIN-REPORT.md and OUTBOX.md.
