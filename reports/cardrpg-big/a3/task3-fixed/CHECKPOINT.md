# A3 task 3 — first-viewport actions and complete portraits
REFERENCE: ../../memory/PROMPT-A3.md; functional.json; layout-comparison.json; ../../validation/a3-task3-fixed.json

Collection moves Level up beside the selected companion; Team places Begin beside team power; Equipment places Equip above the workbench. Invitations puts its featured card first, followed by concise earned-cost information. Prepare folds the difficulty explanation; Result enlarges its MVP card. Automatic battle and economy rules are unchanged.
Main SHA256 `32a727afc547520fa65eb8dccf4453d1a78b8d5b3403f5a78d91d265f3c3a06d`, **26,120,329 bytes**, runtime source `830f64f8`. [1024 before/after](layout-1024.png) · [1280 before/after](layout-1280.png).

| Screen / main action | Y before → after,1024 | Y before → after,1280 |
|---|---|---|
| collection | 1484.6 → 355.1 | 1491.6 → 377.5 |
| invitations | 599.0 → 435.6 | 606.0 → 458.5 |
| team | 1546.6 → 193.5 | 1627.0 → 213.1 |
| equipment | 1137.5 → 309.9 | 1027.8 → 325.8 |
| prepare | 189.3 → 183.3 | 203.6 → 197.6 |
| result | 189.3 → 183.3 | 203.6 → 197.6 |

All27 sampled screens at1024×600,1280×720,1440×900 pass first-viewport/action/portrait and horizontal-overflow checks. The three whole Team cards fit after Best team; at1024 their bottom is588.53px. Targeted1024 meta group passes all13 captures.
Scope: Collection checks the grid portrait; Equipment checks its enlarged heading portrait. Their separate interactive 3D previews extend below the first viewport at short heights. Full-roster crown/art acceptance is not established by these L1 samples.
Contrast:2,631 visible text rectangles,0active failures,min5.589:1;9disabled controls recorded separately. Measured atDPR1 against text-masked screenshots; not a complete accessibility audit. Task1 holds the3sizes×DPR1/2 portrait receipts.
Before images belong to87305a07; after images belong to32a727af. Both12-image contact sheets were visually inspected as1050×2048 previews of1200×2340 sheets; this is sampled layout evidence, not universal art acceptance.

Fresh five gates pass: typecheck, lint, build,1,735web/1,020rules(+2expectedfail/11skip),421E2E. All ten functional groups pass with exactly204 screenshots on this hash; [saved-receipt/source audit](audit.json) verifies1,248 source inputs,198 asset inputs,91 L1 copies and five gate-log hashes. No page errors, remote requests or tested overflow failures. No860matrix run by A.
Earlier failed diagnostics are preserved: stale invitation-copy assertion; one unchanged V2 idle-clock E2E timeout (isolated and whole-suite retries passed); missing temporary Python in gallery (targeted retry passed). A first pack was stopped after six groups on a real2.53px Team-card overflow; its partial receipts remain in ../task3-full. The14px spacing correction retains145px portraits and adds an all-card assertion. No earlier receipt is relabeled as current.
Default24MB size limit remains missed; [artifact-specific32MB exception](size-exception.json) records26,120,329bytes and the two before/after sheets. Historical startup/cold/art/balance limits and B requests remain in the short report.

Current invitation CPU4 capture diagnostic: MAX183.4ms, p95 16.8ms,17 frames>25ms and7>50ms; the100ms ceiling remains missed. Mechanics lab four configurations: MAX16.8ms,238 draw calls/108,680 triangles. Neither is a new controlled cold/cast acceptance.
