# B3 · stage, contacts and native image evidence
REFERENCE: apps/web/src/game/squad/turn3d/card-stage.ts; stage-life.ts; SHARPNESS-REVIEW.md; tools/cardrpg-big2/stage-measurements.mjs

Three merged prop groups, twelve drifting instances and chapter-specific light/fog grades add depth. Ground contacts now sit at world height0.044, above rug embroidery0.0425; previously they were0.01872–0.02054, below it. This fixes placement, but the visible contact remains subtle. The three chapters still share a broad tabletop composition.

## Image and camera limits
REFERENCE: SHARPNESS-REVIEW.md; sharpness-metrics.json; sharpness/checks.json; layout/measurements.json; life/checks.json

- Only2/10 cumulative sharpness targets pass, both inherited skill icons. Eight misses remain. Face-crop edge variance improves10.71%/8.27% versus B2c, but remains below F0. Different crop composition is explicitly disclosed.
- Six native backing-target/resize checks pass. DPR1/2 targets match,4×MSAA and1024² felt maps with anisotropy16/mipmaps are present; DPR3 is deliberately capped at2. Zero runtime/external-request errors.
- 405 camera samples,135 each for A/B/C: no clipping, HUD overlap, face occlusion or missing plates. Worst facing55° plus numerical epsilon. Full-body bands21.56–50.89% /19.37–45.73% /17.36–40.97% all miss24–30%. A also misses8% horizontal margin at6.19%; B/C pass10.64%/14.73%. These are motion/accessory stress bounds, not idle-only body measurements.
- Peak230draws/95,774triangles in camera fixtures stays below250/150k. Twelve before/after stage/home screenshots across three sizes/chapters; reduced-motion ambient matrix differences are exactly zero.

## Cold opening samples
REFERENCE: cold/summary.json; cold/*-trace.json.gz

| Configuration | Whole-page MAX ms | Post-interactive MAX ms | p95 ms | Errors |
|---|---:|---:|---:|---:|
| 1280×720 DPR1 CPU1 | 16.8 | 16.8 | 16.8 | 0 |
| 1280×720 DPR2 CPU1 | 16.8 | 16.8 | 16.7 | 0 |
| 1440×900 DPR1 CPU1 | 16.8 | 16.8 | 16.7 | 0 |
| 1440×900 DPR2 CPU1 | 33.3 | 33.3 | 16.7 | 0 |
| 1280×720 DPR1 CPU4 | 100.0 | 100.0 | 16.8 | 0 |
| 1280×720 DPR2 CPU4 | 116.6 | 83.3 | 16.8 | 0 |
| 2560×1440 DPR1 CPU1 | 33.4 | 33.4 | 16.7 | 0 |

Whole-page116.6ms CPU4 misses100ms. Post-interactive100.0ms and CPU4p9516.8ms pass these seven samples only. Native interaction873.5–927.7ms / battle-ready6.946–6.990s; CPU4 interaction1.740–1.741s / battle-ready9.130–9.163s. Final full-roster cast matrix remains required.

## Lifecycle and validation
REFERENCE: lifecycle/summary.json; navigation/checks.json; ../validation/b3-source.json; ../validation/b3-e2e.json; source-audit.json

Twenty natural replays retain1,093,980bytes more heap, within the declared2MiB tolerance, with geometry/texture/program growth0/0/0. Twenty navigation cycles produce zero runtime errors. Typecheck/lint/build pass;1,686web /903rules tests(+2expected failures,11skips),581Supabase,32chain,24auth,16API-contract;421archived-source E2E pass.

Pinned B3 HTML SHA256`faa8671172a5e0611666868972348e55105cb0c004ddea12d915a6d57d3a9769`. Source identity is checked against the archived commit. The first crop attempt failed on a removed home-image selector; its log is retained. The own capture tool now records the actual card portrait without editing Lane A’s inspector. No artistic pass is inferred from valid renderer settings.
