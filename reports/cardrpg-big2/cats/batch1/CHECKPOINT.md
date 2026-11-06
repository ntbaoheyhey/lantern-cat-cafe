# B2a · Panko, Mallow, Sorrel
REFERENCE: tools/cardrpg-big2/{motion-measure,effect-measure,measure}.mjs; assets/provenance/cardrpg-big2-motion-batch1.json

The three cats now have four authored action clips and five effect compositions each. Panko uses utensils and an oven-door frame; Mallow uses piped sugar and whisks; Sorrel pours and shares a teapot. `playEntrance(catId)` and reduced-motion support are available to Lane A. No rules or economy changes.

## Rendered proof
REFERENCE: motion/variety.json; effects/uniqueness.json; before/captures.json; filmstrips

- 24 actual GLB motion clips, including starter regressions; all required same-cat and same-slot pairs pass angular RMS 0.10 radians and position RMS 0.012 body heights. Full 276-pair matrix retained.
- 46 rendered effect compositions; all 1,035 grayscale silhouette/edge pairs pass. Zero face-mask, empty-effect, overdraw or runtime errors. These tests establish measured differences, not perceptual quality.
- Eight-frame before/after strips for each new skill are in `before/` and `filmstrips/`. Viewed the three ultimate strips: distinct oven, whisk and teapot silhouettes; Mallow remains relatively small/dark, and Sorrel's group framing is crowded. Tier: **improved**, not slice-certified.

## Cold hitch table
REFERENCE: cold/summary.json; cold/*-trace.json.gz

All seven cases use immutable HTML SHA256 `8bda8f8561d3f9e3108f6d84688bc130164f3d08b404f44104e49c933ca49981`, Metal, fresh contexts, page-open tracing and real clicks. This cold sample is not the separate per-skill ten-configuration matrix, which remains queued. Every raw RAF array and profile is retained.

| Configuration | Page MAX ms | Post-interactive MAX ms | p95 ms | >50 ms frames | Errors |
|---|---:|---:|---:|---:|---:|
| 1280×720 DPR1 CPU1 | 33.2 | 16.8 | 16.8 | 0 | 0 |
| 1280×720 DPR2 CPU1 | 33.4 | 33.3 | 16.8 | 0 | 0 |
| 1440×900 DPR1 CPU1 | 16.8 | 16.8 | 16.7 | 0 | 0 |
| 1440×900 DPR2 CPU1 | 16.8 | 16.8 | 16.7 | 0 | 0 |
| 1280×720 DPR1 CPU4 | 116.6 | 83.4 | 16.8 | 5 | 0 |
| 1280×720 DPR2 CPU4 | 100.1 | 83.4 | 16.8 | 4 | 0 |
| 2560×1440 DPR1 CPU1 | 33.4 | 16.8 | 16.7 | 0 | 0 |

Whole-page 100 ms gate misses at CPU4 (116.6 and 100.1 ms); p95 passes. Do not infer cast maxima from this cold run. Final full-roster timing and per-batch first/repeat matrices remain pending.

## Validation and source identity
REFERENCE: ../../validation/b2a-source.json; ../../validation/batch1-e2e.json; /tmp/cardrpg-big2-batch1-validation.json

Source `3198ed64`: typecheck, lint, build pass; 1,684 web tests, 903 rules tests plus two expected failures and 11 skips; 581 Supabase, 32 chain, 24 auth and 16 API-contract tests pass. Archived exact-source E2E: 421 passed. Existing shared passive-preview change was applied by Lane A and imported as `29b32479`, not silently edited here.
