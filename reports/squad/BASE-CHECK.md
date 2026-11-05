# P0 baseline · 2026-11-05

Base: `0b925536685512a0672a784fcfffe80097a0a821`, the published tip of draft #286
(`codex/gameplay2-proof-2026-11-05`). Read open drafts #275–#286 and #286's description.
`ai/codex-gameplay-2-2026-11-05` is the first gameplay2 layer, not its newest tip.
Remote `main` is `340f88b92405ceb6b5421b207307fdbb283b2ca3`. #244/#252/#257 untouched.
The gameplay2 checkout is dirty; a NEW worktree was created at `/Users/bao/taskbar-hero-squad`.
No reset/stash/checkout in the main or gameplay2 checkout. No deployment or backend action.

| Check | Result |
|---|---|
| Frozen pnpm install | Passed, no lockfile changes |
| Workspace typecheck / lint | Passed |
| Game rules | 482 pass, 2 inherited expected failures, 11 inherited skips |
| Web initial run | 1494 pass / 4 timeouts under high worker contention |
| Web complete rerun, `--maxWorkers=4` | 1498 / 1498 passed; no test or timeout edits |
| Backend mocks / auth / chain / API contract | 581 / 24 / 32 / 16 passed |
| Full existing Playwright | 413 / 413 passed; 2.3 minutes, four workers |
| Production build, V2 guest mode | Passed; existing vendor chunk warning |

The four initial unit timeouts were ChapterMap's first render, two StageLayout cases,
and a relic reporting test; each exceeded the existing 5000ms wall-clock timeout while
the unrestricted unit workers and E2E browsers competed for CPU. The complete bounded
worker rerun passed in 21.94s. No source change or skip was needed. Known resize-burst
flakiness did not occur in this baseline. Logs preserve both attempts.

Existing features `originalEconomy` and `cafeAdventure` remain false. `squadCombat`
does not yet exist in the base and is added as false in S1. Main startup/screens/save/replay
paths are the unmodified base in this run. Existing v2 deterministic/economy/contract tests
passed. Later proof must repeat this with the new flag off and assert the squad entry stays unloaded.

`base-size.json` records all production JS chunks compressed individually with Node gzip,
using the same V2 guest environment planned for the final size measurement. All test
servers were loopback fixtures; no real server or database was contacted. The E2E run
used classic/v2 ports 4273/4274 and default local server/API ports 4175/4176.

Skills used so far: none. Procedural art and repository test tools will be used directly;
no image generation or reference-game inputs are needed.
