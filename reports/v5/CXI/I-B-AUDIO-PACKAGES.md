# Lossless audio transport — accepted candidate

Nine immutable JSON packages carry 500 unchanged Opus files. The engine enables a package only when every member is already requested by its current preload. The source files, AGS manifests, cue choices, offsets, gains and alternate codecs remain intact. A build guard rejects stale package bytes or indexes. Packages use full SHA-256 integrity and a two-second abort; failure retries the same original Opus before the existing alternate codec.

Application ddf02f9d2; capture source 7b5e4b609 adds the ordinary-play probe and state only. Production index `6ffc6e77d8c5af4039e7772a141b46e8d9e2726fe7a2e58dff5325299a121f60`. Exact URL: http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3, desktop1280×720. Evidence: [v7-audio-packages.json](evidence/v7-audio-packages.json).

| Cold fixture | m1.7 bytes | Candidate bytes | Saving | Budget |
| --- | ---: | ---: | ---: | --- |
| wave1 | 7,909,547 | 7,697,964 | 211,583 | PASS |
| wave3 | 8,469,958 | 8,259,208 | 210,750 | FAIL by259,208 |
| boss | 7,984,401 | 7,772,449 | 211,952 | PASS |

Every ordinary transfer run had zero page/console/HTTP errors. The harness waits for visible café portraits before fixture selection and counts complete responses for requests started by readiness. Counts fell to328/338/318 requests. Expanding each package back to its original paths exactly reproduces the baseline audio request sets:485/487/484 paths, zero missing or extra. This is a total-build comparison, not a claim that gzip estimates equal shipping savings.

Native Chromium independently decoded all500 package entries and the original paths: encoded SHA-256, channel count, sample count, sample rate and every channel PCM SHA-256 matched. All500 selected source clips are mono; no stereo conversion is involved. A fresh input buffer also decoded again after the first decoder consumed it. Fault-isolated rerun recovered original Opus after valid-integrity HTTP503 in92ms, SRI rejection89ms, native decode rejection108ms and stalled package2089ms. HTTP and SRI faults intentionally produce console errors; ordinary journeys do not.

Validation: full5261 tests (77Node+5184workspace, including2961web;11skip and2expected failures),91focused audio tests, typecheck and production build pass. Full suite ran on ddf02f9d2 application code; later audit/report changes did not alter it. The first test run exposed an unnecessary await changing unpackaged scheduling; a synchronous eligibility guard fixed that regression before acceptance.

Ordinary cold guest first hit20,691ms includes17,700ms reading all eight tutorial cards; enemy HP165→119, zeroerrors. The new1024×576 first-hit sheet was measured and inspected once. No subjective listening or frame-exact A/V assertion is added; PCM identity supports unchanged decoded signals.

Latest release remains v5-m1.7 while CXV scalar review and fresh films proceed. I-B stays open until every fixture is at most8,000,000 bytes. Raw hashes, native reports and captures remain in ignored work/v5/CXI/audio-delivery/v7-audio-package-r2, transfer/v7-audio-package-r1 and first-hit/v7-audio-package-r1.
