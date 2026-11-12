# C2 — battle, painted VFX, balance and integration

**Candidate 7 completes the declared local combat, independent item and monthly economy targets.** Updated 2026-11-12T15:53:22.375642+00:00. Draft [C2 PR440](https://github.com/ntbaoheyhey/taskbar-hero/pull/440) and [integration PR442](https://github.com/ntbaoheyhey/taskbar-hero/pull/442) remain unmerged. The user removed tuning/return/compaction-count caps; work continued through the full fixed cohorts. No public deployment, main merge or secret access was performed.

The item evidence remains explicit: the complete 100-pair catalog screen contains one 13 pp absolute sample miss. That selected fixture measures −7.0 pp in its independent 1,000-pair panel. All 49 selected fixture point estimates meet 12 pp, and the separately predeclared 10,000-pair follow-up resolves the only marginal interval crossing 12 pp. These finite measurements do not prove a universal or simultaneous item-effect bound.

## Cards and self-scores

| Card | State / score | Evidence |
|---|---|---|
| B0 | Complete · 8 | Baseline audit and inherited research exclusions; [B0.md](B0.md) |
| B1 | Complete · 8 | Four-unit staggered formation, migration, targeting and slot contract; [B1.md](B1.md) |
| V0 | Complete · 8 | Skills/events/timings and before clips; [V0-SKILLS.md](vfx/V0-SKILLS.md) |
| V1 | Complete · 8 | Original painted layered pipeline/runtime/preview; [V1.md](vfx/V1.md) |
| V2 | User approved · 8 | Three approved pilots; [V2.md](vfx/V2.md) |
| B2 | Complete · 8 | 33 screen word budgets, signed-out and guest, maximum 25 |
| B3 | Complete · 9 | Real 30-minute cohorts and exact policy/combat parity; [B3.md](B3.md) |
| B4 | Measured targets pass · 8 | 5 real and 500 model seeds; [BALANCE.md](BALANCE.md), [fixed results](ITEM7-BALANCE.json) |
| B4b | Declared measurements complete · 8 | 600 monthly accounts/28 dates; 128-template screen; 49 independent fixtures plus predeclared 10k follow-up; [ECONOMY.md](ECONOMY.md), [DROP-TABLE.md](DROP-TABLE.md) |
| V3 | Complete · 8 | 86 accepted artworks: 78 rules-event effects and 8 labeled stat-passive previews; [V3-STATUS.md](vfx/V3-STATUS.md) |
| B5 | Local integration complete · 8 | Exact READY, full checks and reviewed guest demo; [B5.md](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-integrate-2026-11-12/reports/cardrpg-c2/B5.md) |
| B6 / V4 | Complete · 8 | This report, fresh screenshots and [VFX-REPORT.md](vfx/VFX-REPORT.md) |

## Combat against fixed targets

Frozen integrated runtime `007ce084d8e4573ec2d3d275390a0181719f88bbeff585cafeb7e66185d97efc`. UI seeds 80001–80005; model seeds 80001–80500. Every seed reaches 1,800 seconds, with zero browser errors. Targets: first-loss median 12–20 minutes; no loss before 8 minutes; boss median 60–90 seconds and p90 ≤110 seconds; ordinary-win ending HP 55–80%. Both the HP mean and median satisfy the target.

| Cohort | First-loss median | Earliest / seeds below 8 min | Boss median / p90 | Ordinary-win HP mean / median |
|---|---:|---:|---:|---:|
| UI: 5 × 30 minutes | 13.352 min | 11.821 min / 0 | 71.79 / 90.62 s | 68.71 / 77.63% |
| Model: 500 × 30 minutes | 12.507 min | 10.128 min / 0 | 80.11 / 97.30 s | 71.07 / 78.34% |

Exactly 144 common encounters and 1,493 decisions match; currency/XP error 0. Per-seed median playback error 0.465–0.865%; worst 1.558%. A boss finishing at 1,799.685 seconds in the model is still running at the real 1,800-second cutoff. The repaired comparator pairs encounter identities, validates any unmatched live tail and rejects an overlong or unexplained tail. Full-horizon balance distributions remain unchanged; the original failed aggregate comparison is preserved. [Paired evidence](ITEM7-PARITY.json).

C2 source runtime `7c19d3acc0c3f5afcbcfd14171a6387732e303110b798a0893c5aec08f2ae511` differs only by omission of the integration-only 114-line CHAIN catalog initializer; every other runtime byte is identical. [Source parity](ITEM7-SOURCE-PARITY.json). C2 numeric tuning remains in config tables; minimal plumbing reads the configured HP weight, opening shield, equipment Shelter and Rain Bell stack limit. Legacy behavior remains covered by regression tests.

## Economy, fairness and supply

600 modeled accounts = three declared policies × 200 seeds 90001–90200 × 30 days. Account seeds cycle across 28 consecutive start dates from 12 November, with 7–8 accounts/profile/date and matching dates across profiles. Daily-route seeds remain correlated by actual calendar date; 600 accounts are not 600 independent date samples. The original single-start-date cohort is preserved separately in Git/history and raw files.

| Profile | First Epic median / p90 day | First Legendary median / p90 day | Sink ratios: fish / threads / stamps / essence |
|---|---:|---:|---:|
| casual (30 min/day) | 1 / 1 | 11 / 11 | 1.039 / 0.973 / 1.052 / 0.876 |
| regular (60 min/day) | 1 / 1 | 11 / 11 | 1.039 / 0.974 / 1.053 / 0.879 |
| heavy (180 min/day) | 1 / 1 | 11 / 11 | 1.038 / 0.974 / 1.053 / 0.885 |

Casual Epic day 1–2 and Legendary day 10–16 targets pass, as do all 12 currency sink ratios 0.8–1.1. Heavy/casual per active hour: XP 0.167×; gross gear 0.167×; mastery materials 0.167×; each ≤3×. These are declared XP, gear and mastery proxies. Bag policy salvages spare low-rarity pieces above 48 while retaining equipment; gross creation is counted before salvage. Full bags, CDFs, censoring, starting balances, inflows/outflows and week totals remain in [ECONOMY.json](ECONOMY.json). [Validation](ITEM7-ECONOMY-VALIDATION.json) verifies all 600 unique accounts, all 30 daily horizons, 28 date strata, ledgers, CDFs, item totals and exact runtime/catalog hashes. The 253 accounts preserved when worker count changed remain byte-identical; replayed casual/regular controls matched exactly.

[OUTBOX.md](OUTBOX.md) publishes all 64 Epic+ templates and modeled material rows, including the two-day partial fifth week. Exact CHAIN READY `394cf60613b5b576367e860b7dff8bab60dc84aa` yields weighted Rare 0.000000, Epic 14.519867, Legendary 0.659808 per active account/week for the 75/20/5 mix. These are eligible gross templates, not authoritative receipts or observed demand. Epic and Legendary fees remain separate. **Ordinary campaign authoritative issuance stays zero** pending trusted player/wallet, immutable earning, level and consumed/sealed records. Star Thread remains a one-time CHAIN Judge entitlement; Treasure remains cosmetic.

The updated rarity chart was rendered headlessly and visually reviewed at publication: six cumulative curves, readable axes/legend and the 28-date correlation note, with no clipping or page errors.

All source Odds use live tables, current pity and visible hard cap 24; duplicates convert to useful shards/gear/salvage. Nine research sources and original audits remain in DECISIONS.md and DROP-TABLE.md. No paid-currency system or legacy Relic combat path was added.

## VFX and visual evidence

All 86 accepted effects retain original keys, eight named PNG/PSD layers, timelines and reviewed clips. Download **5,783,929 / 6,000,000 bytes**. Retained Mac 1280×720 isolated-scene profiles measure 60.00–120.10 fps, worst per-skill render p95=2.20 ms; these are not whole-game guarantees. Seventy-eight effects use actual rules events; eight stat passives are explicitly labeled art previews. Designer Spine-event retiming awaits those files. The 2048 px archival keys are resampled exports of image-tool output. Forty-four retained profiles are headless; the older profiles predate that instruction. No final AI character art was generated.

![Four-unit formation](https://github.com/ntbaoheyhey/taskbar-hero/raw/refs/heads/codex/cardrpg-integrate-2026-11-12/docs/demo-build/media/prepare.webp)

![Live battle HUD](https://github.com/ntbaoheyhey/taskbar-hero/raw/refs/heads/codex/cardrpg-integrate-2026-11-12/docs/demo-build/media/hud.webp)

![Pantry boss and phase HUD](https://github.com/ntbaoheyhey/taskbar-hero/raw/refs/heads/codex/cardrpg-integrate-2026-11-12/docs/demo-build/media/boss.webp)

Fresh preparation/HUD/boss/Judge/market/history and desktop/mobile walkthrough captures were personally inspected after the final gameplay change. Four allies, HP labels and boss phase bar remain unobstructed; wallet close/tab controls fit mobile. [Walkthrough](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-integrate-2026-11-12/docs/demo-build/index.html) · [Vietnamese guide](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-integrate-2026-11-12/docs/demo-build/CHAY-DEMO.md) · [VFX gallery](../../docs/vfx/index.html).

## Verification and remaining boundaries

| Check | Result |
|---|---|
| Integrated package units | 4,517 passes; 2 expected failures and 11 inherited research skips disclosed |
| Node / Foundry | 64 / 118 passes; no failures/skips |
| Browser / Anvil browser | 435/435 + 2/2; zero skips, retries, flakes or unexpected results |
| Workspace typecheck / lint / build | Pass |
| Signed-out / authenticated word budgets | 33/33 each, maximum 25 words |
| Formation / walkthrough | 21 captures, overlap 0; desktop/mobile images decode without overflow |
| Source backport | 41 Node + 11 focused rules + workspace typecheck; exact runtime parity |
| Monthly projection | 600 accounts / 30 days / 28 calendar strata; all declared targets and integrity checks pass |

Evidence: [B5-ITEM7-VALIDATION.json](https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-integrate-2026-11-12/reports/cardrpg-c2/B5-ITEM7-VALIDATION.json). The failure history retains prior balance screens, independent panels, horizon comparison, Deno imports, wallet/word-budget obstruction and demo shutdown repairs. Focused failures were fixed and the required full local set passed without disabling assertions. No repeated full suite was run after report-only changes.

Hosted checks are separate. GitHub's changes job has been rejected by the account payment/spending gate, leaving dependent jobs skipped. Vercel has also reported build-rate limits; a pending preview is not a passing build. The dated remote snapshot in B5.md names the observed heads and statuses. No hosted-CI pass, manual deployment or billing change is claimed.

Run `pnpm demo:play` for the local guest game on 5940 (Anvil 5971 / API 5972). `DEMO_CHAIN=fuji` explicitly selects configured public endpoints. Verification services were shut down after capture. The user's public Fuji/deploy/video/slides window remains 19–21 November.

Open external work: trusted campaign inventory and weekly/rank authority; CHAIN's unmet emission/burn acceptance and unmeasured demand; remote account limits; final designer Spine retiming. Future READY/request syncs 15 November 12:00 UTC and 17 November 12:00 UTC have not happened yet. Reports are delivered before 18 November 18:00 UTC; code freeze 19 November 12:00 UTC; submission 21 November 16:59 UTC.
