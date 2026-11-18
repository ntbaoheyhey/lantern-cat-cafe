# V7 V-F: reduced-motion victory rendering — scoped READY

Native `VictoryCrew.tsx` now requests a draw when actors arrive, the container changes size, the OS motion preference changes, or WebGL recovers. Reduced scenes stop redundant frames; normal animation continues. Application commit `96d1e75c38e3a8d03dc7ea76efc2adcb7210175d` and regression tests in `6d94a279d` are scoped READY for CXI. Twelve tests, full web typecheck, matched-delivery and lifecycle pixel checks, and the untransformed production validation pass. Independent judge integration remains pending.

The following chronology preserves the original failures and investigation. Its blocked decisions are historical; the current decision is above and the final native gate is below.

Source: `53f8c4a17419ab9c7f4f8126bc74b05dea778871`, empty runtime patch `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`. Baseline module SHA256 `82f0b3350de27b80f92f4016ddccd2544ade8de50471131d20848b96211729a6`; candidate `d1d4c5606fe5f24cf2a095ae59cfa8b267b5af5fe2eb8aaed5479e414f15b479`. Both artifacts have3764files; every file and five production-tool snapshots were reverified. Non-script assets are identical. Local ports6311/6312 use `/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`,1280×720. These are isolated local artifacts, not independent judge acceptance.

The study began21:35:42Z; its minimum gate21:50:42Z elapsed before the decision work. EN/ZH primary sources and experiments are recorded in `/Users/bao/taskbar-hero-mailbox/LEARN/CXV-static-victory-render-v7-20261117.md`.

## Completed checks

- Browser-only prototype: nine crew RGB pairs exact, including resize, context restoration, OS preference switches and three frozen normal poses. Delayed actor loads and unmount with pending loads pass; zero browser errors. Four measured1024×576 sheets reviewed once: actors, faces, HUD, receipt and Next control remain clear.
- Full semantic TypeScript check substitutes only the exact preserved candidate in the compiler host:4676files, zero diagnostics. No application source mutation.
- First production series21:41:51–21:56:40Z: six alternating trials,32s for each normal/reduced preference at1×/4×; all trial behavior checks pass. No screenshots during measured windows. Normal draws stay approximately7680 WebGL calls per window; reduced candidate draws/uploads stay0 after settling.

| Preference | Stress | Baseline median task elapsed | Candidate median task elapsed |
|---|---:|---:|---:|
| Reduced |1×|4199.76ms|102.25ms|
| Reduced |4×|5737.15ms|176.98ms|
| Normal |1×|5362.24ms|6110.24ms|
| Normal |4×|7614.02ms|7612.10ms|

CDP default `timeTicks` measures elapsed task/script duration, not exclusive CPU. The original normal1× median is13.95%higher and requires investigation. A reversed, normal-first six-trial control captures `ThreadTime`, `ProcessTime` and RAF cadence from the same artifacts. Its first attempt failed a harness selector: one confetti container was incorrectly compared with32particles. The failed attempt remains preserved; the corrected fresh run completed22:11:50Z. The control does not reproduce the initial increase:1× median task elapsed6283.14→4603.66ms,threadCPU6366.48→4680.65ms;4× task7703.69→7633.08ms,threadCPU26314.83→26293.30ms. RAFp95 stays16.7–16.8ms with no callbacks above50ms. Direction varies across series and ranges overlap; no normal-speedup or proven-cause claim. Four-times throttling is host-relative and is not calibrated laptop equivalence; whole-thread CPU includes all renderer-thread work in that environment.

## Pixel discrepancy retained

Two of six candidate reduced captures, both4×, have a second PNG/RGB result. Crew differences affect15384pixels,maxRGB6/255,mean0.06387/255. Full-viewport differences affect182269pixels across the result panel,max12/255,mean0.10949/255. Ten of the twelve reduced full frames are exact. Two production sheets and one difference sheet were measured and reviewed once; no changed pose/position, missing hero or readability problem was observed. This visual review does not erase the failed exact-pixel comparison.

A separate production diagnostic22:00:22–22:01:44Z found four identical WebGL RGBA buffers (first complete crew and size-restored, baseline/candidate) and five exact paired CSS composition probes. It did not reproduce the discrepancy. A conservative2px expanded actor-alpha mask places14582of15384changed crew pixels outside the actor area;802are near/inside. This does not establish a root cause. Comparing original full-viewport and later element captures confirms the difference is not solely element cropping.

The unchanged-baseline RAF freeze/resume probe completed22:14:06Z. All five full-frame and crew captures are RGB-exact to the original baseline, including both32s freezes and2s resumes. Its measured1024×576 sheet was inspected once at2026-11-17T22:17:38.373129+00:00: four heroes, title, receipt, HUD and Next remain clear. Late RAF idleness did not reproduce the discrepant variant. Early loading/composition is a separate untested hypothesis.

The early-lifecycle diagnostic completed six trials at2026-11-17T22:23:57.101Z. The unchanged continuously rendering baseline reproduced the original discrepant candidate full-frame and crew RGB hashes exactly in one trial; the other five settled trials, including both early-frozen baseline and both naturally idle candidate trials, matched the original baseline. Computed styles/geometry normalize identically and settled compositor-reason signatures match. Both early-frozen baselines stop at4draws and retain baseline pixels after resuming. The measured1024×576 sheet was reviewed once: four heroes, title, receipt, HUD and Next remain clear. This narrows attribution but does not establish the browser raster/compositor cause.

The six fresh unchanged-baseline32s captures finished2026-11-17T22:27:57.503Z. Every full-frame and crew image exactly matches the original baseline. The measured1024×576 sheet was reviewed once; all four heroes, title, receipt, HUD and Next remain clear. The discrepant variant was not reproduced without the earlier diagnostics.

Historical decision before decoder attribution: BLOCKED-ON unresolved full-page pixel attribution. Preserve the exact original failures and both baseline series; do not widen tolerance or claim a proven compositor cause. No application change or READY. The native harness is prepared (native mode adds audit instrumentation only; lifecycle/blocked-request gates and elapsed-time naming are explicit), but is not run. Continue the separate startup-stall investigation under the two-failed-attempt rule.

## Evidence

- `V7-F-victory-demand-prototype.json`, `V7-F-victory-demand-types.json`, `V7-F-victory-demand-production.json`.
- `V7-F-victory-composite-diagnostic.json`, `V7-F-victory-capture-consistency.json`, `V7-F-victory-idle-composition.json`, `V7-F-victory-normal-control.json`, `V7-F-victory-early-composition.json`, `V7-F-victory-unmodified-baseline.json`.
- Raw source snapshots, artifacts, films and diagnostics remain under `/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/films/`, directories prefixed `V7-F-victory-`.
- Do not reopen the four prototype sheets, two first-series production sheets or the discrepancy sheet already reviewed.

## Background delivery diagnostics 2026-11-17T23:52:28.909684+00:00

All 18 baseline/native pairs are RGB-exact; 36 frames measured and three fresh 1024x576 sheets reviewed once. Four heroes, title, receipt, HUD and Next remain clear. The restored-HTTP C variant persists after one-second settling in both artifacts. None of three dwebp-output probes reproduces original B; original failures remain unexplained. No application edit, tolerance change or READY. RestoredHTTP C is RGB91dcc7d54e434e28, distinct from original failure B9030c0a75fafc212; C changes240311pixels/max37 from A. These diagnostics establish background delivery sensitivity in both builds, not actual decoder-path attribution or the cause of B. Evidence: V7-F-victory-background-attribution.json, V7-F-victory-background-blob.json, V7-F-victory-background-decode.json.

## Delivery attribution and native gate 2026-11-18T00:44:34.185865+00:00

The original A/B full-page hashes are now reproduced exactly by complete versus delayed delivery of the same465026-byte WebP. Target-linked traces show YUV for complete input and RGB for incremental input. The original182269-pixel/max12 difference is preserved and explained; no tolerance changed. Four alternating scheduler trials compare exact fullviewport pixels under both decode paths:24cross-trial checks pass. Native scheduling was applied after the new15-minute study gate;12tests and fullweb typecheck pass. Native captures and production validation remain required. See V7-F-image-delivery-decode.json, V7-F-image-delivery-decode-repeat.json and V7-F-victory-delivery-matrix.json. The first two diagnostics retain their terminal failure caused by fixture-blocked Google Fonts CSS; the matrix declares that block explicitly in advance.

## Native production gate 2026-11-18T00:52:28.000344+00:00

Untransformed source96d1e75c3, empty runtime patch, envDir=false, indexb507c31b: four32s runs pass with zero browser errors or blocked requests. Reduced1x/4x have0WebGL draws and0uploads; normal has7680GL calls in each window. These are GL calls, not frames. Reduced full RGB is exact across rates. Whole-page task elapsed is107.524/206.355ms reduced and5622.248/7496.393ms normal; no new causal speedup or physical-laptop claim. Four frames measured before one1024x576 sheet review: all heroes, title, receipt, HUD and Next remain clear. Native matched-delivery8 and lifecycle9 comparisons plus12tests/TSC0 remain passing. The lifecycle raw font-block failure is preserved; the production network gate has zero blocks. See V7-F-victory-native-production.json and V7-F-victory-scheduling-checks.json.
