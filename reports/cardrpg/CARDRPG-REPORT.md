# Card RPG — combined Systems and Presentation delivery

Status: **PARTIAL — integrated local prototype delivered and verified; strict frame-time, art quality and content-depth limits remain.** All ordered phases and checkpoints were addressed. No deadline, retry, PR-size or artifact-size ceiling was applied. Sessions A and B used their assigned paths and the sync channel; neither spawned extra agents.

Base `3bf2cfa3bd32d8355c5c967e979240330a595682`; frozen A `9ccf88e7eeac6814229e2b8d919b608bb4cee478`, contract 0.4.0; built source `a3d257cdd1eb1dc2e38d21fafab5bd41fdf725a1`; packaged integration `df39d16eced7f0ca0e349d3d44a86cf98531db34`. [integration #323](https://github.com/ntbaoheyhey/taskbar-hero/pull/323) remains a draft. Detailed evidence and limits: [Systems report](A-SYSTEMS-REPORT.md) and [Presentation report](B-PRESENTATION-REPORT.md).

Final metadata commit `7ff71ff69bd271c554ec4f407e1cb7fefbef8099` corrects the validation index, records all 14 PRs as open/draft/unmerged, and refreshes the [4,644-file manifest](https://github.com/ntbaoheyhey/taskbar-hero/blob/7ff71ff69bd271c554ec4f407e1cb7fefbef8099/reports/cardrpg/validation/delivery-manifest.json). It changes no runtime or artifact bytes. `python3 tools/cardrpg-demo/verify-delivery.py --write-manifest` completed successfully: 13 artifact-bound checks, 24 source-bound command receipts and every packaged file hash verified. Exact percentile and art limitations remain PARTIAL. [Verifier](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/tools/cardrpg-demo/verify-delivery.py), [corrected index](https://github.com/ntbaoheyhey/taskbar-hero/blob/7ff71ff69bd271c554ec4f407e1cb7fefbef8099/reports/cardrpg/validation/README.md).

## Open the prototype

Open `/Users/bao/taskbar-hero-cardrpg-int/docs/cardrpg/index.html` in a desktop browser. The self-contained file is **14,503,925 bytes (13.83 MiB)**; SHA-256 `4534b9951e2b4f27c44b55e1a8131800a4caad0bf976d4bc2c4c9b842a302772`. It uses no network and writes no game storage. Reload resets the account. Supported desktop sizes are 1024×600, 1280×720 and 1440×900.

REFERENCE: docs/cardrpg/index.html; docs/cardrpg/build.json; reports/cardrpg/offline-path/check.json; reports/cardrpg/offline-commands/check.json.

Route: cafe/team → equipment → earned invitation → patrol → keep loot and auto-equip at each rest → Yarn Giant → rewards → enhance → collection/codex. Seed 2 is a disclosed tutorial replay, not a balance sample.

REFERENCE: docs/cardrpg/index.html; docs/cardrpg/README.md; tools/cardrpg-demo/path-check.mjs; reports/cardrpg/validation/tutorial-seeds.json.

## Visible changes and gates

| Area | Delivered | Evidence and limits |
| --- | --- | --- |
| Battle | Smaller opposing formations, elevated camera, target-facing actions, nearby labels/intents, numbered rounds and skill cards | Nine layout fixtures and three desktop journeys; no resting bounds/label overlap or battle-page scroll |
| Art and effects | 43 five-beat recipes, distinct motion/cue definitions, twelve original portraits, visible equipment and rarity accents | Isolated VFX minimum 219/1280 exceeds the fixed 64-bit threshold; 23 whole-stage close pairs remain; three miniature/kit families |
| Collection/equipment | Twelve cats, 48 equipment templates, four rarities/slots, sets, levels/stars, compare, lock, enhance, reforge and salvage | Calls real A rules; local unsaved state |
| Meta loop | Cafe/team, banners/odds/pity/history, quests/service/day simulation, recipes, settlement, codex and Relic designs | 81 screen cases plus 17 command/accessibility categories per size; one playable chapter |
| Metal casts/transitions | 258 production casts, 0 long tasks; 9 next-wave entries, 0 long tasks | Exact thresholds remain unchanged; detailed per-case tails are retained |
| Retina | 258 native-DPR2 casts, 0 long tasks, 79 p95 and 0 p99 strict misses; worst p99 16.8ms; full natural campaign: 0 long tasks, p95/p99 16.8/33.3ms, 5 stable contexts, three rests and boss victory | Requested/effective quality recorded separately; optional High is not claimed to meet the same budget |
| Full lifecycle | Three natural x4 campaigns with all loot/rest screens, equipment picker and boss | No new contexts after loading; five exit cycles release all contexts; raw observations govern the claim |
| Isolation | Default-off flags and zero differing flag-off pixels at all three sizes | No prototype assets start when flags are off; bundle bytes are not identical |
| Software rendering | 8 sampled casts, 1 long tasks, aggregate p95/p99 66.7/83.3ms; DOM fallback tested | Performance remains PARTIAL; fallback controls tested |

Evidence: [command receipts](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/validation/delivery-results.json), [layout](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/layout-delivery/checks.json), [hub](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/offline-path/1280-hub.png), [battle](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/offline-path/1024-battle.png), [screens](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/meta/checks.json), [performance](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/validation/performance-summary.json), [lifecycle](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/lifecycle-delivery/measurement.json), [pixel hashes](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/isolation/pixels.json).

REFERENCE: docs/cardrpg/index.html; reports/cardrpg/offline-path/; reports/cardrpg/offline-commands/; reports/cardrpg/fallback/check.json.

## Systems and fairness

A researched 34 games with 53 sources, ran 3,600 grid battles and 1,600 holdout battles, and simulated 90 accounts over 30 days with 9,000 economy battles. Starter Auto wins in the fresh-seed holdout are 61.75%/61%; active proxy wins are 84.75%/87%. Casual/regular/heavy draws per week are 12.65/22.84/23.80, with a maximum weekly heavy/casual progress ratio of 2.3631. Three zero-draw paths reach Golden Maneki design eligibility. These are proxy/local simulations, not human behavior or retention evidence.

All banners cost 150 earned stamps. Base common/rare/epic/legendary odds are 60/30/9/1% for cats and 55/34/10/1% for equipment; soft pity starts at 41 and hard legendary pity at 60. Exact conditional odds are published. There is no purchase path and no random tradeable NFT. Relic eligibility is deterministic and marked **design only, not minted**, on Avalanche Fuji 43113. Supply checks are local design logic, not on-chain enforcement. No fungible token, mainnet, server grant, migration, contract edit, deployment or merge to main.

Evidence: [A audit](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/docs/design/cardrpg/evidence/audit.json), [balance](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/docs/design/cardrpg/BALANCE.md), [economy](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/docs/design/cardrpg/evidence/economy-final.json), [zero-draw runs](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/docs/design/cardrpg/evidence/economy-no-draws.json), [design](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/docs/design/cardrpg/DESIGN.md), [source safety](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/validation/safety-delivery.json).

## Validation and retained failures

The integrated source passes 2,937 package tests plus 11 root Node tests, 421 inherited E2E tests, typecheck, lint and production build. All 96 local Foundry tests passed against unchanged contracts. The inherited two expected failures and eleven skips remain explicit. All 76 A-owned changed files match A's frozen head. The final file journey, commands and fallback checks observe no network/storage/page errors.

REFERENCE: docs/cardrpg/index.html; reports/cardrpg/validation/test-delivery.log; reports/cardrpg/validation/e2e-delivery.log; reports/cardrpg/validation/contracts-final.log; reports/cardrpg/offline-path/check.json; reports/cardrpg/offline-commands/check.json; reports/cardrpg/fallback/check.json.

Failures are retained, including the Deno import fixed by A, an E2E/build collision, an inherited fake-clock race, the old losing tutorial seed, preview-context leaks and blocked embedded texture blobs. Browser profiles then located repeated context/shader creation at wave/loot/rest changes. The battlefield and four preview contexts now survive the run and release on exit.

Retina exposed another issue: the empty round row changed the canvas height by 9px almost every round. Fixed row heights and unchanged-size guards keep one framebuffer. Gear-resource retention removed preview shader eviction; VFX preparation now matches actual battlefield fog and both direct/HDR outputs. The failed 13-task and later 56/62/68 ms trials remain historical. Final source-bound measurements determine the result. Requested quality remains Medium. Effective quality changes from Medium to Low at 53.41 seconds of page time; one drawing-buffer size is retained.

Evidence: [transition diagnosis](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/transition-diagnostic/), [preview diagnosis](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/lifecycle-diagnostic/), [Retina resize evidence](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/retina-resize-boxes/), [remaining shader failure](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/retina-resources-trial/), [corrected profile](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/retina-spell-output-trial/), [final Retina campaign](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/lifecycle-retina-delivery/measurement.json). Performance is RAF/CDP timing on one M3 Pro, not GPU timestamps or a broad device guarantee.


Additional cadence diagnosis: an instrumented full natural Retina repetition retains Medium and records frame p95/p99 16.7/16.8 ms, render CPU p99 4.5 ms and sampled GPU p99 2.701 ms with zero disjoint timer events. CPU render duration excludes other browser work, and GPU queries exclude browser composition. This repetition does not reproduce or explain the prior intermittent 33.3 ms tail; it is diagnostic evidence, not a replacement pass. No speculative rendering change follows it.

Evidence: [additional CPU/GPU samples](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/retina-cadence-diagnostic/summary.json), [reproduction and limits](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/retina-cadence-diagnostic/README.md).

REFERENCE: docs/cardrpg/index.html; reports/cardrpg/lifecycle-retina-delivery/measurement.json; reports/cardrpg/retina-cadence-diagnostic/.

## Delivery and remaining gaps

B draft stack: #310, #311, #315, #312, #313, #314 and [#322](https://github.com/ntbaoheyhey/taskbar-hero/pull/322). A draft stack: #316–#321. [integration #323](https://github.com/ntbaoheyhey/taskbar-hero/pull/323) combines them. [Read-back statuses](https://github.com/ntbaoheyhey/taskbar-hero/blob/7ff71ff69bd271c554ec4f407e1cb7fefbef8099/reports/cardrpg/validation/delivery-stack.json) confirm draft/open/unmerged. Ledger reports live on `ai/codex-ui-ledger`.

1. Art remains procedural transform-node miniature art; twelve cats share three independent kits, and some effects remain visually close or quiet.
2. Only chapter one is playable; progress resets by design, and balance/retention lack human playtest evidence.
3. Live Avalanche integration and authoritative scarcity are absent. Strict frame-time targets and software smoothness also remain partial as quantified above.

Four separate self-reviews list weaknesses and fixes; they are not independent judging. No user decision is needed to open the prototype. The next useful review is whether the visible layout, motion and overall direction meet the user's expectations before authorizing more content or infrastructure.

REFERENCE: docs/cardrpg/index.html; docs/cardrpg/FRESH-EYES.md; docs/design/cardrpg/FRESH-EYES.md; docs/design/cardrpg/DESIGN.md.

## Complete lifecycle and final visual correction

The final visual pass found internal party-card clipping at all three sizes (9/15/10px) despite valid outer bounds. The compact card now reserves status height and normalizes icon line height; nine final layout cases assert both outer bounds and actual scroll/client heights.

A natural-playback audit then exposed 198/194ms stalls entering loot/rest, with a profile repeat of208/209ms. Shader compilation in newly created miniature-preview contexts dominated the profile. A per-run four-slot pool now retains warmed 3D previews across loadout, loot, rest and the equipment picker, suspends detached previews, and disposes all contexts on leaving the run. No 3D equipment preview was replaced by a static image. The final result is 3 complete natural x4 campaigns, all nine loot/rest pairs and three equipment-picker visits: 0 long tasks, zero errors/warnings, five contexts throughout each run. These broad windows supplement the individual cast/next-wave samples; prior narrow passes did not prove this lifecycle property.

Evidence: [full lifecycle receipt](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/lifecycle-delivery/measurement.json), [profile](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/lifecycle-diagnostic/profile.json), [pool](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/apps/web/src/game/squad/turn3d/PreviewPool.tsx), [final layout](https://github.com/ntbaoheyhey/taskbar-hero/blob/df39d16eced7f0ca0e349d3d44a86cf98531db34/reports/cardrpg/layout-delivery/checks.json). The source/test receipts are pinned to the built runtime; historical artifact944a20ac and its checks remain under earlier-trials/pre-party-height.

REFERENCE: docs/cardrpg/index.html; reports/cardrpg/lifecycle-delivery/measurement.json; reports/cardrpg/earlier-trials/pre-party-height/; reports/cardrpg/layout-delivery/checks.json.
