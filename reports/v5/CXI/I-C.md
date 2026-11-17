# Desktop evidence — v5-m1.9
Application: 4ae1c9580f91b816f6860a79420faa4edab59a99. Capture source: 32814db72df8ae8821367831c91b19e2dd5d80f5, adding reports only. Index SHA256: a7a8c615c0998065c2406a1eecc4c1612aaf868d14757ac7e4f3d10736c9e3b9.
Judge URL: http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3. Desktop 1280×720; fresh browser, cold cache. Final captures 17 November 2026, 17:08–17:11 UTC.

- **First hit:** 21,078 ms to enemy HP 165→119, including 17,700 ms reading 59 words across eight tutorial cards at 200 words/minute. Ordinary guest controls; no fixture, saved progress, skipping or speed change. Zero console/page/HTTP errors.
- **Practice route:** detour→preparation→receipt 10,503 ms, zero errors. This quick regression omits reading; use first-hit timing for the judge.
- **Recovery:** injected rejection 714 ms; stalled download 8,664 ms. Both controls fit and return to café; explicit reload restores the route. These faults do not establish the cause of AGS's original complaint.
- **Cold bytes:** wave1 7,667,250 B PASS; wave3 8,228,520 B FAIL by 228,520 B; boss 7,742,967 B PASS, 257,033 B headroom. The harness waits for café portraits and counts complete responses for requests begun before readiness.
- **Audio transport:** 13 packages/544 unchanged Opus files; encoded and native PCM hashes match originals. Expanded audio paths match released m1.8 exactly. Four independent package failure cases recover original Opus. [Audio evidence](I-B-AUDIO-PACKAGES.md).
- **Validation:** full suite succeeds with 5,269 passed, 11 skipped and two expected failures: 5,282 total = 77 Node + 5,205 workspace, including 2,969 web. This suite covers application 4ae1c9580f91b816f6860a79420faa4edab59a99, including spatial/native/voice changes. Build includes typecheck and passes. All nine pipeline steps exit 0; its accidental self-comparison is excluded and replaced by a distinct m1.8→m1.9 comparison.
- **Rendering:** spatial weights and deferred native skinning are independently accepted. Each has 910 exact motion and 130 exact GPU comparisons. Native normal CPU median 4.9→4.3 ms, frame p95 remains 16.8 ms. At 4× CPU, median 24.6→20.1 ms and frame p95 66.7→50.1 ms, with differing action counts. Single-host measurements do not establish 60 fps. [Spatial](I-A-SPATIAL.md), [native](I-A-NATIVE.md).
- **Visuals:** accepted blink repair remains; 26 native portrait samples have zero solid/fringe overlap. Wave3 remains crowded; sampled frames do not prove every effect interval.
- **Avalanche:** receipt says local/no transaction and links the deployed Fuji items contract. Bytecode checks and the Anvil dry run do not prove a public player transaction.

[Final reproducible evidence](evidence/v7-m19-final-validation.json). Five fresh guest/route/recovery images and three fresh film sheets were measured then inspected once. Damage 46, truthful receipt text and usable recovery controls are visible.

Three 30-second films show real 1× gameplay and browser audio. [Review and films](REVIEW-VI.md). Subjective listening and frame-exact A/V synchronization remain unestablished. Historical 66–70-second timings measured a full patrol receipt, not first hit.
