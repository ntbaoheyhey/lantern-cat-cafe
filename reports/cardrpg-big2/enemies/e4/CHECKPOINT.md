# B2 enemies · Crumb Sentinel checkpoint
REFERENCE: apps/web/src/game/squad/turn3d/card-enemy-batch4-{motion,effects}.ts; card-enemy-adornment.ts

Crumb Sentinel gains separate sugar-pinch and sugar-burst performances. Existing rules are unchanged. Tier: **improved**.

## Rendered evidence
REFERENCE: before/captures.json; filmstrips; motion/variety.json; effects/uniqueness.json; VISUAL-REVIEW.md

Two before/after action strips; two actual GLB clips and the required pair pass. Cumulative82 effects /3,321 grayscale pairs pass; zero face-mask, overdraw, empty-effect or runtime offenders. Viewed both native strips: the gestures and shapes differ, but small body movement, slight facial detail and flat bright effects remain. Crops omit distant impacts and cut HP plates; they do not assess full-stage clipping.

## Timing sample
REFERENCE: cold/summary.json; cold/*-trace.json.gz

| Configuration | Page MAX ms | Post-interactive MAX ms | p95 ms | Errors |
|---|---:|---:|---:|---:|
| 1280×720 DPR1 CPU1 | 33.3 | 33.3 | 16.7 | 0 |
| 1280×720 DPR2 CPU1 | 33.3 | 33.3 | 16.7 | 0 |
| 1440×900 DPR1 CPU1 | 33.3 | 33.3 | 16.7 | 0 |
| 1440×900 DPR2 CPU1 | 33.3 | 33.3 | 16.8 | 0 |
| 1280×720 DPR1 CPU4 | 133.3 | 100.0 | 16.8 | 0 |
| 1280×720 DPR2 CPU4 | 133.2 | 100.0 | 16.8 | 0 |
| 2560×1440 DPR1 CPU1 | 16.8 | 16.8 | 16.7 | 0 |

Seven cold cases: native MAX33.3ms, CPU4 MAX133.3ms; post-interactive MAX100ms and CPU4p95 16.8ms. Whole-page100ms gate **MISS**. The two-action, ten-configuration first/repeat cast matrix remains separately queued.

## Validation and artifact
REFERENCE: ../../validation/e4-source.json; ../../validation/e4-e2e.json; ../../validation/pinned-source-audit.json

Typecheck/lint/build PASS;1,694 web /935 rules tests(+2 expected failures,11 skips),581 Supabase/32chain/24auth/16API-contract;421 archived-source E2E pass. Runtime and asset bytes match archived source`a5abedfa4b3514e9d8a66e6cf7e477576c706bab`. HTML SHA256`3b5dbe3d2f5e8e631e9c459df7f2db8cdb03fe6208c19ffe3dd4ceb2c1d14927`. Predecessor E3 retry/captures must finish before this stacked draft is published. No merge or deploy.
