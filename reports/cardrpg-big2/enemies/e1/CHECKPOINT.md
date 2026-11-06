# B2 enemies · first batch checkpoint
REFERENCE: apps/web/src/game/squad/turn3d/card-enemy-batch1-{motion,effects}.ts; card-enemy-adornment.ts

Button Guard, Sock Skipper and Spool Ram have six dedicated basic/signature clips, distinctive original accessories and effect compositions. Tier: **improved**, not slice. Existing enemy rules and turn timing are unchanged.

## Rendered evidence
REFERENCE: before/captures.json; filmstrips; motion/variety.json; effects/uniqueness.json

- Six before/after action strips; six rig clips and all15 required pair comparisons pass. Cumulative76 effects /2,850 grayscale pairs pass; zero face-mask, overdraw or runtime offenders.
- Viewed all three signature strips. Button Guard’s button bracing and Sock Skipper’s hop/pocket cues read, but the rear Sock remains small. Spool Ram’s crank/crouch has clearer body motion. Bright cream/white effects still look flat and caster crops omit distant target impacts; full-stage recordings remain required.
- No claim of a new silhouette sculpt or perceptual uniqueness follows from the trajectory/pixel thresholds. The original failed source checks remain alongside corrected receipts.

## Timing sample
REFERENCE: cold/summary.json; cold/*-trace.json.gz

| Configuration | Page MAX ms | Post-interactive MAX ms | p95 ms | Errors |
|---|---:|---:|---:|---:|
| 1280×720 DPR1 CPU1 | 33.4 | 33.4 | 16.7 | 0 |
| 1280×720 DPR2 CPU1 | 33.4 | 33.4 | 16.7 | 0 |
| 1440×900 DPR1 CPU1 | 33.4 | 33.4 | 16.7 | 0 |
| 1440×900 DPR2 CPU1 | 33.3 | 33.3 | 16.8 | 0 |
| 1280×720 DPR1 CPU4 | 116.7 | 99.9 | 16.8 | 0 |
| 1280×720 DPR2 CPU4 | 116.7 | 100.0 | 16.8 | 0 |
| 2560×1440 DPR1 CPU1 | 16.8 | 16.8 | 16.8 | 0 |

Seven cold cases: native MAX33.4ms, CPU4 MAX116.7ms; post-interactive MAX100ms and CPU4p95 16.8ms. Whole-page100ms gate **MISS**. The six-action, ten-configuration first/repeat cast matrix is queued separately; the cold sample does not certify it.

## Validation and artifact
REFERENCE: ../../validation/e1-fixed.json; ../../validation/e1-types-fixed.json; ../../validation/e1-e2e.json; ../../validation/pinned-source-audit.json

Typecheck/lint/build PASS;1,694 web /935 rules tests(+2 expected failures,11 skips),581 Supabase/32chain/24auth/16API-contract;421 archived-source E2E pass. Initial regression failures are retained; the fix preserves the published Button tap name and legacy guardAttack fallback. Runtime/asset bytes match archived sourcec86122ad. HTML SHA256`ca797d87a29beb0a4ffc8b89535d2c22f686e88927efcc8533e07c5f04e19b40`. No merge or deploy.
