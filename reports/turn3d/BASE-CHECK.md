# Turn3D baseline · 2026-11-05

Base: `41a6aa38c0cc65d229502c4bdaa0cfced702cd16`, newest pushed
`ai/codex-squad-slice-2026-11-05`, draft #291 atop #287–#290. Runtime is `1604c70`.
`git ls-remote origin 'refs/heads/ai/codex-*'` and the open draft descriptions were read.
New isolated worktree: `/Users/bao/taskbar-hero-turn3d`. No fallback base was necessary.
Remote main is `340f88b`; local main checkout is already `6144d42`, and was not changed.

Machine: Apple M3 Pro arm64, 36 GiB RAM, Node 24.22.2, pnpm 10.28.0.
Frozen install succeeded in 6.2s. Native optional dependency scripts were ignored by
the existing pnpm policy; no approval or dependency-script policy was changed.

| Check on unmodified base | Actual result |
|---|---|
| `pnpm typecheck` | Pass, all workspace packages |
| `pnpm lint` | Pass, all workspace packages (existing tsc-based lint) |
| `node --test scripts/*.test.mjs` | 11 passing |
| Game rules | 546 passing, 2 expected failures, 11 inherited skips |
| Web | 1509 passing, 136 files |
| Backend mock tests | 581 passing |
| Auth / chain / API contract | 24 / 32 / 16 passing |
| Full Playwright, two workers, dedicated ports 5511–5514 | 421 passing in 3.7 minutes |
| Production guest Vite build | Pass; inherited 1.53MB legacy-chunk warning |

No baseline failures or blocking fixes. Known `resize-burst.spec.ts` flakiness did not
reproduce. Units used `pnpm -r --workspace-concurrency=1 test --maxWorkers=2` to avoid
worker contention. Full raw outputs are `reports/turn3d/logs/base-*.log` (ledger delivery).
Baseline build retained locally under `apps/web/dist-turn3d-base/` for graph/size comparison.

The repo ships Phaser 3.90.0, but no three.js, @react-three or Babylon. Blender is not
installed (`command -v blender` has no result; no Blender app bundle was found).
`npx --yes @gltf-transform/cli --version` returned **4.5.1**. Chosen unattended pipeline:
original procedural three.js 0.180.0 geometry + GLTFExporter + named animation clips,
GLTFLoader at runtime; no third-party art. Three and its type definitions are MIT.
The design is committed before implementation. Every new review ref is deployment-disabled
in both Vercel configurations before it will be pushed.
