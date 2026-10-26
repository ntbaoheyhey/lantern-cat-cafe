STATUS: DONE

Implemented U7 stage grounding and hit feedback on `ai/codex-ui-u7-stage-fx`, created from fetched origin/main `c87012d32c04cabe81b5d2cd1461e97cb9bbe569` (contains `5f19f9b` and CX2r). The previous report-only branch was not used. No blocker remains.

## What changed

- Both actor anchors use the backdrop's authored floorY (84 in the evidence chapter). `computeFloorY` clamps known floors to the scene and documents a 7/8-height fallback.
- Transparent frame padding is excluded from visible-height/width measurements. Monsters use half-integer scales inside 0.8–1.25 times cat height; boss support allows 1.5. Every existing monster/class combination is covered by unit tests. Shadows are black, alpha .35, 70% of visible width and 4 scene pixels tall; they follow horizontal actor movement on the common floor.
- Existing `buildIdleCues`/`CuePlayer` cues supply damage and HP. The stage renders those cues directly so arena-specific knockback, defeat hops and pooled number timings cannot override U7's presentation. Existing claim montage counts remain capped at eight; ungated stages continue the existing predicted idle timeline visually. No progress, store, combat calculation or authoritative state is changed.
- Hit silhouettes flash white for 80ms, targets shake ±2px for 100ms, and numerical text rises 12px/fades over 600ms. Phaser's Canvas renderer does not support sprite tint, so the scene caches white silhouettes from existing frames without altering sprite assets. Big/crit flags use the existing accent and 15px text versus 10px; dodges show muted `Miss`.
- A red 3px HP bar uses the existing spawn/impact HP cues over a dark track.
- Reduced motion stops looping sprite animations, uses instant pose changes, removes shake/rise, and leaves numbers stationary for 600ms while retaining flash.
- All effects are Phaser objects. Numerical text reads the existing `--font-num`; no fonts, assets, dependencies, content or test IDs were added/changed.

## Gate and tooling

PASS — `git fetch origin +main:refs/remotes/origin/main`, exit 0. `git merge-base --is-ancestor 5f19f9b origin/main`, exit 0. Main stayed at the base above through the final fetch. Scope is checked against origin/main as corrected by the follow-up.

PASS — exact fallback tool version:

```text
$ corepack enable && corepack prepare pnpm@10.28.0 --activate
zsh:1: command not found: corepack
$ npx -y pnpm@10.28.0 --version
10.28.0
```

Corepack is unavailable. All pnpm commands used `npx -y pnpm@10.28.0`; nested pnpm scripts resolve the same pinned executable.

## Required checks (real output)

PASS — `npx -y pnpm@10.28.0 install --frozen-lockfile`, exit 0:

```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +505
Progress: resolved 505, reused 496, downloaded 0, added 505, done
Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10.
Done in 11.7s using pnpm v10.28.0
```

PASS — `npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions`, exit 0:

```text
> taskbar-hero@0.0.0 gen:deno /Users/bao/Documents/ChatGPT/taskbar-hero-u7
> node scripts/gen-deno-json.mjs
wrote 18 Edge Function import maps
```

No generated drift, migration or database operation.

PASS — `npx -y pnpm@10.28.0 typecheck`, exit 0, repeated after the evidence-spec fix:

```text
Scope: 6 of 7 workspace projects
packages/chain typecheck: Done
packages/auth typecheck: Done
packages/game-rules typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck: Done
apps/web typecheck: Done
```

PASS — `npx -y pnpm@10.28.0 lint`, exit 0, repeated after the evidence-spec fix:

```text
Scope: 6 of 7 workspace projects
packages/chain lint: Done
packages/auth lint: Done
packages/game-rules lint: Done
supabase/tests lint: Done
packages/api-contract lint: Done
apps/web lint: Done
```

PASS — `npx -y pnpm@10.28.0 test`, exit 0:

```text
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test: Done
supabase/tests test:  Test Files  18 passed (18)
supabase/tests test:       Tests  385 passed (385)
supabase/tests test: Done
packages/game-rules test:  Test Files  20 passed | 3 skipped (23)
packages/game-rules test:       Tests  330 passed | 2 expected fail | 11 skipped (343)
packages/game-rules test: Done
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test: Done
apps/web test:  Test Files  84 passed (84)
apps/web test:       Tests  1093 passed (1093)
apps/web test: Done
```

The game-rules skips/expected failures above already exist; U7 did not add, remove, disable or weaken any tests. All original StageScene assertions are unchanged. Its harness now supports Phaser graphics/effects and uses the real existing timeline, with additional impact/HP/shutdown/Miss checks.

PASS — `npx -y pnpm@10.28.0 build`, exit 0:

```text
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build: Done
apps/web build: ✓ 1794 modules transformed.
apps/web build: ✓ built in 803ms
apps/web build: Done
```

PASS — explicit classic build: `VITE_GAME_V2=0 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 build`, exit 0:

```text
packages/chain build: Done
packages/auth build: Done
packages/game-rules build: Done
supabase/tests build: Done
packages/api-contract build: Done
apps/web build: ✓ built in 325ms
apps/web build: Done
```

PASS — from `apps/web`, `SCREENSHOTS=1 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 test:e2e`, exit 0. Playwright's existing second server builds with `VITE_GAME_V2=1`; classic runs from the default build. The config discovers ui/** in the existing classic project, and the U7 spec overrides baseURL to the existing v2 server on port 4174. No Playwright config changes or browser installation were needed.

```text
Running 100 tests using 6 workers
  ✓   42 [classic] › e2e/ui/u7-stage-fx.spec.ts:17:3 › idle feedback changes monster pixels over three seconds (no-preference) (3.9s)
Phaser canvas instances inserted during 100-step drag: 2
  ✓   76 [stage-layout] › e2e/layout/resize-burst.spec.ts:9:1 › viewport drag limits Phaser recreation and keeps both actors (1.0s)
  ✓   62 [classic] › e2e/ui/u7-stage-fx.spec.ts:17:3 › idle feedback changes monster pixels over three seconds (reduce) (4.0s)
  ✓   72 [stage-layout] › e2e/layout/resize.spec.ts:22:40 › continuous resize preserves state and readable HUD (dark) (5.9s)
  ✓   80 [stage-layout] › e2e/layout/stage-redraw.spec.ts:11:67 › both actors survive scene recreation (no-preference) (4.4s)
  ✓   82 [classic] › e2e/ui/u7-stage-fx.spec.ts:39:3 › evidence screenshot set (7.0s)
  ✓   87 [stage-layout] › e2e/layout/stage-redraw.spec.ts:11:67 › both actors survive scene recreation (reduce) (4.8s)
  ✓   86 [stage-layout] › e2e/layout/resize.spec.ts:22:40 › continuous resize preserves state and readable HUD (light) (5.8s)
  100 passed (34.3s)
```

PASS — targeted helpers/scene: `npx -y pnpm@10.28.0 --filter @taskbar-hero/web exec vitest run src/game/stage/stageFx.test.ts src/game/stage/StageScene.test.ts`, exit 0:

```text
 Test Files  2 passed (2)
      Tests  14 passed (14)
   Duration  731ms (environment 81%, transform 7%, import 6%, tests 6%, worker 1%)
```

PASS — `git diff --check`, exit 0.

## Fix round history

One test fix round; no product fixes were needed after checks began.

FAIL (resolved) — initial targeted after-evidence command:
`cd apps/web && SCREENSHOTS=1 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 test:e2e --project=classic e2e/ui/u7-stage-fx.spec.ts`

```text
2 passed (25.5s)
1 failed
[classic] e2e/ui/u7-stage-fx.spec.ts:39:3 evidence screenshot set
Expected: true
Received: false
Timeout 5000ms exceeded while waiting on the predicate
```

The two feedback tests passed. The damage capture assumed a fixed top-35px area, above the actual number. The fix locates the existing HP track and requires white numerical pixels above it, with 50ms polling. It retains the original timeout and still asserts that a real number is present. This changes only the newly added U7 evidence assertion; no existing assertion changed. The complete 100-test run then passed, including evidence.

NOT VERIFIED (interrupted tooling attempt) — one attempted targeted rerun was cancelled, exit 143, after an edit command used a repository-relative path from apps/web and failed with FileNotFoundError. The edit was rerun at the correct location. Its orphaned preview servers caused the next targeted startup to FAIL before tests with:

```text
Error: http://localhost:4173 is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.
```

Only processes whose cwd was this U7 worktree were stopped. No config or product workaround was used. The following complete browser run passed.

## Screenshot evidence

PASS — before set captured with stage code still at base `c87012d`, after set from the implementation, using the existing `mockV2SaveJson('midGame', { classId: 'witch', nowMs: Date.now() })` fixture. No new game state rules. Screenshots are guarded by `SCREENSHOTS=1`; baseline command adds `U7_BASELINE=1` and selects `-g 'evidence screenshot'`. Baseline capture result: `1 passed (9.5s)`. Light 1600x900, 1280x720, 390x844, 320x568 and dark 1280x720/390x844 are all present before/after. The UI itself has one authored dark theme, so colorScheme captures can have identical pixels.

PASS — 13 PNGs, every file under 200,000 bytes (stricter than 200 KB), dimensions verified from PNG headers. After mobile and damage-frame images were visually inspected. `after-damage-number.png` shows damage 67 and the white silhouette flash.

```text
after-1280x720-dark.png: 1280x720, 47416 bytes
after-1280x720.png: 1280x720, 47416 bytes
after-1600x900.png: 1600x900, 57462 bytes
after-320x568.png: 320x568, 34108 bytes
after-390x844-dark.png: 390x844, 48282 bytes
after-390x844.png: 390x844, 48282 bytes
after-damage-number.png: 1280x720, 47485 bytes
before-1280x720-dark.png: 1280x720, 47117 bytes
before-1280x720.png: 1280x720, 47117 bytes
before-1600x900.png: 1600x900, 57208 bytes
before-320x568.png: 320x568, 33909 bytes
before-390x844-dark.png: 390x844, 48028 bytes
before-390x844.png: 390x844, 48028 bytes
```

PASS — after each e2e attempt, report status was inspected. Following the complete run, 64 changed non-U7 tracked screenshots were restored with `git checkout -- <file>`, and other specs' newly generated PNGs were removed from this initially clean worktree. Only U7 evidence is retained. `git status --short screenshots/` is empty; `git status --short reports/` contains only U7 paths.

## Acceptance re-read

- PASS — corrected main base gate and own named task branch.
- PASS — common authored floor and feet anchors, documented fallback.
- PASS — grounded actor-following black .35-alpha ellipses, 70% visible width, 4px high.
- PASS — visible-height scale clamp, boss limit and crisp half steps; all catalog/class combinations unit tested.
- PASS — existing hit cues drive white flash, shake, damage/Miss text, big-hit styling; no combat math/content changes.
- PASS — existing HP cues render the 3px monster bar.
- PASS — reduced-motion helper branches and scene behavior, including stationary 600ms numbers.
- PASS — new pure helper tests plus extended existing scene tests.
- PASS — unchanged resize.spec, resize-burst.spec and stage-redraw.spec; both actor halves survive recreation.
- PASS — normal and reduced-motion three-frame/three-second U7 checks and no console/page errors.
- PASS — complete before/after evidence and actual damage-number frame within PNG budget.
- PASS — install, generated drift, typecheck, lint, unit suite, default/classic builds and full e2e.
- PASS — no test skips/weakening/deletion, timeout increases or golden-number changes introduced.
- PASS — no StageCanvas, arena, backdrop, sprite, content, store, auth, contract, dependency, lock/workspace, migration, signature or secret edits; no live database operations, deployment, PR, Actions, merge or sharing changes.

## NOT verified / limits

NOT VERIFIED — real Supabase/live gameplay and production deployment (demo mode only, as requested).
NOT VERIFIED — browser screenshots of big-hit/dodge cues: the existing idle predictor does not emit crits or dodges. Those presentation branches are covered by unit tests; no synthetic combat events or new rules were added to gameplay.

Nothing further is needed for U7. Scope and author evidence follow after committing the implementation.

## Final scope and author evidence

PASS — fetched main again, still `c87012d32c04cabe81b5d2cd1461e97cb9bbe569`. The following real output was captured at the implementation commit before adding this report-only evidence appendix; its report line count grows with this appendix. All 19 paths pass an exact allowlist validation.

```text
$ git diff --stat origin/main...HEAD
apps/web/e2e/ui/u7-stage-fx.spec.ts          |  76 +++++++++
 apps/web/src/game/stage/StageScene.test.ts   |  51 +++++-
 apps/web/src/game/stage/StageScene.ts        | 171 +++++++++++++++++---
 apps/web/src/game/stage/stageFx.test.ts      |  68 ++++++++
 apps/web/src/game/stage/stageFx.ts           |  39 +++++
 reports/u7-stage-fx.md                       | 225 +++++++++++++++++++++++++++
 reports/u7-stage-fx/after-1280x720-dark.png  | Bin 0 -> 47416 bytes
 reports/u7-stage-fx/after-1280x720.png       | Bin 0 -> 47416 bytes
 reports/u7-stage-fx/after-1600x900.png       | Bin 0 -> 57462 bytes
 reports/u7-stage-fx/after-320x568.png        | Bin 0 -> 34108 bytes
 reports/u7-stage-fx/after-390x844-dark.png   | Bin 0 -> 48282 bytes
 reports/u7-stage-fx/after-390x844.png        | Bin 0 -> 48282 bytes
 reports/u7-stage-fx/after-damage-number.png  | Bin 0 -> 47485 bytes
 reports/u7-stage-fx/before-1280x720-dark.png | Bin 0 -> 47117 bytes
 reports/u7-stage-fx/before-1280x720.png      | Bin 0 -> 47117 bytes
 reports/u7-stage-fx/before-1600x900.png      | Bin 0 -> 57208 bytes
 reports/u7-stage-fx/before-320x568.png       | Bin 0 -> 33909 bytes
 reports/u7-stage-fx/before-390x844-dark.png  | Bin 0 -> 48028 bytes
 reports/u7-stage-fx/before-390x844.png       | Bin 0 -> 48028 bytes
 19 files changed, 604 insertions(+), 26 deletions(-)
$ git diff --name-only origin/main...HEAD
apps/web/e2e/ui/u7-stage-fx.spec.ts
apps/web/src/game/stage/StageScene.test.ts
apps/web/src/game/stage/StageScene.ts
apps/web/src/game/stage/stageFx.test.ts
apps/web/src/game/stage/stageFx.ts
reports/u7-stage-fx.md
reports/u7-stage-fx/after-1280x720-dark.png
reports/u7-stage-fx/after-1280x720.png
reports/u7-stage-fx/after-1600x900.png
reports/u7-stage-fx/after-320x568.png
reports/u7-stage-fx/after-390x844-dark.png
reports/u7-stage-fx/after-390x844.png
reports/u7-stage-fx/after-damage-number.png
reports/u7-stage-fx/before-1280x720-dark.png
reports/u7-stage-fx/before-1280x720.png
reports/u7-stage-fx/before-1600x900.png
reports/u7-stage-fx/before-320x568.png
reports/u7-stage-fx/before-390x844-dark.png
reports/u7-stage-fx/before-390x844.png
$ git log --format='%an <%ae>' origin/main..HEAD
ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
$ git status --short
(empty)
```

PASS — only the final report appendix changed after these checks; no executable code or evidence images changed. Task-branch push command: `git push -u origin ai/codex-ui-u7-stage-fx`. No PR or workflow was requested or created.
