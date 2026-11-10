# Sync watcher correction

The watcher previously required `NOW ... PASS` in art `STATE.md`, overlooking a milestone PASS declared only in `ART-REPORT.md`. It now reads both reports and accepts explicit milestone declarations. An incomplete current state still excludes historical PASS evidence; individual gate successes do not qualify a release.

Verification:

- `node tools/ui-v3/published-art-status.test.mjs`: [seven cases PASS](status-tests.json), including report-only PASS and the immutable paused R1 receipt `8d12c87b2d9f307736e96e0ad206fe8587a42113`.
- `node --check tools/ui-v3/sync-watch.mjs` and `git diff --check`: PASS.
- [G1](checks.txt): recursive typecheck/lint/build and 1,867 web tests PASS.
- [Fresh offline Home](fresh.json): brand-new 1280×720 profile in both looks, zero browser errors; [look on](fresh-on.webp) and [look off](fresh-off.webp) visually reviewed.
- Game sources and offline artifact unchanged. Offline 31,203,011 B; SHA256 `2a7bef0551b40376c8d51fafbd35556e4870ababc08d06de60196d5a3d9c95a5`.

Fresh-eyes concerns remain those recorded at U9: noticeable cold start (U, bounded repairs exhausted), prototype battle art (B, no published PASS art tip), and static Home depth (U, approved measured fallback). The reviewed Home captures show a visible primary action, readable labels and unobstructed crew. This tooling correction introduces no visual changes or new runtime claims. Score stays 8.475/10; G6 stays PARTIAL.

No qualifying new A/B tip or stop condition was found. Resume the ten-minute shell watcher after publishing this correction; wait fifteen minutes after any qualifying tip before a refresh.
