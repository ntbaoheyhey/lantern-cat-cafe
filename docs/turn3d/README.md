# The last lantern · turn-based 3D candidate

Open `index.html` directly from disk. It is a self-contained 10,086,768-byte HTML
compilation of the actual rules, React UI, Three.js renderer and twelve original GLBs.
No server or network is needed. Candidate runtime `372c65a`, not live.

1. Choose **Play the encounter**. On Mochi’s first turn, press **2**, then select **Spool Ram**
   to cancel/delay the charge shown in its intent.
2. With Soot, choose **Thread Snare** and hover a Sock Skipper to preview the row.
3. With Clover, heal a friend or attack. Turn on **Auto** per cat or **Auto all cats**.
   An ultimate spends the active cat's ordinary turn. Nothing is saved.
4. Use **Effects** in the left rail to loop all 35 action/lifecycle recipes. **Miniatures**
   offers twelve models, ten clips each, and a turntable.
5. Scroll below the encounter for actual 2D/3D comparisons, captured beats, numbers,
   provenance, licenses and explicit limits.

Keyboard: 1–4 skill; Tab/Enter target; S skip the current action; Space pause when the
page has focus. Speed ×1/×2/×4, fast mode and reduced motion are available. A WebGL
failure keeps the DOM turn battlefield playable. Desktop: 1024×600 minimum,
1280×720 and 1440×900 targets.

## Run and reproduce

```sh
pnpm install --frozen-lockfile
pnpm demo
# Open http://127.0.0.1:5391/?demo&squad=1&squad3d=1&squadDebug=1
pnpm art:turn3d
node tools/turn3d/demo.mjs
node tools/turn3d/demo-check.mjs
```

`pnpm demo` binds only localhost and clears Supabase environment variables for the
local guest build. The existing `squadCombat` feature remains false by default;
`?demo&squad=1` still selects the prior 2D slice. Add `squad3d=1` to opt into 3D.
Review controls are development-only in the application, and available in this offline
review document: wave jumps, boss, six-role fixture, seed, local ultimate charge,
forced intent, gallery and camera presets. No grants leave the sandbox.

Build script uses Vite's IIFE output and embeds models for GLTFLoader.parse. It
normalizes untagged shader template literals to equivalent quoted strings using the
TypeScript parser; tagged templates retain their raw semantics. No shader or model
content is changed. This keeps the generated artifact compact in the draft diff.
Full MIT license text for Three, React and React DOM is included in the HTML.

## Evidence and recommendation

- 578 rules / 1556 web / 421 inherited E2E tests pass. Rules retain two expected
  failures and eleven skips. Full counts/log hashes: `reports/turn3d/PROOF-NOTES.md`.
- 175/175 repeated deterministic effect-frame hashes match. Twelve GLB rebuild hashes
  match; 120 clips, 2,073,028 raw / 539,750 gzip model bytes, all triangle budgets met.
- Ultimate + six enemies on this M3 Pro/Metal: p95 16.7 ms at both target sizes;
  206 calls / 34,852 triangles. SwiftShader p95 33.4 ms misses the 25 ms target.
- Soak: 617.292 seconds, zero browser errors, 1.68 MiB warm retained-heap range.
- Flag off: no Three/model requests; startup increases 5,250 raw / 1,565 gzip bytes.
  The same guest-v2 build settings are used for before/after.
- Four separate primary-session self-grades average 7.95/10. No external graders.
  Campaign balance remains easy and the 6–8 minute human pacing target is unproven.
  No real audio; some melee effects share shapes. Keep demo-only for now.

Raw test output is archived in `reports/turn3d/raw/test-logs.tar.gz` with hashes in
`test-logs-index.json`; extract it to inspect the original logs. Browser evidence and
live video are in `reports/turn3d/shots/` and `reports/turn3d/video/`.

[Final report on the ledger branch](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/turn3d/TURN3D-REPORT.md).
No merge, deployment, server grants, migrations, secrets or chain integration.
