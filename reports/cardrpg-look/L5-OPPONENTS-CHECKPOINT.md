# L5 opponents — local review checkpoint

Source c5048bee; committed phase artifact1171b9ec. All13 selected opponents have at least two personally viewed authoring rounds, exact rest-rig compatibility and48-frame turntables; six angles per turntable were reviewed. Fresh phase action captures are still running. Phase gates, timings and publication are pending.

The design separates button, sock, spool, wing, cup, biscuit, cushion and pantry silhouettes. Yarn and glaze materials are more apparent than the inherited flat surfaces; the hostile/readable-at-distance goal remains uneven. Round eyes and rounded bodies still look friendly, especially Yarn Giant. All13 remain **improved**, not look-slice.

| Batch | Unit | Triangles | Rig targets | Selected round | Before/after and metrics | Turntable |
|---|---|---:|---:|---:|---|---|
|1|button-guard|7774|13|3|[round](rounds/opponents/button-guard/round-3/comparison.png) / [metrics](rounds/opponents/button-guard/round-3/metrics.json)|[6 angles](turntables/l5/button-guard/six-angle-sheet.png)|
|1|sock-skipper|7784|13|5|[round](rounds/opponents/sock-skipper/round-5/comparison.png) / [metrics](rounds/opponents/sock-skipper/round-5/metrics.json)|[6 angles](turntables/l5-corrections/sock-skipper/six-angle-sheet.png)|
|1|spool-ram|7770|13|3|[round](rounds/opponents/spool-ram/round-3/comparison.png) / [metrics](rounds/opponents/spool-ram/round-3/metrics.json)|[6 angles](turntables/l5/spool-ram/six-angle-sheet.png)|
|2|needle-moth|7784|15|2|[round](rounds/opponents/needle-moth/round-2/comparison.png) / [metrics](rounds/opponents/needle-moth/round-2/metrics.json)|[6 angles](turntables/l5/needle-moth/six-angle-sheet.png)|
|2|teacup-healer|7783|13|2|[round](rounds/opponents/teacup-healer/round-2/comparison.png) / [metrics](rounds/opponents/teacup-healer/round-2/metrics.json)|[6 angles](turntables/l5/teacup-healer/six-angle-sheet.png)|
|2|crumb-sentinel|7790|14|3|[round](rounds/opponents/crumb-sentinel/round-3/comparison.png) / [metrics](rounds/opponents/crumb-sentinel/round-3/metrics.json)|[6 angles](turntables/l5/crumb-sentinel/six-angle-sheet.png)|
|3|pollen-scout|7780|16|2|[round](rounds/opponents/pollen-scout/round-2/comparison.png) / [metrics](rounds/opponents/pollen-scout/round-2/metrics.json)|[6 angles](turntables/l5-opponents/pollen-scout/six-angle-sheet.png)|
|3|rain-spool|7756|14|4|[round](rounds/opponents/rain-spool/round-4/comparison.png) / [metrics](rounds/opponents/rain-spool/round-4/metrics.json)|[6 angles](turntables/l5-corrections/rain-spool/six-angle-sheet.png)|
|3|binding-thread|7778|13|2|[round](rounds/opponents/binding-thread/round-2/comparison.png) / [metrics](rounds/opponents/binding-thread/round-2/metrics.json)|[6 angles](turntables/l5-opponents/binding-thread/six-angle-sheet.png)|
|4|practice-cushion|7786|13|2|[round](rounds/opponents/practice-cushion/round-2/comparison.png) / [metrics](rounds/opponents/practice-cushion/round-2/metrics.json)|[6 angles](turntables/l5-opponents/practice-cushion/six-angle-sheet.png)|
|Bosses|yarn-giant|19762|17|4|[round](rounds/opponents/yarn-giant/round-4/comparison.png) / [metrics](rounds/opponents/yarn-giant/round-4/metrics.json)|[6 angles](turntables/l5-opponents/yarn-giant/six-angle-sheet.png)|
|Bosses|kettle-knight|11884|13|2|[round](rounds/opponents/kettle-knight/round-2/comparison.png) / [metrics](rounds/opponents/kettle-knight/round-2/metrics.json)|[6 angles](turntables/l5-opponents/kettle-knight/six-angle-sheet.png)|
|Bosses|pantry-crown|19548|18|3|[round](rounds/opponents/pantry-crown/round-3/comparison.png) / [metrics](rounds/opponents/pantry-crown/round-3/metrics.json)|[6 angles](turntables/l5-opponents/pantry-crown/six-angle-sheet.png)|

All exact raw/packed/export/turntable hashes and review paths are in validation/l5/selection.json. Packing preserves the selected geometry and uses512px colour/256px detail WebPq80 textures; studio comparisons and compression receipts are kept per batch. Source-resolution GLBs remain under assets/cardrpg-look/models for portraits and authoring.

Known limits from reviewed static rounds: raised eye rims, radial highlights on disks, simple rear surfaces, rigid limbs and simplified steam/wing details. Sock toe, Rain spool flange, Crumb body, Yarn arm attachment and Pantry tie revisions retain their rejected originals. Pilot motion/framing corrections do not substitute for the fresh committed phase samples.

Read validation/l5/phase-opponent-poses/REVIEW.md after the ongoing personal review is complete; only that document can establish which fresh poses were viewed. Discrete frames cannot prove continuous collision freedom. Full-roster peak rendering/lifecycle remain L7 work.

## Completed L5 phase validation

The earlier pending notes above describe the retained pilot stage. Source `c5048bee` / artifact `1171b9ec` now passed the independent L5 evidence audit. Typecheck/lint/unit/build passed; E2E: 420 passed initially;1 unchanged-source focused retry passed. Not one clean421-case run. All 22 units have fresh phase poses, stills, exact rig audits and reviewed turntables. The 24 slice cast windows peaked at 16.8 ms; cold-open maximum was 133.3 ms. Startup parity delta is +93 bytes, and HTML is 31,367,423 bytes (24 MB miss, documented 32 MB allowance). See [L5 checkpoint](L5-CHECKPOINT.md) and [report](CARDRPG-LOOK-REPORT.md) for measured misses and remaining L7 work.
