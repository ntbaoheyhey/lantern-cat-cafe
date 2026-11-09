# Full-run repair log (append-only)

## B-M1-001 2026-11-09T03:27:58.369393+00:00 M1 CPU4 cold S2
Inherited V3 sample483.4ms; first-ready timer486ms nested GPUWait172ms. Repro: existing probe-cold.mjs on V3 sha44dd8f2ecea0.
Hypotheses: giant effect/prewarm batch; synchronous texture/program compilation; driver scheduling stall. Cheapest discriminator: per-group performance measures + existing retained trace.
Fix pending; attempts0. Gate CPU4cold<=220ms/3runs;ready<=V01+300ms;firstreactioncast<=16.8ms. Why missed: prior cold harness aggregated the full preparation callback.

## B-M1-002 2026-11-09T03:27:58.369393+00:00 M1 target text collisions S3
V3 collision checks omit floating numbers; inherited row-result labels visibly crowd status/reaction text.
Repro: P5-P14 fixed cue windows at1024/1280/1440. Hypotheses: independent number/callout placement; large secondary text; all simultaneous words.
Fix pending; attempts0. Extend probe to every displayed frame and floating numbers, then one reserved target lane.
