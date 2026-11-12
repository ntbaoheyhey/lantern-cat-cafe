# C2 — battle, painted VFX, balance and integration report

**The requested implementation, measurements and local integration are complete; balance acceptance is partial.** Final report: 2026-11-12T12:56:54.424020+00:00. Draft [C2 PR440](https://github.com/ntbaoheyhey/taskbar-hero/pull/440) and [integration PR442](https://github.com/ntbaoheyhey/taskbar-hero/pull/442) remain unmerged. The original Lane C baseline is preserved. No public deployment or main merge was performed.

The integrated guest demo passes 4,514 package tests, 56 Node script tests, 118 Foundry tests, 435 browser tests and both Anvil browser flows, plus typecheck/lint/build. All 600 monthly accounts completed. Casual first Epic is day 1 and first Legendary day 11. Model first-loss timing and normal-win HP medians still miss their combat targets; four original item-screen cells remain above 12pp. These are retained findings, not passed gates.

## Cards and self-scores

| Card | State / score | Evidence and remaining limit |
|---|---|---|
| B0 | Complete · 8 | Baseline audit and inherited research exclusions; [B0.md](B0.md) |
| B1 | Complete · 8 | Four-unit staggered formation, migration, targeting, slot contract; [B1.md](B1.md) |
| V0 | Complete · 8 | Skill/event/timing audit and before clips; [V0-SKILLS.md](vfx/V0-SKILLS.md) |
| V1 | Complete · 8 | Original layered sources, timelines, runtime and preview; [V1.md](vfx/V1.md) |
| V2 | User approved · 8 | All three pilots approved on 12 November; [V2.md](vfx/V2.md) |
| B2 | Complete · 8 | Compact HUD and 33 screen budgets; final integrated audits both max25; [B2.md](B2.md) |
| B3 | Complete · 9 | Actual 30-minute browser cohorts and exact policy/combat parity; [B3.md](B3.md) |
| B4 | Measured miss · 7 | Three allowed tuning passes exhausted; best pass3 retained; [BALANCE.md](BALANCE.md) |
| B4b | Measured, partial acceptance · 7 | Nine cited sources, all drop sources/Odds, 600-account economy, 128-template impact screen and independent holdouts; [ECONOMY.md](ECONOMY.md), [DROP-TABLE.md](DROP-TABLE.md) |
| V3 | Complete · 8 | 86 accepted sources/timelines: 78 event effects plus eight labeled passive-stat previews; [V3-STATUS.md](vfx/V3-STATUS.md) |
| B5 | Local integration complete · 8 | Exact READY merge, full checks, guest demo and visual review; [B5.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-integrate-2026-11-12/reports/cardrpg-c2/B5.md) |
| B6 / V4 | Report complete · 8 | This report, screenshots, limitations and [VFX-REPORT.md](vfx/VFX-REPORT.md) |

Cards below 8 received their required return work. B4 used all three permitted configuration passes; a fourth is prohibited by the supplied instructions. B4b's failed item screens triggered source/policy repair, then the affix/Riposte table correction, a complete repeat screen and predeclared independent holdouts, followed by new UI/model/monthly cohorts. The residual misses remain score 7; they were not hidden by another sample or relabeled as passes.

## Combat against targets

Final frozen gameplay runtime: `4e68bb5977dfd04657aada154793a2bc1513811b3b48ecd183af9d8dd57f69a1`; B4 pass3 enemy configuration. UI seeds 80001–80005; model seeds 80001–80500. All seeds reached the full 30-minute horizon; no browser errors.

| Cohort | First-loss median (target12–20m) | Earliest / seeds below 8m | Boss median / p90 (targets60–90 / ≤110s) | Normal-win HP mean / median (target55–80%) |
|---|---:|---:|---:|---:|
| UI: 5 × 30 minutes | 12.373 min | 9.489 min / 0 | 71.86 / 94.05 s | 77.92 / 90.28% |
| Model: 500 × 30 minutes | 11.790 min | 9.056 min / 0 | 74.78 / 94.90 s | 78.14 / 89.51% |

Boss timing, the no-loss-before-eight-minutes condition and mean normal-win HP pass both cohorts. Model first-loss median is12.593 seconds early. Normal-win HP medians exceed 80% by 10.28 pp/UI and 9.51 pp/model. Exact parity: 133 common encounters and 1,365 decisions; currency/XP error 0; per-seed median playback error 0.75–0.92%. See BALANCE.md for all three original passes and subsequent item-runtime remeasurements.

## Economy, fairness and supply

600 accounts = three declared player policies × 200 seeds 90001–90200 × 30 days. Runtime and CHAIN READY hashes are fixed; gross creation is counted before salvage and starting currency is separated from earned income.

| Profile | First Epic median / p90 day | First Legendary median / p90 day | Sink ratios: fish / threads / stamps / essence |
|---|---:|---:|---:|
| casual (30 min/day) | 1 / 1 | 11 / 11 | 1.040 / 0.960 / 1.053 / 0.866 |
| heavy (180 min/day) | 1 / 2 | 1 / 1 | 1.040 / 0.971 / 1.050 / 0.861 |
| regular (60 min/day) | 1 / 2 | 1 / 1 | 1.040 / 0.973 / 1.050 / 0.861 |

The casual rarity targets (Epic 1–2 days, Legendary 10–16 days) and all 12 currency ratios (0.8–1.1) pass. Heavy/casual per active hour: XP 0.167×, gear 0.165×, mastery materials 0.167×; all are below 3×. These are explicit progress proxies, not a universal bound on every activity.

Every profile shares the 12 November calendar start. The regular/heavy day-one Legendary result is correlated through the shared daily-route seed; 200 account seeds do not measure variation between start dates. Bags, all 30-day CDF values, censoring and all per-profile/item quantities are retained in [ECONOMY.json](ECONOMY.json).

The full 128-template / 6,144-cell / 100-paired-seed item screen retains four 13 pp misses. The four-cell independent 1,000-seed holdout measures 4.6–11 pp, with the Crumbweave interval 7.99–14.01 pp still crossing 12 pp. The separate 27-cell holdout measures at most 9.3 pp. None of these samples proves a universal 12 pp item-effect cap. Source Odds display live values, current pity and the hard cap 24; duplicates and full-shelf conversion provide useful salvage/shards.

[OUTBOX.md](OUTBOX.md) publishes weekly numbers for every Epic+ template and material, including the two-day final partial week. [WEEKLY-SUPPLY.json](WEEKLY-SUPPLY.json) uses exact CHAIN READY `394cf60613b5b576367e860b7dff8bab60dc84aa`: weighted Rare 0.000000, Epic 14.301992, Legendary 0.704842 per active account/week (75% casual / 20% regular / 5% heavy). Epic and Legendary fees remain separate. **Authoritative ordinary-campaign issuance remains zero** until trusted player/wallet, earning and consumed/sealed records exist. One-time Star Thread is not recurring campaign supply.

## VFX and rendered evidence

All 86 accepted effects retain original painted keys, eight named clean layers, PSD/PNG archives, four-phase timelines and review clips. Download: **5,783,929 / 6,000,000 bytes**. Isolated Mac scene profiles: 60.00–120.10 fps, worst render p95 2.20 ms at 1280×720. These are isolated-scene measurements, not a whole-game guarantee. Forty-four profiles are headless; older profiles predate the user's headless-only instruction. Source 2048px keys are archival resamples of image-tool output, not native 2048 claims. No AI final character art was made.

The final integrated screenshots were personally inspected headlessly through resized captures. Preparation, HUD and boss proof follows; the [walkthrough](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-integrate-2026-11-12/docs/demo-build/index.html) also contains guest wallet and desktop/mobile Judge views.

![Four-member formation](https://raw.githubusercontent.com/ntbaoheyhey/taskbar-hero/codex/cardrpg-integrate-2026-11-12/docs/demo-build/media/prepare.webp)

![Normal battle HUD](https://raw.githubusercontent.com/ntbaoheyhey/taskbar-hero/codex/cardrpg-integrate-2026-11-12/docs/demo-build/media/hud.webp)

![Pantry boss and phase HUD](https://raw.githubusercontent.com/ntbaoheyhey/taskbar-hero/codex/cardrpg-integrate-2026-11-12/docs/demo-build/media/boss.webp)

## Validation and handoff

Tested integrated runtime commit: `e9f2bdc5845b34223d848e125bfb07343a24179b`. Later changes publish reports, captures and the HUD export only. Compact evidence: [B5-VALIDATION.json](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-integrate-2026-11-12/reports/cardrpg-c2/B5-VALIDATION.json).

| Check | Final result |
|---|---|
| Package units | 4,514 pass; 2 expected failures and 11 inherited research skips disclosed |
| Node scripts / Foundry | 56 / 118 pass, no failures/skips |
| Full browser / Anvil browser | 435/435 + 2/2; no skips/retries/flakes |
| Typecheck / lint / build | Pass across workspace |
| Signed-out / authenticated word budgets | Both 33/33; maximum 25 words |
| Formation geometry / static walkthrough | 21 captures, overlap 0 and errors 0; desktop/mobile images decode without horizontal overflow |
| Monthly export | 600 unique profile/seed accounts; ledgers/week totals/CDFs/runtime/catalog hashes verified |

The self-repair history preserves the Deno import-map failure, wallet obstruction/word-budget failure and demo child-process shutdown failure. Focused checks and the complete repaired-build verification passed without disabling tests. Repeated late full runs were avoided after report-only changes. Hosted CI is separately blocked: [Actions run43220958448](https://github.com/ntbaoheyhey/taskbar-hero/actions/runs/43220958448) never started because of the account payment/spending limit. Vercel reports a build-rate limit; no manual deployment or CI bypass was attempted.

Run **`pnpm demo:play`** for the local guest game on 5940 (Anvil 5971 / API 5972); `DEMO_CHAIN=fuji` explicitly selects public endpoints. The [Vietnamese guide](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-integrate-2026-11-12/docs/demo-build/CHAY-DEMO.md) documents setup and local/Fuji distinctions. Verification services were stopped after capture; the command starts a fresh throwaway local chain.

Open risks: combat first-loss/HP-median gaps; item-impact uncertainty; shared-calendar rarity correlation; trusted campaign inventory and routine weekly/rank reward authority; CHAIN's unmet emission/burn acceptance; remote CI/hosting account limits; final designer Spine-event retiming. Cosmetic Treasure remains disconnected from the measured legacy Relic bonus. Future READY/request syncs at 15 November 12:00 UTC and 17 November 12:00 UTC have not happened yet. Reports are delivered before 18 November 18:00 UTC; code freeze is 19 November 12:00 UTC, leaving 19–21 November for the user's deploy/Fuji/video/slides and submission by 21 November 16:59 UTC.
