# Validation history

- `test.log`: first integrated root run failed two existing backend import-map tests because the new rule type import lacked `.ts`. Session A fixed its source at 9ccf88e7; `test-final.log` passes all workspace suites.
- `web-tests.log`: isolated full-web run, 1621 passing tests.
- `e2e.log`: cancelled first attempt after its nested server build was erased by a concurrent production build; HTTP 404 was diagnosed directly. This was a validation orchestration error. No product change was made for it.
- `e2e-rerun.log`: 420/421 pass; one inherited G3 fake-clock test tries to pause in the past. Keep this failure visible alongside the focused rerun.
- `offline-path.log`: original fixed demo seed 11 loses after final rules tuning. `tutorial-seeds.json` retains all six selected replay trials; the UI now uses seed 2. `offline-path-seed2.log` passes the actual full route at all three sizes. This is demonstration reproducibility, not a random balance sample.
- `typecheck-final.log`, `lint-final.log`: integrated 0.4.0 plus Deno correction, pass.
- `provenance.json`: all 33 original asset/source hashes match the recorded manifests.
- `round-grep.txt`: empty output for `\b(speed|interval|clock)\b|\bat:` over current turn rules, turn3d and cardrpg source. Numbered rounds remain the rule scheduler; playback rate is presentation only.

- `e2e-final.log`: 421/421 after freezing the inherited G3 clock before navigation.
- `*-delivery.log` and `delivery-results.json`: final source a3d257cd / artifact 4534b995 (retained battlefield, pooled previews, fixed round-row framebuffer size, retained gear resources and matching fog/output warmup) command receipts, with exit codes and actual elapsed times. These supersede `results.json`, which intentionally retains the first failed integration run.
- `performance-summary.json`: computed from raw final cast/transition/software rows, retaining strict per-case misses.
- `safety-delivery.json`: source-identity checks against all 76 A-changed paths and runtime dependency comparisons.
- `round-audit.json`: exact source, roots, pattern and zero-match proof.
- `delivery-manifest.json`: SHA-256 and byte length of packaged evidence and the artifact (excluding the manifest itself).

- `earlier-trials/pre-party-height/`: previous textured artifact 944a20ac and all hash-bound receipts, superseded after the card height correction. Its complete tests passed but it is not the final artifact.
- `earlier-trials/pre-preview-pool/`: the intermediate layout artifact/trial; the original natural lifecycle check exposed loot/rest stalls.
- `lifecycle-diagnostic/profile.json`: CPU profile locating new-preview shader compilation; the unoptimized natural run records 208/209ms entry stalls.
- `lifecycle-delivery/measurement.json`: full natural x4 campaigns at all three sizes, including loot, rest, the equipment picker and boss. Counts actual WebGL contexts after load; no skip/tick injection.
- The build and E2E checks run sequentially; E2E owns its nested output directory during execution. Performance capture also runs serially, separate from tests and other GPU capture.

- `earlier-trials/pre-retina-default/`: superseded 016ba419 candidate with all receipts. The intermediate 223f550d artifact introduced native-DPR2 Medium and is also superseded, retained under pre-retina-resize. Final artifact 4534b995, built from a3d257cd, covers all 43 recipes at both DPR1 and DPR2; its separate natural Retina campaign records the remaining 33.3 ms p99 tail and Medium-to-Low adaptation.
- `isolation/pixels.json` binds the exact before/after PNG bytes to each zero-difference comparison. Regenerate it with `evidence-metadata.py` using Pillow after screenshot capture; the same script rechecks all 33 asset/source provenance hashes and portrait inputs.
- `lifecycle-retina-delivery/measurement.json`: complete natural 1440×900 DPR2 campaign, including all three loot/rest screens and an equipment picker.
