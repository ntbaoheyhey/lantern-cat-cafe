# R-9 prompt integrity receipt — 2026-11-10T17:43:05.816261+00:00

`wc -c reports/cardrpg-look/art-rebuild/PROMPT.txt`: 24774 bytes
`shasum -a 256 reports/cardrpg-look/art-rebuild/PROMPT.txt`: 57f6e9ac2db941235c94746f73d1e4e2d25eaf6d06dd9ebbe420d2e4bc9bef03
Exact current attachment copied byte for byte; older prompts/addenda remain preserved.

# Lane B current state

Onboarded 2026-11-10T16:19:01.983778+00:00. HEAD456934fba, existing branch retained.
Native generation is retired for the roster; original source/receipts preserved. No active native runner or stale lease.
Typecheck/lint/seven touched web tests PASS. No new mesh accepted.
188GiB free. Evidence previously ~97MiB; cap120MB.

## Pre-existing uncommitted work (preserved; not part of onboarding commit)

```text
 M apps/web/src/game/squad/turn3d/look-readable-enemies.test.ts
 M apps/web/src/game/squad/turn3d/look-readable-enemies.ts
 M assets/provenance/look.md
 M reports/cardrpg-look/art-rebuild/FIXLOG.md
 M reports/cardrpg-look/art-rebuild/QUEUE.md
 M reports/cardrpg-look/art-rebuild/r2/local-queue.json
 M tools/cardrpg-look/art-rebuild/configs/clover.json
 M tools/cardrpg-look/art-rebuild/configs/yarn-giant.json
?? assets/cardrpg-look/v3-generated/clover.glb
?? assets/cardrpg-look/v3-generated/yarn-giant.glb
?? docs/cardrpg-look/v5-art-mochi-preview.html
?? reports/cardrpg-look/art-rebuild/r2/native-clover/
?? reports/cardrpg-look/art-rebuild/r2/native-panko/
?? reports/cardrpg-look/art-rebuild/r2/native-yarn/material-motion1/
?? reports/cardrpg-look/art-rebuild/r2/native-yarn/material-motion2/
?? reports/cardrpg-look/art-rebuild/r2/native-yarn/material1-build.json
?? reports/cardrpg-look/art-rebuild/r2/native-yarn/material1-faces.json
?? reports/cardrpg-look/art-rebuild/r2/native-yarn/material1/
?? reports/cardrpg-look/art-rebuild/r2/native-yarn/material2-build.json
?? reports/cardrpg-look/art-rebuild/r2/native-yarn/material2-casts/
?? reports/cardrpg-look/art-rebuild/r2/native-yarn/material2-faces.json
?? reports/cardrpg-look/art-rebuild/r2/native-yarn/material2/
?? reports/cardrpg-look/art-rebuild/r2/native-yarn/outward1-pipeline.json
?? reports/cardrpg-look/art-rebuild/r2/native-yarn/outward1-receipt.json
?? reports/cardrpg-look/art-rebuild/r2/native-yarn/runtime-review.json
?? reports/cardrpg-look/art-rebuild/r2/outward1/
?? tools/cardrpg-look/art-rebuild/__pycache__/
?? tools/cardrpg-look/art-rebuild/segmentation-proxy.mjs
```

Unreviewed Clover/Yarn GLBs stay uncommitted. Existing preview HTML and segmentation proxy are unrelated retained work.
Native batch output folders include Panko/Mallow/Cinnamon/Velvet/Biscuit; do not restart inference.
Current instructions and active progress: PROMPT.txt, QUEUE.md, HANDOFF.md.

## Resume 2026-11-10T17:39:56.755618+00:00
HEAD equals fetched origin at 443edb96d. P1–P5 done; P6 final49+6 casts and33tests completed in previous session; visual acceptance remains. No native runner/lease; ports5920/5922 owned by saved Python static servers. Disk151GiB free.
Full current dirty inventory saved in RESUME-DIRTY-2026-11-10.txt; all changes retained, unreviewed GLBs excluded.

## Resume 2026-11-10T17:43:05.816261+00:00
HEAD equals fetched origin at 443edb96d5f50a1be05cf57c03e1d3d389effd28. P1–P5 done; P6 final49+6cast audit and33tests reused, visual review pending. No native runner; current servers50023/5920 and92836/5922. Disk151GiB free. Full dirty inventory RESUME-DIRTY-2026-11-11.txt; no work discarded.

## Resume 2026-11-10T18:07:15.616549+00:00
HEAD matches origin 494d2041bd66de863788de224596493a9f7ce573. P1–P6 remain complete. P7 baseline6screens/0errors already saved; final job not yet started. P8 export25units/60skills complete. No native runner;150GiB free. Dirty inventory RESUME-DIRTY-P7.txt retained. A6 owns timing.lock; queue B final validation without interrupting A6.

## Resume 2026-11-10T18:28:04.499869+00:00
HEAD equals fetched origin cd301f3af27779f96ae5eb59bfa645e00bbd50d6. P7 saved6screens/5casts/19tests/parityPASS; films now present, inspect before any new capture. No native runner; servers5920/5922 preserved,148GiB free. Dirty inventory RESUME-DIRTY-P7-FINAL.txt; no work discarded.

## Resume 2026-11-10T18:51:22.048419+00:00
HEAD matches fetched origin e83b9e2a1a7b25a8d68c34439ed1eb177359ca6c. P1–P9 done; P10 corrected85.5s films9/6catultimates complete, review remains. P12/P13 saved21tests/parity/budget and visual evidence available, unaccepted. No native runner or live B heavy job;147GiB free. Preserved dirty inventory RESUME-DIRTY-P10.txt.

## Resume 2026-11-10T19:14:06.320699+00:00
HEAD equals fetched origin ba680a44c124ba6713cba82ad26f9f098139af42. P15 attempt1 wrapper84507 still queued; no native runner,145GiB free. Saved normal film and P1–P9/P12/P13 gates remain complete. Dirty inventory RESUME-DIRTY-P15.txt; native changes/GLBs preserved and excluded.

## Resume 2026-11-10T19:41:03.237172+00:00
HEAD matches fetched origin4815b7f3b. P10/P14 combined wrapper96380 still waiting, no native runner; servers5920/5922 retained,145GiB free. Dirty inventory RESUME-DIRTY-P10-P14.txt. No prior work repeated or discarded.

## Resume 2026-11-10T20:01:11.470499+00:00
HEAD matches origin fc4284033d64cb334142054d15906477afcb2782. P10 terminal-loading candidate rejected; visible-result capture fix already present, distinct retry next. P14 saved16views/8casts/19tests/parity/budget passed, visual review pending. No native runner; servers5920/5922 retained;143GiB free. Dirty inventory RESUME-DIRTY-P10-RESULT.txt.

## Resume 2026-11-10T20:20:13.846689+00:00
HEAD equals fetched origin 272a328935c799b6bea77c4ec6c8f2faa2ec4ded. P1–P16 accepted; P17 attempt1 saved16views/8casts/23tests/parity/budgetPASS, visualacceptance pending. No native runner; servers50023/5920 and92836/5922 retained;142GiB free. Dirty inventory RESUME-DIRTY-P17.txt; no work discarded.

## Resume 2026-11-10T20:38:55.010222+00:00
HEAD equals fetched origin e88d971754522b58034b35a589597b76b2023cb0. P19 attempt1 completed and lease released; 16pairedviews/12casts/25tests/parity/budgetPASS retained. No native runner; static servers50023/5920 and92836/5922 retained;142GiB free. Dirty inventory RESUME-DIRTY-P19.txt; no completed work repeated or discarded.

## Resume 2026-11-10T20:55:15.142911+00:00
HEAD matches fetched origin db0f7bdb43db7c0f1d4065aeb1b1f534362fde61. P21 accepted/pushed and draft427 updated; stale handoff corrected. P22 prepared plan retained. No native runner or B lease; servers50023/5920 and92836/5922 retained;141GiB free. Native dirty changes/GLBs preserved and excluded; current inventory RESUME-DIRTY-P22.txt.
