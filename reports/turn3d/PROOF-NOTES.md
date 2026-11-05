# Turn3D proof receipt

Candidate runtime `372c65a`, original base `41a6aa3`. No deployments or merges.
All commands run locally by the primary session. Raw reports are reproducible; verbose
balance histories are gzip archives, with SHA256 of the exact uncompressed JSON.

## Verification performed

| Check | Result and receipt |
|---|---|
| Full workspace typecheck / existing lint | Pass, `logs/final-typecheck.log`, `logs/final-lint.log`; web typecheck repeated after final renderer edit |
| Full rules suite | 578 pass, 2 inherited expected failures, 11 inherited skips; `logs/final-unit.log` |
| Full web suite | 1556 pass across 140 files; `logs/web-final-reviewed.log` |
| Final focused turn UI / presenter / fixture tests | 47 pass across 4 files; `logs/turn-final.log` |
| Backend mocks / auth / chain / API contract | 581 / 24 / 32 / 16 pass; no code changes in these domains |
| Root script checks | 11 pass at baseline; generated import maps remain consistent |
| Full inherited Playwright | 421 pass, 4.5 minutes; `logs/final-e2e.log` |
| Keyboard, six-role layouts, hidden lifecycle, WebGL missing/lost, calm mode, 12-model selector | Pass, `ui-proof.json`; these are new executable browser checks, separate from the 421 inherited cases |
| Exact visual regression | 175/175 frame hashes match in two fresh browsers, `visual-regression.json`; 35 recipes × 5 beats |
| Asset rebuild | 12 GLBs, 120 named clips, same byte hashes after rebuild; `source-audit.json` and `logs/models-rebuild.log` |
| Balance | 360 runs: 3 encounter modes × 2 presets × 2 policies × 30 seeds; `balance.json` and `raw/balance.json.gz` |
| Production 10-minute soak | 617.292 s, 11 post-GC samples, 1,757,312-byte warm heap range, zero browser errors; `soak.json` |
| Live play | 173 campaign slots, zero dead cats; `active-review.json` |
| Live effect/model playback | 13 named actions at x1 then boss telegraph; `live-review.json`, `video/live-self-review.mp4` |

The root maps contain only new pure-turn imports required by the config re-export.
No server handler, economy number, forge, market, chain implementation or migration
changed. `source-audit.json` lists paths and verified asset hashes. Guest gate remains
false by default. Turn3D additionally requires the query sub-flag `squad3d=1`.

## Reproduce

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm --filter @taskbar-hero/game-rules test
pnpm --filter @taskbar-hero/web test
pnpm art:turn3d
pnpm demo
```

For the existing demo command use port 5391; the evidence server used port 5511.
Open `/?demo&squad=1&squad3d=1&squadDebug=1`. The review hooks exist only in development
or the dedicated offline document. Production builds expose neither review global nor
debug controls. The gallery and model viewer are part of the local candidate.

```sh
node tools/turn3d/balance.mjs
node tools/turn3d/proof.mjs
node tools/turn3d/regression.mjs
node tools/turn3d/compare.mjs
node tools/turn3d/live-review.mjs
VITE_GAME_V2=1 VITE_ALLOW_MOCK_AUTH=1 VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' pnpm --filter @taskbar-hero/web exec vite build --outDir dist-turn3d-final
# Serve that directory on localhost:5515; unchanged baseline on localhost:5516.
node tools/turn3d/isolation.mjs
node tools/turn3d/performance.mjs
TURN_GPU=metal node tools/turn3d/performance.mjs
node tools/turn3d/soak.mjs
node tools/turn3d/audit.mjs
```

`proof.mjs`/`capture.mjs`/`compare.mjs`/`live-review.mjs` use the local dev port 5511.
The performance tool accepts `TURN_PRODUCTION_URL`. Metal uses Playwright's full
Chromium channel with `--use-angle=metal`; report the returned renderer string.

## Interpretation limits

- Frame cadence comes from browser RAF, not GPU timestamps. Metal results describe
  this M3 Pro only. SwiftShader is separately identified, and misses the 25ms p95 target.
- Paused CPU is renderer `TaskDuration`, not whole-machine power. Waiting for player
  still animates breathing/ears, and costs more than pause. No battery claim.
- GPU bytes estimate instrumented geometry buffers, one 64px glow texture and an
  approximate sampled framebuffer. Driver allocations and alpha overdraw were not read.
- Hidden lifecycle uses a synthetic `document.hidden` plus real visibility handler,
  not an OS background-tab measurement. Context loss uses `WEBGL_lose_context`.
- Flag-off initial JS grows by 5,250 raw / 1,565 gzip bytes (shared turn config and entry
  dispatch). Three/GLTF code and model requests stay absent. Existing screens were
  covered by the full inherited suite; do not call the bundles byte-identical.
- An intermediate comparison accidentally used different VITE_GAME_V2 settings and
  pulled the older legacy Phaser entry. That measurement is retained in
  `raw/isolation-mismatched-build.json` and is not used for the before/after claim.
  Rebuilding with the same guest-v2 settings yields the numbers above.
- Balance is still easy: campaign and patrol conditions all win 30/30. Standalone
  Hearthkeepers boss Auto wins 27/30, active priority 24/30; Lanternbreakers wins 30/30.
  Active priority is not universally stronger. The 6–8 minute x1 human target is unproven.
- No true audio, free camera, hardware compatibility matrix, independent grader or
  external human playtest. Training Yard refinements were cut after T1–T6.
