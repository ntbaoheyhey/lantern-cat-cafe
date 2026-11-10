# R-9 prompt integrity receipt — 2026-11-10T16:54:23.983927+00:00

`wc -c reports/cardrpg-look/art-rebuild/PROMPT.txt`: 17807 bytes
`shasum -a 256 reports/cardrpg-look/art-rebuild/PROMPT.txt`: d89d2eba427bf0eb8d59255cf4fb9897a09081255678ffb6c4d3cf0c07e3e05c
Original prompt prefix: 15239 bytes; SHA-256 825549b5639507ca17efb64368161d805c3f4673b73d77b02916efdb1910c962.
Verified byte-for-byte against the supplied attachment; full original retained, followed by the exact R-9 addendum.
No separate saved copy of this controlling prompt was found; older superseded prompts stay preserved.

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
