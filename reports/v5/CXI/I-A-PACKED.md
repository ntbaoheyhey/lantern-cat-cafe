# Packed bounds — independent CXI acceptance

The candidate application is `7ed0ce4f06d93251a4f44a7bd2a9884e8b4df37e`, integrating CXV `6f71118f1`. Accept the guarded packed-float bounds evaluation as a bounded CPU optimization. Full release validation remains required; startup and general frame-rate stress are still open.

The fast path is restricted to ordinary non-normalized, non-interleaved Float32/Float64 attributes with three components. Other formats retain getters; left-to-right accumulation stays exact. The earlier pipeline passed61focused tests including51oracles, build/typecheck,130production bounds/root/GPU comparisons,910motion fingerprints and130separate GPU outputs. Two own current-build boss captures passed a once-only1024px review at the exact1280×720 judge URL.

An independent source experiment used the exact m1.10 and candidate modules on current production actor roots.65bounds at five authored poses matched.45alternating warmed4×CPU blocks per fixture gave median paired ratios0.715wave3 and0.689boss; median block times17.1→12.3ms and19.4→14.0ms. This isolates bounds evaluation and excludes construction, GPU completion and frame scheduling.

Ordinary paired runs remain mixed: median CPU4.1→4.0ms normal and19.5→18.6ms4×; framep95 stays16.8/50ms. Startup CPU maxima worsen47.6→50.4ms and167.3→173.4ms;4×long frames37→38 and maximum interval200.1→216.7ms. These observations are retained, not treated as a solved stress target. The separate profiled run has zero errors but sampling changes timings; canvas reads/texture uploads appear in startup and do not prove the cause of the paired difference.

Evidence: `evidence/v7-packed-acceptance.json`, `evidence/v7-packed-image-review.json`; raw runs under ignored `work/v5/CXI/{performance,contour-equivalence,drawing-equivalence}`. No AGS audio or AGV texture candidate is included. The native callout review rejects size-only claims; all36cue ends fit but native timing/gain/listening and wiring remain unresolved.
