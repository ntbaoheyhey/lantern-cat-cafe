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
