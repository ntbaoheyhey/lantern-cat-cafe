# Native-eight CPU diagnostic R1
Validated 2026-11-18T06:21:50.274153+00:00; measured 2026-11-18T06:18:13.808Z through 2026-11-18T06:18:15.947Z.
Source 57ea358b52f74eea63babd458658d72024ab44bc; application diff vs a3173c08e empty. URL/runtime patch: none; offline diagnostic.
Runner SHA256 e9b1fbe2c3b64a29bc64b59c894b1df7f3534f0cf0dec957e24995f0bf688ce0; JSON SHA256 0b11fdc159fdcbcb9348999f37cf80b2c9ab316e1acee47e0a5b06e8c6c6b869.
Machine: Apple M3 Pro, arm64, Node v24.22.2.
Actual native CPU pose plus skinning; same original rig enrolled vs unenrolled, seven alternating paired blocks,120poses/block,200warmup/condition. Process CPU and elapsed wall time. Shader/drawing hooks stubbed; no GPU/browser/frame-time claim. Baseline retains original clip durations; poses intentionally differ.
32 conditions: eight cats × normal/reduced motion × idle/skill; all 14 blocks per condition present, finite, positive, paired and source/rig hashes verified.
Living median CPU range 0.028917–0.038617 ms/pose; median added CPU across conditions 0.004292 ms, maximum 0.007092 ms.
Living/legacy median CPU ratios 1.051–1.274; short microbenchmarks include process scheduling/JIT noise. Poses intentionally differ; this is no image-equivalence test.
CPU diagnostic only. Native GPU rendering, texture uploads, composition, actual gameplay and whole-frame performance remain separate gates. No optimization is adopted or FPS inferred from these measurements.
Native9 motion separately accepted by CXI06:16:45Z on production85cb62233. Full BatchM art/seam/bytes/laptop-performance acceptance remains open.
Prior60focused/TSC0 reused because application-source diff is empty. Runner node --check passes. capture-arrival.mjs hash unchanged; no Soot files or tests changed.
