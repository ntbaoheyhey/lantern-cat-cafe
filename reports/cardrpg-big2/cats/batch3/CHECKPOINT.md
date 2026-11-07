# B2c · Brioche, Velvet, Marigold
REFERENCE: tools/cardrpg-big2/{motion-measure,effect-measure,measure}.mjs; assets/provenance/cardrpg-big2-{batch3,motion-batch3}.json

Brioche performs a constellation-apron ceremony, Velvet unfolds paper curtains, and Marigold pours a tea blossom. Each has four authored action clips, five effect compositions, an original prop and distinct eye proportions. Rules and economy are unchanged.

## Rendered proof
REFERENCE: motion/variety.json; effects/uniqueness.json; before/captures.json; filmstrips

- 48 actual GLB motion clips across all twelve cats: 1,128 pair comparisons, including 336 required same-cat/same-slot pairs. All required pairs exceed angular RMS 0.10 radians and position RMS 0.012 body heights.
- 76 rendered compositions and 2,850 grayscale silhouette/edge pairs pass; zero face-mask, empty-effect, overdraw or runtime errors. These prove difference under the declared thresholds, not artistic quality.
- Twelve before/after strips cover this batch. Viewed each ultimate: Brioche's geometric apron and Marigold's watering motif read clearly; Velvet stays small/dark in the rear row. Marigold's group effect is busy, and caster crops omit distant impacts. Full-stage recordings remain for the overall review.
- Brioche, Velvet and Marigold remain **improved**, not certified slice quality. All nine nonstarter cats now have rendered batch evidence.

## Cold hitch table
REFERENCE: cold/summary.json; cold/*-trace.json.gz

Seven fresh-page Metal scenarios use immutable HTML SHA256 `e116b0d15b267a7b27547d1a7cbe2b44e6d7173df501969094a18806570c29de`, real entry clicks and page-open traces. Every raw RAF array is retained. The separate 150-case first/repeat matrix covers every new action/passive across all ten configurations; it remains queued.

| Configuration | Page MAX ms | Post-interactive MAX ms | p95 ms | >50 ms frames | Errors |
|---|---:|---:|---:|---:|---:|
| 1280×720 DPR1 CPU1 | 16.8 | 16.8 | 16.7 | 0 | 0 |
| 1280×720 DPR2 CPU1 | 16.8 | 16.8 | 16.7 | 0 | 0 |
| 1440×900 DPR1 CPU1 | 16.8 | 16.8 | 16.7 | 0 | 0 |
| 1440×900 DPR2 CPU1 | 16.8 | 16.8 | 16.7 | 0 | 0 |
| 1280×720 DPR1 CPU4 | 133.3 | 83.3 | 16.8 | 4 | 0 |
| 1280×720 DPR2 CPU4 | 116.7 | 83.3 | 16.8 | 4 | 0 |
| 2560×1440 DPR1 CPU1 | 16.8 | 16.8 | 16.8 | 0 | 0 |

Whole-page MAX 133.3 ms at CPU4 misses 100 ms. Post-interactive MAX is 83.3 ms and p95 is 16.8 ms in these seven samples. No exhaustive cast verdict is inferred from this cold sample.

## Validation and identity
REFERENCE: ../../validation/b2c-source.json; ../../validation/batch3-e2e.json; source-audit.json

Archived source `fad4d1d6` matches all 951 application/rules/asset hashes in its build receipt. Its application/rules tree matches the reparented B2c branch exactly. Typecheck, lint, build, 1,684 web tests and 903 rules tests (+2 expected failures / 11 skips) pass. Other packages: 581 Supabase, 32 chain, 24 auth, 16 API-contract tests. The archived-source E2E run passes all 421 tests.
