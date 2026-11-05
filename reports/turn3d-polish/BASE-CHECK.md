# Base check · e1731dc
2026-11-05. New worktree; frozen-lockfile installation completed in 6.1 seconds.

| Check | Observed |
|---|---|
| Typecheck / lint / Vite production build | Pass, exit 0 |
| Rules | 578 passed, 2 inherited expected failures, 11 skipped |
| Web | 1556 passed, 140 files |
| Backend mocks | 581 passed |
| Auth / chain / API contract | 24 / 32 / 16 passed |
| Root Node scripts | 11 passed |
| Inherited E2E | 421 passed, 3.6 minutes; raw/base-e2e.log |
| Before set | 96 live captures: opening + 35 mid-impact recipes + 12 idle figures at both 1280×720 and 1440×900; zero browser errors |

Before captures load the unchanged e1731dc offline HTML with its actual runtime, GLBs and event fixtures. Hashes and renderer stats are in before-captures.json. They include all heroes, enemies, boss, wave clear, victory and defeat. This is not a human review.

Tools: Node 24.22.2, pnpm 10.28.0, Three.js 0.180.0, Playwright 1.64.1; ffmpeg available. Blender absent. Prior report detected glTF Transform 4.5.1; this session has not invoked it. No new asset library needed yet. Procedural texture/AO baking will be local authored code. No skills or additional model agents used.

Same-settings baseline bundle is preserved at apps/web/dist-turn3d-polish-base (VITE_GAME_V2=1, guest auth, empty Supabase variables, g1-perf mode). Exact startup resource bytes will be measured alongside the final build. No byte-identical bundle claim.

All stdout and exit receipts are under raw/. Pushed turn3d ref and #292–#299 were read. Missing historical DECISIONS.md and /mnt prior prompt are disclosed in PROGRESS.md. Both Vercel configs explicitly disable every planned draft branch before any push.
