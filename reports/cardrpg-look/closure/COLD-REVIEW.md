# Closure cold-run review

Artifact `7e092b1a18b2a4af1dcdcc51e6a24f38bc5e674580d2ecddca33c3de306aff34`; all seven raw frame arrays recomputed and hash-bound in cold-audit.json.

|Configuration|Full page max|After ready max|After ready frames ≤20ms|Final tier|
|---|---:|---:|---:|---|
|1280x720-dpr1-cpu1|533.3ms|250.1ms|97.76%|medium|
|1280x720-dpr2-cpu1|666.6ms|383.4ms|97.29%|medium|
|1440x900-dpr1-cpu1|283.4ms|283.4ms|97.82%|medium|
|1440x900-dpr2-cpu1|383.2ms|383.2ms|97.13%|medium|
|1280x720-dpr1-cpu4|249.9ms|249.9ms|97.55%|medium|
|1280x720-dpr2-cpu4|533.3ms|383.4ms|97.65%|medium|
|2560x1440-dpr1-cpu1|400.0ms|400.0ms|96.37%|medium|

Full-page cold harness includes naturally animated combat. Post-ready gaps are retained separately from targeted cast windows. The harness leaves game quality selection unchanged and records the final tier, not per-frame tier; these are not fixed-High samples. Overlapping long-frame/trace events are inclusive and do not establish the expensive source operation or exclusive-machine conditions.

The first1280/DPR1/native trace places the533.3ms gap before scene-ready: a542.557ms renderer TimerFire includes538.840ms CommandBufferProxyImpl::WaitForToken, overlapping538.725ms GPU WebGL work. The250.1ms post-ready gap overlaps274.735ms CALayerTreeCoordinator::ApplyBackpressure inside the macOS GPU presentation path. These inclusive durations overlap and must not be added. They identify GPU waits/presentation backpressure, not a particular shader, source change, driver defect or external program.

Registered Clover1 ABBA is complete, with unchanged viewport/tier/harness and both first/repeat windows retained. First/repeat maxima in order: old 83.3/16.8 ms, current 50.0/183.4 ms, current 16.8/16.8 ms, old 99.9/16.8 ms. Both artifacts show stalls. The current repeat 183.4 ms and two current coverage misses remain failures; the one clean observation does not cancel them. Four samples cannot establish a causal improvement, regression or exclusive-device conditions. Current paired page peak 699.9 ms is a wider interval, separate from those cast maxima. Further optimization requires targeted GPU command/presentation profiling under verified machine isolation. Raw receipts and the pre-registered order are in paired-cast/.

These observations do not replace the four historical L7 cast failures or imply that all natural battle frames meet the cast-gallery budgets. No failed sample was discarded or rerun for this review. The first streaming parser rejected the final trace footer; diagnosis-attempts/trace-parser-1.log retains that helper failure. Only the parser was corrected; no browser observation was repeated.


The comparison collector initially expected a nonexistent `completed` field; this harness records `ended`. All four browser observations had already finished successfully. The retained log is diagnosis-attempts/paired-summary-schema-1.log. Only the collector/auditor schema check was corrected (valid end timestamp, exact case/cardinality, both casts, artifact hashes and empty errors); `--audit-only` consumed the same files without running another browser.
