# Remaining startup hitch
REFERENCE: CHECKPOINT.md; HITCHES.md; trace-attribution.json; 1280x720-dpr1-cpu4.json; apps/web/src/game/squad/turn3d/scene.ts

The accepted integrated artifact still misses the100ms whole-page and post-interactive gates. The worst cold sample is116.7ms at2623.3ms after navigation, between hub interaction2305.1ms and scene readiness10321.5ms. All post-ready frames in this sample are≤16.8ms. The seven-case sample does not bound the larger860-case matrix.

The aligned main-thread trace has a110.3ms `ProxyMain::BeginMainFrame` task and a69.8ms event dispatch overlapping this interval. Statistical CPU samples include19.7ms in `resizeToHost` called during scene construction and10.4ms in a renderer constructor helper. Earlier startup also has53.6ms layout and56.6ms script evaluation overlapping a116.6ms interval. These durations overlap and must not be added. Image-decode work and context disposal produce additional50–83ms intervals below the100ms gate.

Next experiment: separate renderer construction, initial target sizing and first material/texture preparation into independently yielded loading stages; compare an implementation that reuses the home renderer during the transition into battle. First prove whether initial resize/target allocation or the host transition dominates, with the same trace offsets. Reusing the home host requires coordination with Lane A's app/companion lifecycle. Image decoding and startup layout remain separate costs. This is a proposed measured experiment, not a claim that a particular edit will meet100ms.

The accepted source and both pinned artifacts stay unchanged for the current matrix. A later renderer candidate needs its own artifact hash, fresh page/CPU4 profiles, full matrix and lifecycle regression checks. Successful evidence collection does not promote this artifact to an all-gates pass.
