# Full-stack baseline check

2026-11-05, immutable `7eb1ee7ef052ec90ee2cbc9e2299b185c8ab11b5`, PR282 tip. Read all PR bodies275–282 before creating the isolated worktree. Remote main is340f88b; the unrelated local main is6144d42 and was left untouched.

| Check | Observed result |
|---|---|
| Frozen pnpm install | Passed,505 packages; no lock change |
| Workspace typecheck / lint | Passed |
| Full399 E2E | 399 passed in4.2min; no skips or changed assertions |
| Workspace units, initial concurrent run | Web1481 pass,1 test timeout; all other packages pass |
| Web isolated rerun, unchanged source, maxWorkers2 | 1482 passed; retained initial timeout receipt |
| Package suites | game-rules437 pass,2 inherited expected fails,11 inherited skips; backend mock581, auth24, chain32, API contract16 pass |
| Workspace build | Passed; retained existing large-chunk warning |

The first unit run competed with full browser tests and a cold Vite server. `StageLayout.test.tsx` exceeded its existing5000ms timeout; the unchanged full web suite passes with limited concurrency. No source fix, assertion change or timeout increase was needed. The first walkthrough navigation also exceeded an unnecessarily short3000ms harness navigation timeout; the driver now allows30s for cold navigation. Both initial receipts are preserved. Pacing clocks start only after Home is ready.

The full stacked source builds and passes locally. This does not authorize release or prove compatibility after future retargets/merges. No Supabase, contracts, DB, signing or funds were used. Browser server tests use local mock services only. Logs: `logs/base-{typecheck,lint,unit,unit-isolated,build,e2e}.log`. A separate V2 production build uses identical explicit demo environment for later payload comparison.
