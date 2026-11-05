# Validation history

- `test.log`: first integrated root run failed two existing backend import-map tests because the new rule type import lacked `.ts`. Session A fixed its source at 9ccf88e7; `test-final.log` passes all workspace suites.
- `web-tests.log`: isolated full-web run, 1621 passing tests.
- `e2e.log`: cancelled first attempt after its nested server build was erased by a concurrent production build; HTTP 404 was diagnosed directly. This was a validation orchestration error. No product change was made for it.
- `e2e-rerun.log`: 420/421 pass; one inherited G3 fake-clock test tries to pause in the past. Keep this failure visible alongside the focused rerun.
- `offline-path.log`: original fixed demo seed 11 loses after final rules tuning. `tutorial-seeds.json` retains all six selected replay trials; the UI now uses seed 2. `offline-path-seed2.log` passes the actual full route at all three sizes. This is demonstration reproducibility, not a random balance sample.
- `typecheck-final.log`, `lint-final.log`: integrated 0.4.0 plus Deno correction, pass.
- `provenance.json`: all 33 original asset/source hashes match the recorded manifests.
- `round-grep.txt`: empty output for `\b(speed|interval|clock)\b|\bat:` over current turn rules, turn3d and cardrpg source. Numbered rounds remain the rule scheduler; playback rate is presentation only.

- `e2e-final.log`:421/421 after freezing the inherited G3 clock before navigation.
- `*-delivery.log` and `delivery-results.json`: final retained-scene source4bcf1821 command receipts, with exit codes and actual elapsed times. These supersede `results.json`, which intentionally retains the first failed integration run.
- `performance-summary.json`: computed from raw final cast/transition/software rows, retaining strict per-case misses.
- `safety-delivery.json`: source-identity checks against all76A-changed paths and runtime dependency comparisons.
- `round-audit.json`: exact source, roots, pattern and zero-match proof.
- `delivery-manifest.json`: SHA-256 and byte length of packaged evidence and the artifact (excluding the manifest itself).
