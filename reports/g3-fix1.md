PARTIAL

## What was done

Implemented app-wide display concealment for boss results. The authoritative store still
adopts the server result immediately. Before fightBoss is called, StageLayout captures the
whole display snapshot and sync label. HUD, stage, hints, character, inventory, forge,
progress/unlocks, boss gate and map continue reading that snapshot until release. The
confirmed result banner and the live display snapshot are released by the same reducer update.

Natural completion, Skip, hidden-tab return, reduced motion from the start, and switching
to reduced motion during replay all have passing browser coverage. Duplicate completions
are idempotent. Returning while the network request is pending records a release intent;
values are released immediately when the confirmed result arrives. Refused/failed requests
clear the hold without inventing an outcome.

The original G3 arena component has a small optional controlled-completion prop so reduced
motion/hidden return can show its final status immediately, including before lazy startup.
It retains its canvas and reachable idempotent Skip interface. Its scheduler, event ordering,
server result and 12-second cap are unchanged. Its default standalone behavior is preserved.

## Exact blocker / required stop

**Required full e2e is not green. Stopped per the card after two retry rounds; no workaround,
assertion change, timeout increase or test skip was made.**

Initial command (default ports):
`cd apps/web && npx -y pnpm@10.28.0 test:e2e`

The preview servers disappeared during concurrent Playwright activity. Tests then failed with
connection errors across both builds. Example from the unchanged G3 melee test:

```text
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4174/
```

Retry 1 used the existing supported E2E_PORT_CLASSIC=4273 / E2E_PORT_V2=4274 configuration;
those preview servers also disappeared. Its captured error was:

```text
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4274/
```

After the other runner exited, retry 2 completed all projects:

```text
6 failed
187 passed (56.0s)
ELIFECYCLE Command failed with exit code 1.
```

All six final failures are in the existing **apps/web/e2e/security.spec.ts**. Line 36
hardcodes localhost:4173/4174, ignoring the configured preview ports. Its route.fetch at
line 31 consequently targets an unavailable/default-port server:

```text
AggregateError: route.fetch: connect ECONNREFUSED ::1:4173
AggregateError: route.fetch: connect ECONNREFUSED ::1:4174
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  at apps/web/e2e/security.spec.ts:36:33
```

Final failing cases (all classic Playwright project, intentionally covering both builds):

- CSP classic 1600x900 light: painted canvas, zero violations
- CSP v2 1280x720 light: painted canvas, zero violations
- CSP v2 390x844 light: painted canvas, zero violations
- CSP v2 320x568 light: painted canvas, zero violations
- CSP v2 1280x720 dark: painted canvas, zero violations
- CSP v2 390x844 dark: painted canvas, zero violations

**File needed allowed to continue:** apps/web/e2e/security.spec.ts. The minimal fix is to
import classicURL/v2URL from its existing ./support/servers module and use them in page.goto.
All CSP injection, painted-canvas, error and violation assertions must remain. That existing
security spec is outside this card's new g3-conceal spec allowance, so it was not edited.
Alternatively, a new verification window with exclusive default ports can avoid that existing
hardcoded-port limitation, but another retry was not taken after this card's retry limit.
Some default-port CSP cases reported passes against whatever preview was present there;
those passes are not accepted as proof of this branch's CSP behavior.

## Files touched and scope gate

Scope: the original G3 arena zone, this fix's added StageLayout/layout/hud logic allowance,
the requested new UI spec and this report. No CSS or dimensions changed. In particular,
layout.css and hud.css are untouched, so the parallel sizing task is independent.

- apps/web/src/layout/StageLayout.tsx — hold/release all display values and input guards.
- apps/web/src/layout/bossPresentation.ts — one atomic, idempotent presentation reducer.
- apps/web/src/layout/hud/SyncStatus.tsx — controlled display status without a live-subscription bypass.
- apps/web/src/game/arena/BossArena.tsx — controlled immediate completion; no timeline/cap change.
- Corresponding four unit-test files — hold/release, full layout projection, sync status and arena completion.
- apps/web/e2e/ui/g3-conceal.spec.ts — known winning save, five release modes, atomic DOM-batch checks.
- reports/g3-fix1.md — this report.

<!-- DIFF_START -->
`git diff --stat origin/main...HEAD`:

```text
apps/web/e2e/ui/g3-conceal.spec.ts           |  99 ++++++++
 apps/web/src/game/arena/BossArena.test.tsx   |  10 +
 apps/web/src/game/arena/BossArena.tsx        |  15 +-
 apps/web/src/layout/StageLayout.test.tsx     |  40 ++++
 apps/web/src/layout/StageLayout.tsx          |  63 +++--
 apps/web/src/layout/bossPresentation.test.ts |  55 +++++
 apps/web/src/layout/bossPresentation.ts      |  52 ++++
 apps/web/src/layout/hud/SyncStatus.test.tsx  |   7 +
 apps/web/src/layout/hud/SyncStatus.tsx       |  10 +-
 reports/g3-fix1.md                           | 344 +++++++++++++++++++++++++++
 10 files changed, 665 insertions(+), 30 deletions(-)
```

`git diff --name-only origin/main...HEAD`:

```text
apps/web/e2e/ui/g3-conceal.spec.ts
apps/web/src/game/arena/BossArena.test.tsx
apps/web/src/game/arena/BossArena.tsx
apps/web/src/layout/StageLayout.test.tsx
apps/web/src/layout/StageLayout.tsx
apps/web/src/layout/bossPresentation.test.ts
apps/web/src/layout/bossPresentation.ts
apps/web/src/layout/hud/SyncStatus.test.tsx
apps/web/src/layout/hud/SyncStatus.tsx
reports/g3-fix1.md
```
<!-- DIFF_END -->

Gate check: freshly fetched origin/main at branch creation was a9a6b62, with G3 #196 merged
at 83f4d3e. Final fetch again succeeded. The diff-name scope and author outputs follow below;
all files are in the scopes described above. No forbidden file was reverted or edited.

```text
$ git fetch origin +main:refs/remotes/origin/main
(no output; exit 0)
$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

Protected-path diff check: no output, exit 0, for layout.css, packages/game-rules,
apps/web/src/game/arena/playback.ts, ArenaScene.ts, apps/web/src/api, supabase, contracts,
.github, pnpm-lock.yaml and pnpm-workspace.yaml. git diff --check: no output, exit 0.
Generated reports/g1-speed/metrics.json and reports/g3-combat/frame-metrics.json were restored
after browser runs; only this fix's report is included.

## Real checks run from the repo root

Used Node v26.11.1 and pinned pnpm v10.28.0. Version output was `10.28.0`.
Every explicit pnpm invocation used npx -y pnpm@10.28.0. The commands below are the
applicable checks from scripts/verify-pr.sh; that PR runner itself was not invoked because
this task must not create a PR/merge. No contract changes, so its contract-only checks do not apply.

`CI=true npx -y pnpm@10.28.0 install --frozen-lockfile` — **PASS**:

```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 307ms using pnpm v10.28.0
```

`npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions` — **PASS**:

```text
> taskbar-hero@0.0.0 gen:deno /Users/bao/.codex/worktrees/g3-combat/taskbar hero
> node scripts/gen-deno-json.mjs

wrote 18 Edge Function import maps
Drift diff: no output, exit 0.
```

`npx -y pnpm@10.28.0 typecheck` — **PASS**:

```text
> taskbar-hero@0.0.0 typecheck /Users/bao/.codex/worktrees/g3-combat/taskbar hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/chain typecheck: Done
packages/auth typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

`npx -y pnpm@10.28.0 lint` — **PASS**:

```text
> taskbar-hero@0.0.0 lint /Users/bao/.codex/worktrees/g3-combat/taskbar hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
packages/chain lint: Done
packages/auth lint: Done
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done
```

`npx -y pnpm@10.28.0 test` — **PASS**:

```text
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test: Done
supabase/tests test:  Test Files  21 passed (21)
supabase/tests test:       Tests  442 passed (442)
supabase/tests test: Done
packages/game-rules test:  Test Files  22 passed | 3 skipped (25)
packages/game-rules test:       Tests  339 passed | 2 expected fail | 11 skipped (352)
packages/game-rules test: Done
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test: Done
apps/web test:  Test Files  95 passed (95)
apps/web test:       Tests  1197 passed (1197)
apps/web test: Done
```

`npx -y pnpm@10.28.0 build` — **PASS**:

```text
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build: Done
apps/web build: ✓ built in 415ms
apps/web build: Done
```

`cd apps/web && npx -y pnpm@10.28.0 test:e2e ui/g3-conceal.spec.ts --workers=1` — **PASS**:

```text
Running 5 tests using 1 worker
  ✓  1 [stage-layout] › e2e/ui/g3-conceal.spec.ts:22:3 › G3 boss outcome is concealed app-wide; natural releases once (3.8s)
  ✓  2 [stage-layout] › e2e/ui/g3-conceal.spec.ts:22:3 › G3 boss outcome is concealed app-wide; skip releases once (1.9s)
  ✓  3 [stage-layout] › e2e/ui/g3-conceal.spec.ts:22:3 › G3 boss outcome is concealed app-wide; hidden return releases once (3.1s)
  ✓  4 [stage-layout] › e2e/ui/g3-conceal.spec.ts:22:3 › G3 boss outcome is concealed app-wide; reduced motion releases once (1.8s)
  ✓  5 [stage-layout] › e2e/ui/g3-conceal.spec.ts:22:3 › G3 boss outcome is concealed app-wide; reduce during replay releases once (2.4s)
  5 passed (20.2s)
```

`cd apps/web && E2E_PORT_CLASSIC=4273 E2E_PORT_V2=4274 npx -y pnpm@10.28.0 test:e2e` — **FAIL**:

```text
Running 193 tests using 6 workers
  ✓   92 [stage-layout] › e2e/ui/g3-conceal.spec.ts:22:3 › G3 boss outcome is concealed app-wide; natural releases once (2.4s)
  ✓  102 [stage-layout] › e2e/ui/g3-conceal.spec.ts:22:3 › G3 boss outcome is concealed app-wide; skip releases once (2.0s)
  ✓  112 [stage-layout] › e2e/ui/g3-conceal.spec.ts:22:3 › G3 boss outcome is concealed app-wide; hidden return releases once (3.1s)
  ✓  127 [stage-layout] › e2e/ui/g3-conceal.spec.ts:22:3 › G3 boss outcome is concealed app-wide; reduced motion releases once (1.9s)
  ✓  137 [stage-layout] › e2e/ui/g3-conceal.spec.ts:22:3 › G3 boss outcome is concealed app-wide; reduce during replay releases once (2.0s)
G3 stage frame metrics { p95: 16.799999999999727, frames: 180 }
  ✓  133 [stage-layout] › e2e/ui/g3-combat.spec.ts:67:1 › G3 stage frame p95 stays within 20ms in the demo build (4.6s)
  6 failed
    [classic] › e2e/security.spec.ts:12:3 › CSP classic 1600x900 light: painted canvas, zero violations 
    [classic] › e2e/security.spec.ts:12:3 › CSP v2 1280x720 light: painted canvas, zero violations ─
    [classic] › e2e/security.spec.ts:12:3 › CSP v2 390x844 light: painted canvas, zero violations ──
    [classic] › e2e/security.spec.ts:12:3 › CSP v2 320x568 light: painted canvas, zero violations ──
    [classic] › e2e/security.spec.ts:12:3 › CSP v2 1280x720 dark: painted canvas, zero violations ──
    [classic] › e2e/security.spec.ts:12:3 › CSP v2 390x844 dark: painted canvas, zero violations ───
  187 passed (56.0s)
 ELIFECYCLE  Command failed with exit code 1.
```

`npx -y pnpm@10.28.0 --filter @taskbar-hero/web exec vitest run src/layout/bossPresentation.test.ts src/layout/StageLayout.test.tsx src/layout/hud/SyncStatus.test.tsx src/game/arena/BossArena.test.tsx` — **PASS**:

```text
RUN  v5.0.5 /Users/bao/.codex/worktrees/g3-combat/taskbar hero/apps/web


 Test Files  4 passed (4)
      Tests  21 passed (21)
   Start at  08:04:38
   Duration  4.65s (tests 70%, environment 18%, import 8%, transform 3%)
```

The two interrupted full-suite attempts and their errors are recorded above; the final complete
full-suite attempt is quoted in the checks. No more than the two allowed retry rounds were taken.
Game-rules' pre-existing expected failures/skips are unchanged; none was introduced here.
The frozen install's ignored native build-script warning did not modify the lock/workspace files.
Chromium was already installed. Browser config built classic and V2 demo previews with empty
Supabase URL/key; alternate ports used its existing supported configuration, not config edits.

## Acceptance self-check

- **PASS:** Snapshot captured before calling fightBoss; authoritative store remains live.
- **PASS:** HUD chapter, round, kills, Cat Keys, currencies, XP/level and power remain pre-fight.
- **PASS:** Stage chapter/background/progress and expected combat stats remain pre-fight.
- **PASS:** Character/unlocked gear slots, bag count/items, forge materials/availability and next hint use held state.
- **PASS:** Boss clear/cooldown/key status and map unlocks/cleared markers use held state.
- **PASS:** Tab labels have no dynamic result badge in this codebase; tab panels opened mid-replay read held props.
- **PASS:** SyncStatus uses the captured pre-request display label, not an independent post-result subscription.
- **PASS:** Natural completion, double Skip, repeated hidden return and reduced motion release once.
- **PASS:** Enabling reduced motion mid-replay releases immediately; network-pending return intent is unit tested.
- **PASS:** Result banner, chapter, keys and map change in one observed DOM mutation batch.
- **PASS:** No server contract, rules, numbers, 12-second cap, CSS or dimensions changed.
- **PASS:** Unit coverage added; all 1,197 web unit tests pass. Existing tests were not weakened/deleted/skipped.
- **PASS:** New known-win browser spec passes all five modes, including the final full-suite run.
- **PASS:** Install, generated-file drift, typecheck, lint and build checks pass.
- **FAIL:** Full e2e all-project green gate: 187 reported passed, 6 CSP navigation failures; stopped as instructed.

## NOT verified

- Branch-wide CSP verification and an entirely green all-project e2e run, due to the explicit blocker above.
- Live Supabase, a real wallet, on-chain actions, deployment and real database writes. None was attempted.
- Physical-device/browser coverage outside this host's headless Chromium run.

## Needed to continue / handoff

Allow the minimal apps/web/e2e/security.spec.ts URL fix, then rerun the full all-project suite,
or authorize a new verification attempt with exclusive default ports. No test or product-code
workaround was made. The concealment implementation is complete; the required validation gate is not.

Branch: ai/codex-g3-fix1-conceal.
Implementation commit: `ac1fa8e6dd2e5df5926192fb2e431c0f1dd39c78`.
Report commit is the branch tip; exact final hash is in the final handoff.
No PR, merge, GitHub Actions run or deployment was created.
