# B2 opponents · Binding Thread, Practice Cushion and Pollen Scout
REFERENCE: apps/web/src/game/squad/turn3d/card-enemy-batch3-{motion,effects}.ts

Binding Thread, Practice Cushion, Pollen Scout each have dedicated basic/signature performances. All retain the **improved** tier.

## Rendered evidence
REFERENCE: before/captures.json; filmstrips; motion/variety.json; effects/uniqueness.json; VISUAL-REVIEW.md

Six actual GLB clips pass all15 motion comparisons. Cumulative80 effects pass3,160 grayscale comparisons. Face-mask, overdraw, empty-effect and runtime offender counts are zero. The viewed strips retain pale flat effects and familiar toy proportions.

## Timing sample
REFERENCE: cold/summary.json; cold/*-trace.json.gz

| Configuration | Page MAX ms | Post-interactive MAX ms | p95 ms |
|---|---:|---:|---:|

|1280×720 DPR1 CPU1|33.4|16.8|16.7|

|1280×720 DPR2 CPU1|16.8|16.8|16.8|

|1440×900 DPR1 CPU1|16.8|16.8|16.8|

|1440×900 DPR2 CPU1|33.3|33.3|16.7|

|1280×720 DPR1 CPU4|100.1|100.1|16.8|

|1280×720 DPR2 CPU4|116.6|100.0|16.8|

|2560×1440 DPR1 CPU1|16.8|16.8|16.7|


Whole-page native/CPU4 MAX33.4/116.6ms. Post-interactive MAX100.1ms. The100ms page and post-interactive gates both miss. The six-action, ten-configuration first/repeat matrix is running separately.

## Validation and artifact
REFERENCE: ../../validation/e3-source.json; ../../validation/e3-e2e-retry-receipt.json; ../../validation/pinned-source-audit.json

Typecheck, lint and build pass. Web tests1694, rules935 plus2 expected failures and11 skips, Supabase581, chain32, auth24 andAPI-contract16 pass. 420 distinct E2E tests pass. One expired-session test remains unresolved after external-font ECONNRESET and a later web-server startup timeout. A focused retry is pending. Original failed logs remain.

Archived source`1f41cf7170c0995b3e00d928a3381a78a2763040`. HTML SHA256`99b68a554f57e16396aea67dd5324e4c17c2f6253d3d5ea1a7ac05f7f01c5c7a`. Source and HTML receipts identify the measured bytes.
