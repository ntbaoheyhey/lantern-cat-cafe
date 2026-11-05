# Evidence map

All checks use local processes, not model-calling helpers. Final runtime: a3d257cdd1eb1dc2e38d21fafab5bd41fdf725a1; artifact SHA-256: 4534b9951e2b4f27c44b55e1a8131800a4caad0bf976d4bc2c4c9b842a302772. Each final receipt names that artifact; earlier candidates are historical. The final candidate combines Session A's rules and Session B's presentation. No live server writes, grants, contract changes or deployments were performed.

- `baseline/`: 1,296 original file/dev screenshots at the three desktop sizes, per-recipe first/second cast RAF/CDP traces, original capture records. Baseline measured 258 trials with zero observed tasks above 50ms; perceived stutter from the user's session is not disproved by this sampled run.
- `performance/`: unsuccessful intermediate candidate; two long tasks from first-use model setup. Kept to show the regression that prompted model warmup.
- `performance-warmed-frozen/`: earlier frozen post-warmup candidate; 258 trials, zero observed long tasks, aggregate RAF p95 16.7ms/p99 16.8ms.
- `performance-final/`: historical integrated development first/second cast trial (three long tasks). Not the final production gate.
- `performance-production/`: production source dffc30e1 before the retained-scene fix. All 258 casts have zero long tasks, but each of nine wave transitions has a 66–74ms task.
- `transition-diagnostic/`: CPU profiles establishing shader/context recreation during wave entry.
- `transition-retained-trial/`: exploratory 1024-only retained-scene trial with zero tasks; not substituted for final three-size validation.
- `performance-delivery/`: final hash-bound production cast and wave-entry measurements on measured runtime a3d257cd. Inspect raw cadence and every per-case tail.
- `performance-software-delivery/`: separate software Low sample, not a Metal performance result.
- `art/`: 215 full-stage five-beat captures and 215 isolated-spell readbacks, exact recipe assertions, immediate-repeat checks, two separate perceptual hash measures and contact sheets. Whole-scene similarity is intentionally disclosed.
- `earlier-trials/`: earlier measurements, historical stale meta captures, the dffc30e1 artifact-bound checks, and failed/corrected capture metadata. Intermediate redundant PNG sets remain in the local B worktree; all final and baseline captures are packaged here.
- `layout/`: historical nine integrated patrol/six-enemy/boss cases, model bounds, actual DOM label bounds, height budgets, resting yaw and page-viewport checks.
- `isolation/`: matched prior-polish and candidate screenshots at all three sizes, fetched-resource/startup size observations and exact zero-pixel-difference result.
- `offline-path/`: actual controls from hub to equipment, earned invitation, three waves, boss, settlement, enhancement and codex; no network/storage/page errors. The presenter alone is accelerated. Tutorial seed 2 is selected and disclosed; no win-rate claim.
- `offline-commands/`: all three viewports, real commands for team, leveling, ascension, equip, lock, reforge, salvage, crafting, quests, service/day, hard pity; keyboard/focus/reduced motion, atomic rejection and reload reset.
- `fallback/`: missing/lost WebGL continues through DOM targeting, reduced motion disables camera/shake/flash, and denied audio fails gracefully.
- `validation/`: complete command logs including failed runs, successful retests, provenance hashes and zero-match numbered-round terminology grep. Empty grep output means no matches, not an absent run.

REFERENCE: docs/cardrpg/index.html; docs/cardrpg/build.json; tools/cardrpg-demo/; reports/cardrpg/offline-path/check.json; reports/cardrpg/offline-commands/check.json

- `layout-delivery/`: final nine patrol/six-enemy/boss audits, including each party card's internal content height, projected model bounds, label intersections and resting facing.
- `lifecycle-delivery/`: three full natural x4 campaigns at the three desktop sizes. Measurement covers every loot/rest entry, an equipment picker and actual boss victory, with no skip or injected controller ticks.
- `performance-retina-delivery/`: all43 recipes at native DPR2, cold/warm, all three viewports (258 trials); Medium bloom is the initial Retina quality, High remains selectable.
- `lifecycle-retina-delivery/`: additional natural1440×900 DPR2 full campaign.
- `preview-lifetime/`: five independent start/picker/exit cycles; context creation and explicit release counts.
- `cadence-control/`: five seconds of RAF on an empty page per viewport; diagnostic only, not a relaxed game threshold.
- `retina-diagnostic/`: controlled High/Medium/offscreen-MSAA/drawing-buffer comparisons. The drawing-buffer change was rejected.
- `earlier-trials/pre-retina-default/`: complete prior016ba419 artifact and its evidence, superseded by the measured native-Retina default correction.
- `validation/delivery-manifest.json`: lossless per-file bytes/SHA-256 for the complete packaged artifact/evidence; no failed trial is dropped. `verify-delivery.py` verifies retained observations without rerunning the browser.

REFERENCE: docs/cardrpg/index.html; docs/cardrpg/build.json; tools/cardrpg-demo/verify-delivery.py; tools/cardrpg-demo/evidence-metadata.py; reports/cardrpg/validation/performance-summary.json.

- Final Retina diagnostics preserve the failed changing-framebuffer trials, retained-gear/output trials, and the corrected actual-fog shader warmup. They are diagnostic history, not substitutes for the artifact-bound final casts and full campaign.
- validation/provenance-before-vfx-refresh.json preserves the outdated VFX source checksum found by the packaging audit; the final provenance receipt validates the refreshed code hash and all unchanged model/portrait bytes. The refreshed procedural manifest is audit metadata only and is not imported by the runtime/build.

REFERENCE: reports/cardrpg/retina-resize-boxes/; reports/cardrpg/retina-resources-trial/; reports/cardrpg/retina-spell-output-trial/; reports/cardrpg/validation/provenance.json; assets/cardrpg/procedural-manifest.json.

- Final complete cast grids contain 258 DPR1 and 258 DPR2 rows, all zero long tasks; strict p95 misses are 60 and 79 respectively. All 24 command receipts exit zero; this is not a strict cadence/art pass.
- Final art has 215 exact requested beats, no missing/overlapping labels, 204 exact immediate repeats, isolated signature minimum 219 bits and 23 whole-stage close pairs.
- `retina-cadence-diagnostic/`: additional CPU/GPU-instrumented full campaign, zero disjoint timer events. Medium retained, render CPU/GPU p99 4.5/2.701 ms. It does not explain or replace the final uninstrumented 33.3 ms frame-tail observation.

REFERENCE: docs/cardrpg/index.html; reports/cardrpg/validation/performance-summary.json; reports/cardrpg/retina-cadence-diagnostic/README.md; reports/cardrpg/art/effect-captures.json.
