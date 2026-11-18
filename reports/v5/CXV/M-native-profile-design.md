# Native living profiles — Batch M
UTC 2026-11-18T05:37:16.736340+00:00; same native-rig study gate as Mallow, passed05:19:53Z. Original art/rig JSON/weights remain immutable.
Eight profiles use a10s periodic family,3breaths percycle, independent long blinks, matching facial offsets and additive1s cast. The250/550ms clip cues are retimed to actual rules contact by the existing scene.

| Cat | Authored character | Head X/Y %H | Neck px | Prop gain | Cast X/Y/right-arm gains | Minimum triangle ratio |
|---|---|---|---|---|---|---|
| mallow | soft whisk spark | 1.637/1.905 | 3.6 | 1 | 1/1/1.000 | 0.62627 |
| sorrel | careful moonlit pour | 1.441/1.560 | 3.1 | 1.35 | 0.75/1.2/1.200 | 0.71246 |
| biscuit | steady shield brace | 1.207/1.676 | 2.5 | 0.65 | 0.9/0.55/0.300 | 0.60386 |
| inkcap | buoyant mushroom glyph | 1.793/1.785 | 4 | 1.2 | 1.12/1.05/0.517 | 0.57525 |
| cinnamon | warm measured cup | 1.480/2.013 | 3.2 | 1.15 | 0.7/1.2/0.900 | 0.66171 |
| brioche | regal night watch | 1.402/1.474 | 3 | 0.8 | 1.05/0.65/0.480 | 0.55340 |
| velvet | floating lantern invocation | 1.871/1.670 | 4.2 | 1.1 | 0.9/1.35/0.825 | 0.56399 |
| marigold | gentle first-leaf offering | 1.676/2.124 | 3.7 | 1.4 | 0.8/1.1/1.100 | 0.67081 |

All16normal/reduced CPU cases: feet0, meshseam0, exactidle/cast endpoints0, originaldata unchanged. Idle301samples; cast61phases×12independentidleclocks, preserving original triangle orientation. CPU shader/drawing imports are stubbed; browser and art gates remain pending for seven cats.
First profile trial failed the>.5 area-ratio gate for Biscuit(.111), Inkcap(.211), Brioche(.373). Diagnosis isolated right-arm triangles aroundcast.3–.4; reduced only their right-arm cast bend, also giving Velvet more margin. No weight edits and no weaker acceptance threshold. Expanded phase grid passed, minimum.5534.
60 focused tests in4files passed; TSC0. Soot3833paths rehashed unchanged; capture-arrival.mjs unchanged. Existing Mallow native/visual evidence remains separate; new seven need their own actualscene capture and per-cat review.
Sources and prior experiment: /Users/bao/taskbar-hero-mailbox/LEARN/CXV-living-cats-v8-20261118.md. These gains are authored design choices calibrated with native geometry, not recovered Live2D parameter values.
