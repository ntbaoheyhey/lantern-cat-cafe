PARTIAL

# F2 — local server mode and cut-over rehearsal

Base: origin/main `25fd114` (F1 merged as #200; G1–G5 and F1 confirmed by the user's
28 Oct addendum). Date: 28 Oct 2026, Asia/Ho_Chi_Minh. Branch: `ai/codex-f2-server-mode`.
Implementation and raw evidence: `2a2a9e8`; a subsequent report-only commit is the tip.

## 1. Mission pieces and acceptance

### Piece 1 — local server: PASS

Added [local-server.mjs](../scripts/local-server.mjs), a loopback HTTP adapter over the
existing PGlite harness. G1 piece 6 documented feasibility only; there was no earlier HTTP
server to extend. Extracted the reusable migration/role helpers from Vitest-only setup
without changing their behavior; existing SQL and wrapper tests remain unchanged.

The browser uses the real SupabaseGameApiV2 HTTP transport. The server calls the real
handlerV2, routesV2, game rules and existing pgliteV2Store, which invokes the actual SQL
functions as service_role. All checked-in migrations are applied to disposable memory.
JWTs use the existing HS256 session format and actual verifySessionToken. The startup
secret and voucher signer key are generated randomly in memory; neither is printed or
persisted. Authentication files and token semantics were not modified.

The dedicated build sets VITE_GAME_V2=1, the explicit loopback VITE_SUPABASE_URL, and a
dummy public anon key. Vite ignores .env files. The API binds only to 127.0.0.1, checks Host
and Origin, and rejects browser access to test controls. Browser network routing blocks
non-loopback requests. No live database connection or chain reader is constructed.

Catalog fixture builders establish preconditions in SQL before browser navigation; they
never replace a game action with a mock API. Fresh class choice starts with no chosen
class. Browser sessionStorage receives a synthetic signed session; no demo save is used.

### Piece 2 — v2-server journeys: PASS

Added eleven tests under [server journeys](../apps/web/e2e/server/journeys.spec.ts):

| Journey / acceptance | Result and evidence |
| --- | --- |
| Choose class | PASS: real POST, selected class persisted in cat_state |
| Claim | PASS: timed browser claim, nonzero Fish/XP and persisted inventory/balances |
| Equip best request count | PASS: 9 changed slots, exactly 9 equip mutations, zero state reads |
| Craft | PASS: real UUID and one extra persisted item |
| Salvage | PASS: same UUID disappears from SQL and UI |
| Boss win and loss | PASS: result absent during replay; Skip fight releases outcome, SQL fights/chapter/keys checked |
| Relic forge without wallet | PASS: existing refusal message, zero forge requests, zero material spend |
| Hide/return | PASS: header SyncStatus, no hidden claims, one return claim and one revision |
| Two tabs at once | PASS: barrier waits for both requests; one positive reward, one progress revision, exact combined credit |
| Network failure and retry | PASS: commit craft, abort its response, retry identical request ID; one receipt, one item UUID in UI, one recipe charge |
| HTTP safety | PASS: missing/forged tokens rejected, CORS preflight retained, malformed JSON rejected, test controls reject browser origins |

The final eleven-test project passed **twice consecutively**, with no retries or disabled
tests: **11 passed (20.7s)**, then **11 passed (13.5s)**. Full-suite and rehearsal reruns
also passed. Raw logs: [run 1](f2-server-mode/server-run1.log),
[run 2](f2-server-mode/server-run2.log).

### Piece 3 — rehearsal: PASS with fallback; exact manual rollback NOT VERIFIED

[rehearse-cutover.mjs](../scripts/rehearse-cutover.mjs) starts from a v1-only data-directory
snapshot restored into a second PGlite instance. It applies both v2 migrations in order,
checks whether the Founder batch migration exists, starts HTTP over that exact database,
builds with the flag on, runs all server journeys, and rolls back locally. Each step is timed.

Final run: **11 passed (17.4s)**; **TOTAL 20.733s; PASS (local only)**.
[Full rehearsal output](f2-server-mode/rehearsal.log) includes the step table. The appended
[Rehearsal section](../docs/cutover-v2.md#rehearsal-local-only-f2) contains the final timings
and reproduction commands; the production steps were not edited.

**Reason for PARTIAL:** the specifically requested file named supabase-manual/v2-rollback.sql
is absent from main. The script explicitly reports that gap, prefers that file if later
provided, and otherwise runs the tracked integrity rollback followed by the tracked v2 test
rollback. The fallback passed exact comparison of tables, columns, constraints, indexes,
triggers, function definitions, grants and policies, plus preservation of 123 Gold and 50
Shards verified through SQL and the v1 snapshot RPC. The exact requested manual artifact
cannot be claimed as tested. No substitute was added in a protected database area.

The Founder batch migration is also absent on this base. Its conditional step prints
NOT AVAILABLE / N/A; no draft migration was imported. If the batch later exists, the script
runs a transactional dry run with local synthetic amounts, repeats it for idempotency,
checks cutoff equality exclusion, and rolls back. That currently unavailable branch is
**NOT VERIFIED**, as allowed by the mission's “if migration exists on main” condition.

Both requested workflows have one-command instructions in cut-over and test-stability docs.

## 2. Problems found and fixed

- **Fixed:** the PGlite helper imported Vitest even outside a test process. Extracted the
  migration and role helpers to standalone-db.ts and retained the original test exports.
- **Fixed:** the new TypeScript coverage reached a pre-existing boss handler inference
  error: spreading an indexed record lost its index signature. Added one explicit record
  type annotation; no runtime expression changed.
- **Fixed during harness development:** diagnostic JSON parsing could turn the production
  handler's 400 into a local 500. Logging now tolerates malformed JSON; the boundary test
  verifies the real 400 survives.
- **Found:** the requested manual rollback file is missing. The older v2 test rollback
  alone leaves integrity objects behind; the explicit composed local fallback removes them
  and passes exact v1 verification. The missing manual artifact is not silently treated as tested.
- **Found:** Founder batch remains a draft outside main. The rehearsal reports availability
  honestly and does not import that draft or select production D8 values.
- **Observed tooling noise:** ignored native build scripts and npm environment warnings;
  no approval prompt, dependency change, lockfile change or workspace-file change occurred.

## 3. Tier 2 changes

- [boss.ts](../supabase/functions/_shared/v2/boss.ts): one type annotation required when the
  new harness's checked import graph exposed an existing inference error. No game behavior,
  API contract, authentication source, economic config or migration changed.

All other changes are in the mission's allowed zones, including test helper/config coverage.
No F3 art, class rig, protected number configuration, .env, package manifest, lockfile,
contract, workflow or migration was modified. The original dirty forge checkout was preserved.

## 4. Git diff from origin/main

<!-- DIFF_START -->
`git diff --stat origin/main...HEAD` (final staged tree):
```text
 apps/web/e2e/server/journeys.spec.ts   | 193 ++++++++++++++++++++++++++
 apps/web/e2e/support/server-build.mjs  |  12 ++
 apps/web/e2e/support/server-fixture.ts |  55 ++++++++
 apps/web/e2e/support/server-ports.ts   |   9 ++
 apps/web/e2e/support/test.ts           |   7 +-
 apps/web/playwright.config.ts          |  16 ++-
 docs/cutover-v2.md                     |  68 +++++++++
 docs/test-stability.md                 |  47 +++++++
 reports/f2-server-mode.md              | 244 +++++++++++++++++++++++++++++++++
 reports/f2-server-mode/checks.txt      |  82 +++++++++++
 reports/f2-server-mode/rehearsal.log   | 109 +++++++++++++++
 reports/f2-server-mode/server-run1.log |  56 ++++++++
 reports/f2-server-mode/server-run2.log |  56 ++++++++
 scripts/local-server.mjs               |  87 ++++++++++++
 scripts/rehearse-cutover.mjs           | 108 +++++++++++++++
 supabase/functions/_shared/v2/boss.ts  |   2 +-
 supabase/tests/src/game-db.ts          |  32 +----
 supabase/tests/src/standalone-db.ts    |  39 ++++++
 supabase/tests/tsconfig.json           |   2 +-
 supabase/tests/v2/helpers.ts           |   2 +-
 supabase/tests/v2/local-runtime.ts     |  72 ++++++++++
 21 files changed, 1262 insertions(+), 36 deletions(-)
```

`git diff --name-only origin/main...HEAD`:
```text
apps/web/e2e/server/journeys.spec.ts
apps/web/e2e/support/server-build.mjs
apps/web/e2e/support/server-fixture.ts
apps/web/e2e/support/server-ports.ts
apps/web/e2e/support/test.ts
apps/web/playwright.config.ts
docs/cutover-v2.md
docs/test-stability.md
reports/f2-server-mode.md
reports/f2-server-mode/checks.txt
reports/f2-server-mode/rehearsal.log
reports/f2-server-mode/server-run1.log
reports/f2-server-mode/server-run2.log
scripts/local-server.mjs
scripts/rehearse-cutover.mjs
supabase/functions/_shared/v2/boss.ts
supabase/tests/src/game-db.ts
supabase/tests/src/standalone-db.ts
supabase/tests/tsconfig.json
supabase/tests/v2/helpers.ts
supabase/tests/v2/local-runtime.ts
```
<!-- DIFF_END -->

## 5. Checks actually run

Used Node **v26.11.1**. Corepack is unavailable; every pnpm command used
`npx -y pnpm@10.28.0`. The version command printed **10.28.0**.
[Collected real summary lines](f2-server-mode/checks.txt) preserve the full per-package counts.

| Command | Real result |
| --- | --- |
| CI=true npx -y pnpm@10.28.0 install --frozen-lockfile | PASS: Scope 7 workspace projects; frozen lock; Done in 5.9s using pnpm v10.28.0 |
| npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions | PASS after implementation commit: wrote 18 Edge Function import maps; diff output empty, exit 0 |
| npx -y pnpm@10.28.0 typecheck | PASS: all six selected workspace packages Done |
| npx -y pnpm@10.28.0 lint | PASS: all six selected workspace packages Done |
| npx -y pnpm@10.28.0 test | PASS: chain 7, auth 24, Supabase 442, game rules 339, API contract 16, web 1,206 passed |
| npx -y pnpm@10.28.0 build | PASS: all selected workspace builds Done |
| VITE_GAME_V2=0 npx -y pnpm@10.28.0 --filter @taskbar-hero/web build | PASS: built in 328ms |
| From apps/web: npx -y pnpm@10.28.0 test:e2e | PASS: 217 passed (54.3s), including classic and all 11 server tests |
| v2-server standalone run 1 | PASS: 11 passed (20.7s) |
| v2-server standalone run 2, immediately next | PASS: 11 passed (13.5s) |
| node scripts/rehearse-cutover.mjs | PASS with disclosed rollback fallback: 11 passed (17.4s), TOTAL 20.733s |
| node --check on the two scripts and server-build.mjs | PASS |
| node scripts/check-links.mjs on archived untouched main | PASS: 55 Markdown files, 751 links/paths, zero broken |
| node scripts/check-links.mjs on final tree | PASS: 55 Markdown files, 754 links/paths, zero broken; report separately: 1 file, 9 links/paths, zero broken |
| git diff --check | PASS |

Game rules' existing 2 expected failures and 11 skipped tests / 3 skipped files are unchanged.
No test was skipped, weakened or removed by F2. An initial exploratory gen:deno diff before
committing showed only the intentional boss type annotation; final post-commit drift is zero.
Initial exploratory typechecking found that annotation issue and final typecheck/lint/build
all pass with the new harness included. Browser runs restored the other missions' generated
G1/G3 metrics; only F2 report files remain changed. No stale preview was reused.

## 6. NOT verified

- Exact requested manual rollback artifact: missing on main; the tracked fallback was tested.
- Conditional Founder batch execution: batch migration is absent on main. Its availability
  check ran; its future execution branch was not exercised.
- Real wallet/SIWE message signing in the browser. Test JWTs are injected using the existing
  session format and verified normally. Existing auth wrapper unit tests passed unchanged.
- Hosted Deno entrypoint wiring, Supabase REST transport, real production PostgreSQL lock
  scheduling, production latency and any live project/database access. This harness replaces
  the storage network hop with the existing PGlite store and exercises actual routes and SQL.
- Native OS tab switching: headless tests synthesize document visibility events and exercise
  the real listeners/header. PGlite has one connection and serializes SQL role changes while
  handlers overlap and race their revision checks.
- Connected-wallet Relic minting, live chain reads, on-chain transactions and deployments.
  The requested walletless UI path correctly refuses without calling the forge endpoint.

## 7. Human decisions and observations outside the zone

- Supply/review the missing manual rollback artifact if exact-file acceptance is required.
  The script already prefers it and will fail if it does not restore the v1 schema.
- Founder/D8 approval and the draft batch migration remain decisions for the existing
  cut-over process. Synthetic local values do not select or approve production amounts.
- Other v2 SQL tests were historically excluded from the package's TypeScript include list;
  F2 adds coverage for its helper's import graph only. Broadening all old test coverage is
  outside this mission.
- No request was sent to Claude or another chat. No PR, merge, Actions dispatch, deploy,
  live database call/write or contest-submission action was performed.

## 8. Branch, commits and reproduction

Branch: `ai/codex-f2-server-mode`. Base: `25fd114`. Implementation/evidence: `2a2a9e8`.
The next commit contains this report; its exact hash is given in the final handoff.
Author: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`.
Clean worktree: `/Users/bao/.codex/worktrees/f2-server-mode/taskbar hero`.

```sh
# From the repository root, after the frozen install:
npx -y pnpm@10.28.0 --filter @taskbar-hero/web test:e2e --project=v2-server --workers=1
node scripts/rehearse-cutover.mjs
# Full browser verification, one suite at a time:
npx -y pnpm@10.28.0 --filter @taskbar-hero/web test:e2e
```

Use E2E_PORT_CLASSIC/E2E_PORT_V2/E2E_PORT_SERVER/E2E_PORT_API to move the four strictly
separate local ports if another owned suite is running. The rehearsal's external/prebuilt
handoff flags are internal; ordinary runs start with those flags unset.
