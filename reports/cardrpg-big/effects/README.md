# F4 starter effects
REFERENCE: ../memory/PROMPT.md lines101–108, PLAN.md, ../motion/README.md

The starter slice now uses40 original pooled geometry primitives and31 compositions. These cover the12 existing starter slots, including three ultimates, eight chapter-one enemy signature intents, eight enemy basic appearances and three existing passive/equipment cues. Six existing statuses have foot-level ambient shapes. The Feel lab offers real-stage and effect-only views, quarter-speed playback and scrubbing. Three starter ultimate portraits have individual styling and a skip control.

## Measured identity and readability
REFERENCE: uniqueness.json, captures.json, features.npz, frames/, sheets/, pilot-face-bloom/

All465 pairs pass the declared0.16 grayscale distance threshold. The minimum is0.542308. The score combines silhouette, edge and temporal XOR distances over six fixed-camera frames. Every primitive/motion/anchor signature differs. Palette and numeric recipe parameters contribute zero signature credit.

The first capture found15 face/frame samples beyond the declared1% tolerance at RGB delta>8. Face-aware bloom suppression corrected those samples with the same mask and threshold. The rerun has zero face failures. The metric measures the inner80% radius of the projected protection ellipse, with raw effect-on/off images retained. Visual review remains a separate artistic assessment.

The real-camera diagnostic peaks at16 effect fragments per pixel, below the24-fragment gate. The peak active effect count is36 against the96-instance limit. Unit checks enforce eight active primitive calls, finite transforms, pooled geometry/buffers and clean construction cancellation. All124 runtime cases pass,31 compositions in four configurations. Metal High/Medium/Low and SwiftShader Low render successfully. Synthetic30ms observations exercise High→Medium→Low degradation. Real controls pass preview,0.25×, effect-only, return and ultimate skip checks.

## Layout and measured limits
REFERENCE: pilot-layout-overlap/measurements.json, layout/measurements.json, runtime/checks.json

The first1080-pose layout pass found one89.9367px² intersection between the ultimate panel and Marigold at1024×600. A three-camera pass exposed16 intersections in Close framing. A152px regular panel and120px narrow-screen panel pass all3240 poses with zero overlap, crop, prop-face occlusion or missing HP plates. Both failed pilots are retained. The tool reads the renderer's head node and retains the conservative whole-model fallback when a head is unavailable.

The other nine heroes retain their earlier effect implementation until the starter checkpoint. Element variety covers the starter themes. Dedicated appearances for the remaining heroes, enemies, bosses and gear cues are due in the extension pass. Crit flares, kill slow-motion and result readability still require the F5 flow work.

## Loading and verification
REFERENCE: ../validation/f4-final.json, performance/summary.json, PERFORMANCE.md, ../motion/PERFORMANCE.md

Stage textures yield between16-row batches. Model and effect shader uploads yield between resources. Loading progress is visible while this work runs. The first corrected five-gate run passes typecheck, lint,1661 web units,903 rules units and421 E2E cases. Rules retain2 expected failures and11 skipped tests.

Seven cold page-open runs are complete. NativeMAX33.3–50ms and CPU4MAX216.7/233.4ms improve the corresponding F3 cold runs. The CPU4 opening gate remains failed. A separate CPU4 profile recordsMAX116.6ms and identifies script compilation, scene setup and image decoding among the overlapping tasks. The720-case matrix and five offender profiles are complete. Whole-pageMAX266.7ms, first/repeat castMAX33.4/16.8ms and zero cast frames above50ms. The full matrix retains249,394 raw frames. The whole-page maximum improves from F3's566.7ms, with the CPU4 opening gate still missed.
