# B2b · Biscuit, Inkcap, Cinnamon
REFERENCE: tools/cardrpg-big2/{motion-measure,effect-measure,measure}.mjs; assets/provenance/cardrpg-big2-motion-batch2.json

Biscuit now uses a rolling pin and bread procession, Inkcap uses paper decoys and a mushroom canopy, and Cinnamon uses spice and serving-bell effects. Each has four authored action clips, five compositions, distinct eye proportions and an original prop. No rules or economy changes.

## Rendered proof
REFERENCE: motion/variety.json; effects/uniqueness.json; before/captures.json; filmstrips

- 36 actual GLB motion clips, including the earlier nine-cat coverage: 630 pair comparisons; all 198 required same-cat/same-slot comparisons pass angular RMS 0.10 radians and position RMS 0.012 body heights.
- 61 rendered effect compositions; all 1,830 grayscale silhouette/edge pairs pass. Zero face-mask, empty-effect, overdraw or runtime errors. These are difference checks, not perceptual grades.
- Twelve before/after motion strips cover the new cats. Viewed all three ultimate strips: Cinnamon's bell silhouette reads clearly; Biscuit has a distinct forward step, but its target impact leaves the caster crop; Inkcap's dark face is crowded behind allies and its canopy is outside the caster crop. Full-stage recordings are queued for final review.
- Tiers: Biscuit **improved**, Inkcap **improved**, Cinnamon **improved**. None is promoted to slice quality solely because the matrices pass.

## Cold hitch table
REFERENCE: cold/summary.json; cold/*-trace.json.gz

Seven fresh-page Metal cases use immutable HTML SHA256 `d4cec177bac587a8607b27b66e288fe486b9689d858ff6825feb0261648dfada`, real entry clicks and page-open traces. Every raw RAF array is retained. This sample does not replace the queued 150-case matrix covering every new action/passive across ten configurations.

| Configuration | Page MAX ms | Post-interactive MAX ms | p95 ms | >50 ms frames | Errors |
|---|---:|---:|---:|---:|---:|
| 1280×720 DPR1 CPU1 | 16.8 | 16.8 | 16.8 | 0 | 0 |
| 1280×720 DPR2 CPU1 | 16.8 | 16.8 | 16.7 | 0 | 0 |
| 1440×900 DPR1 CPU1 | 16.8 | 16.8 | 16.7 | 0 | 0 |
| 1440×900 DPR2 CPU1 | 16.8 | 16.8 | 16.7 | 0 | 0 |
| 1280×720 DPR1 CPU4 | 100.0 | 66.8 | 16.8 | 4 | 0 |
| 1280×720 DPR2 CPU4 | 116.7 | 99.9 | 16.8 | 4 | 0 |
| 2560×1440 DPR1 CPU1 | 16.8 | 16.8 | 16.8 | 0 | 0 |

Whole-page 100 ms gate misses at CPU4 DPR2 (116.7 ms). All seven post-interactive samples stay ≤99.9 ms and p95 ≤16.8 ms; these are sample bounds. First/repeat cast maxima await the separate matrix.

## Validation and source identity
REFERENCE: ../../validation/b2b-pinned.json; ../../validation/b2b-pinned-retry.json; ../../validation/batch2-e2e.json; ../../validation/pinned-source-audit.json

Archived source `cd3b3009` matches all 946 application/rules/asset hashes in its build receipt. The unpublished stack was later rebased without runtime changes. Typecheck, lint and build pass. Full unit rerun: 1,684 web, 903 rules plus two expected failures and 11 skips, 581 Supabase, 32 chain, 24 auth, 16 API-contract tests pass. Exact-source E2E: 421 passed.
The first archived unit run hit a 5,000 ms timeout in the inherited StageLayout test. Its failed log remains; the unchanged archive passed the full rerun. No timeout or assertion was relaxed.
