# B2 opponents · Yarn Giant, Rain Spool and Pantry Crown
REFERENCE: apps/web/src/game/squad/turn3d/card-boss-{motion,effects,performance}.ts

Yarn Giant, Rain Spool, Pantry Crown each have dedicated basic/signature performances. All retain the **improved** tier.

## Rendered evidence
REFERENCE: before/captures.json; filmstrips; motion/variety.json; effects/uniqueness.json; VISUAL-REVIEW.md

Six actual GLB clips pass all15 motion comparisons. Cumulative86 effects pass3,655 grayscale comparisons. Face-mask, overdraw, empty-effect and runtime offender counts are zero. The viewed strips retain pale flat effects and familiar toy proportions.

Six introduction/phase strips cover1.14s introductions and300ms phase gestures. Three reduced-motion comparisons are stable. These are fixed-time presentation fixtures. Natural fight videos remain in the accepted-review plan.

## Timing sample
REFERENCE: cold/summary.json; cold/*-trace.json.gz

| Configuration | Page MAX ms | Post-interactive MAX ms | p95 ms |
|---|---:|---:|---:|

|1280×720 DPR1 CPU1|33.4|33.4|16.8|

|1280×720 DPR2 CPU1|33.4|33.4|16.8|

|1440×900 DPR1 CPU1|33.3|33.3|16.7|

|1440×900 DPR2 CPU1|50.0|50.0|16.8|

|1280×720 DPR1 CPU4|133.3|116.6|16.8|

|1280×720 DPR2 CPU4|133.3|133.3|16.8|

|2560×1440 DPR1 CPU1|33.4|33.4|16.8|


Whole-page native/CPU4 MAX50.0/133.3ms. Post-interactive MAX133.3ms. The100ms page and post-interactive gates both miss. The six-action, ten-configuration first/repeat matrix is running separately.

## Validation and artifact
REFERENCE: ../../validation/boss-source.json; ../../validation/boss-e2e-retry-receipt.json; ../../validation/pinned-source-audit.json

Typecheck, lint and build pass. Web tests1696, rules935 plus2 expected failures and11 skips, Supabase581, chain32, auth24 andAPI-contract16 pass. 421 distinct E2E tests pass across the original run and focused retries. Original failed logs remain.

Archived source`fa9683e24197de400b1dbdd1d61070a29f818a43`. HTML SHA256`8c21bc006c0737f566f48df06d46c5497a69979b08871b966c65cc7841f70246`. Source and HTML receipts identify the measured bytes.
