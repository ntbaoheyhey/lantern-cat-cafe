# V7 V-F: reduced-motion victory rendering — acceptance pending

The reduced-motion result renders the same four-cat pose every animation frame. A preserved build-time candidate requests a draw when actors arrive, the container changes size, the OS motion preference changes, or WebGL recovers. Normal animation retains continuous rendering. Application `VictoryCrew.tsx` is still unchanged; this is not READY for CXI.

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

The early-lifecycle diagnostic completed six trials at22:23:57Z. The unchanged continuously rendering baseline reproduced the original discrepant candidate full-frame and crew RGB hashes exactly in one trial; the other five settled trials, including both early-frozen baseline and both naturally idle candidate trials, matched the original baseline. Computed styles/geometry normalize identically and settled compositor-reason signatures match. Both early-frozen baselines stop at4draws and retain baseline pixels after resuming. The measured1024×576 sheet was reviewed once: four heroes, title, receipt, HUD and Next remain clear. This narrows attribution but does not establish the browser raster/compositor cause.

Next: finish six fresh unchanged-baseline32s captures without RAF/layer/early-screenshot instrumentation. Keep the exact-pixel gate open until baseline variability is independently established; no application edit or READY.

## Evidence

- `V7-F-victory-demand-prototype.json`, `V7-F-victory-demand-types.json`, `V7-F-victory-demand-production.json`.
- `V7-F-victory-composite-diagnostic.json`, `V7-F-victory-capture-consistency.json`, `V7-F-victory-idle-composition.json`, `V7-F-victory-normal-control.json`, `V7-F-victory-early-composition.json`.
- Raw source snapshots, artifacts, films and diagnostics remain under `/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/films/`, directories prefixed `V7-F-victory-`.
- Do not reopen the four prototype sheets, two first-series production sheets or the discrepancy sheet already reviewed.
