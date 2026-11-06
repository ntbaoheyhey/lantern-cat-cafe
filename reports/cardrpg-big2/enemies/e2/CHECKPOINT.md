# B2 enemies · second batch checkpoint
REFERENCE: apps/web/src/game/squad/turn3d/card-enemy-batch2-{motion,effects}.ts; card-enemy-adornment.ts

Needle Moth, Teacup Healer and Kettle Knight have six dedicated basic/signature actions and original needle, cup and kettle compositions. Existing rules are unchanged. Tier: **improved**.

## Rendered evidence
REFERENCE: before/captures.json; filmstrips; motion/variety.json; effects/uniqueness.json

Six before/after action strips; six actual GLB clips and all15 required motion pairs pass. Cumulative78 effects /3,003 grayscale pairs pass; no face-mask, overdraw, empty-effect or runtime offenders. Viewed all three signature strips: the wing opening, careful pour and kettle brace read, but small poses and cream-white effects still flatten the image. Crops omit distant impacts and sometimes cut HP plates; this is not a full-stage clipping assessment. Full-stage recordings remain required; metric uniqueness does not establish slice quality.

## Timing sample
REFERENCE: cold/summary.json; cold/*-trace.json.gz

| Configuration | Page MAX ms | Post-interactive MAX ms | p95 ms | Errors |
|---|---:|---:|---:|---:|
| 1280×720 DPR1 CPU1 | 16.8 | 16.8 | 16.7 | 0 |
| 1280×720 DPR2 CPU1 | 33.3 | 33.3 | 16.7 | 0 |
| 1440×900 DPR1 CPU1 | 33.3 | 33.3 | 16.8 | 0 |
| 1440×900 DPR2 CPU1 | 33.4 | 33.4 | 16.7 | 0 |
| 1280×720 DPR1 CPU4 | 133.3 | 100.0 | 16.8 | 0 |
| 1280×720 DPR2 CPU4 | 116.7 | 100.0 | 16.8 | 0 |
| 2560×1440 DPR1 CPU1 | 33.3 | 33.3 | 16.8 | 0 |

Seven cold cases: native MAX33.4ms, CPU4 MAX133.3ms; post-interactive MAX100ms and CPU4p95 16.8ms. Whole-page100ms gate **MISS**. The six-action, ten-configuration first/repeat cast matrix is queued separately; this sample does not certify it.

## Validation and artifact
REFERENCE: ../../validation/e2-source.json; ../../validation/e2-e2e.json; ../../validation/pinned-source-audit.json

Typecheck/lint/build PASS;1,694 web /935 rules tests(+2 expected failures,11 skips),581 Supabase/32chain/24auth/16API-contract;421 archived-source E2E pass. Runtime and asset bytes match archived source303d60df18d0b7e06929afca3701604541586441. HTML SHA256`12a51d5cac2dfe473bffac12329178e5f54c615b47ff1ae72fb5af8b6003cc18`. No merge or deploy.
