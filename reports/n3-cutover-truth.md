STATUS: DONE

CXN3 — cut-over truth, 1 Nov 2026 (Asia/Ho_Chi_Minh).
Implementation is complete; **live readiness is NO-GO**. The strict oversized-body probes fail,
and the pre-existing Deno import guard still blocks function deployment. No product/auth/map fix
was made outside this mission. No PR, merge, workflow, deploy, wallet operation or live DB write.

## 1. Pieces and acceptance

| Piece / test | Result | Evidence |
| --- | --- | --- |
| Piece 1 / T1 | PASS | Replaced the stale cut-over procedure with the recorded Oct 26/27 schema history, Vercel environment switch, D8 DROPPED, owner checklist, deploy command and data-preserving rollback. Retired procedure appears only in History. go-live/runbook agree; deploy.md adds only a link. |
| Piece 1 / T2 | PASS | Automated comparison of the migration table to sorted branch filenames newer than 20261102000000: exactly Nov 3, 4, 6 and 7, including CXN1. |
| Piece 2 / T3 | PASS | One catalog-only query, 17 distinct rows. PGlite all migrations: 17 true. Through Nov 2: 10 true, 7 false. No write keyword, even in comments; one statement. |
| Piece 3 / T4 | PASS | Eight Node tests with fake responses/transport, no network: strict 401, 503 budget hint, 500 refusal, network error, CORS, oversized body, all nine routes, docs/table/deploy consistency. |
| Piece 3 / T5 | PASS (execution); FAIL (live health) | Real unsigned live run completed: 18 PASS, 9 FAIL, exit 1. Eight oversized probes got 401, one timed out. Full output below. No credential read or sent. |
| T6 | PASS | Untouched base: 1 broken reference. Current: the same 1, no additions. Changed documentation alone: all 42 links/paths exist. |
| T7 | PASS | pnpm 10.28.0 install, generated-map drift, typecheck, lint, unit suite, build, classic build and 38 classic Playwright tests passed. Existing expected failures/skips are stated below. |
| Additional deploy import guard | FAIL (pre-existing) | 80 unresolved imports; byte-for-byte identical output on archived base 1fb25ed. Distinct from the passing generated-map drift check. |
| verify-pr wrapper | NOT VERIFIED | Invoked without --comment; exits at required PR argument. This mission prohibits creating a PR. Equivalent applicable checks were run directly. |

The catalog inventory includes six original v2 tables (including retained founder_grants),
v2_action_results, three integrity RPCs, the restrictive false siwe_nonces policy, the single
private budget table, both budget RPCs, cancel/reissue RPC, cancelled constraint value, and
CXN1 game_voucher_reissue_resolve with exact argument types. No application function is invoked.

## 2. Problems found and fixed

Fixed: the old runbook treated already-applied v2 SQL, a removed Founder batch and a code change
as release gates; the actual switch is Vercel VITE_GAME_V2 plus a new build. Replaced those steps
and linked the shared runbooks to one checklist. Historical confirmations are distinguished from
current live verification.

Fixed: the old checker omitted every v2 route. Added three unsigned probes per route, --v2-only
execution and import-safe classifier/transport tests. OPTIONS includes the production Origin and
preflight headers. Oversized JSON exceeds the handler's 8192-byte limit. Existing configuration
reads no anon key, contrary to the card's assumption; no key-reading capability was added.

Found: handlerV2 authenticates before budget admission and body parsing. Therefore unsigned
oversized requests reach 401 before size validation, and an ordinary unsigned 401 cannot reveal
missing budget SQL. The strict requested 400/413 rule is preserved and fails visibly. SQL catalog
confirmation and an authorized signed-in smoke remain separate gates. A 503 hint is diagnostic,
not a definitive diagnosis; other counter-store errors also cause it. One live oversized request
timed out; its cause is NOT VERIFIED.

Found: CXN2's guard exposes five extensionless ./index imports (forge/craft, forge/relic,
bag/compare, bag/best, bag/salvage) across sixteen game functions: 80 unresolved edges. The same
80-line output occurs on untouched 1fb25ed, and CXN2 records this as an expected failure. The
runbook says to stop before deployment when this guard fails. No out-of-zone map/package edits.

Found: docs/deploy.md contained contract commands only, not the function command requested by
the card. The new checklist expands the existing workflow's FUNCTIONS and PROJECT_REF values,
retains its --use-api --no-verify-jwt flags and all 18 functions, and has a test against that
workflow. deploy.md receives only the permitted link to the command.

An initial new SQL test counted a semicolon in a comment as a second statement. Removed that
comment punctuation, kept the strict assertion, then reran all three tests successfully.

## 3. Tier 2 changes

None. All changed files are in the mission's allowed zone. The original dirty checkout and
other agents' files were left alone; work used a clean separate worktree from fetched origin/main.

## 4. Diff evidence

Final tree compared with base (including this report): `git diff --stat origin/main...HEAD`
and `git diff --name-only origin/main...HEAD` (staged tree captured before the report commit):

```text
docs/cutover-v2.md                       | 486 ++++++++-----------------------
 docs/deploy.md                           |   5 +
 docs/go-live.md                          |  30 +-
 docs/proposals/sql/check-live-schema.sql |  43 +++
 docs/runbook.md                          |  22 +-
 reports/n3-cutover-truth.md              | 266 +++++++++++++++++
 scripts/check-live.mjs                   |  49 +++-
 scripts/check-live.test.mjs              |  79 +++++
 supabase/tests/src/live-schema.test.ts   |  47 +++
 9 files changed, 640 insertions(+), 387 deletions(-)

docs/cutover-v2.md
docs/deploy.md
docs/go-live.md
docs/proposals/sql/check-live-schema.sql
docs/runbook.md
reports/n3-cutover-truth.md
scripts/check-live.mjs
scripts/check-live.test.mjs
supabase/tests/src/live-schema.test.ts
```

## 5. Checks actually run

Toolchain: Node v24.22.2; `corepack enable && corepack prepare pnpm@10.28.0 --activate`.
Actual version line: `10.28.0`.

Install: `CI=true pnpm install --frozen-lockfile`:

```text
Packages: +505
Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4, utf-8-validate@5.0.10.
Done in 7.1s using pnpm v10.28.0
```

No approval prompt, dependency change or workspace/lockfile side effect occurred.

`pnpm gen:deno && git diff --exit-code -- supabase/functions`: exit 0.

```text
wrote 18 Edge Function import maps
```

`pnpm typecheck`: all six workspace package commands completed (`tsc --noEmit`), exit 0.
`pnpm lint`: all six package commands completed (`tsc --noEmit`), exit 0.
`pnpm test`: exit 0, actual package summary lines:

```text
packages/chain test:  Test Files  3 passed (3)
packages/chain test:       Tests  32 passed (32)
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
supabase/tests test:  Test Files  32 passed (32)
supabase/tests test:       Tests  544 passed | 1 expected fail (545)
packages/game-rules test:  Test Files  24 passed | 3 skipped (27)
packages/game-rules test:       Tests  366 passed | 2 expected fail | 11 skipped (379)
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
apps/web test:  Test Files  111 passed (111)
apps/web test:       Tests  1303 passed (1303)
```

The three expected failures and eleven skipped tests above already exist on main; no test was
skipped, disabled, weakened or changed by this mission. The new SQL tests are ordinary passing tests.

`pnpm build`: exit 0, all package commands completed; web: `✓ built in 762ms`.
`VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web build`: exit 0; `✓ built in 322ms`.
Classic browser check: killed leftover vite preview processes first, then from apps/web ran
`pnpm exec playwright test --project classic`: `38 passed (27.4s)`, exit 0.
Afterwards `git status --short reports/` was empty; no unrelated report or image was changed.
Full `pnpm test:e2e` is not required for this docs/scripts/test-only diff (no web/packages/lockfile
changes), and was not run. No screenshots requested or produced.

`node --test scripts/check-live.test.mjs`: 8 tests, 8 pass, 0 fail, 0 skipped; no network.
`node --check scripts/check-live.mjs`: exit 0.

`pnpm --filter @taskbar-hero/supabase-tests exec vitest run src/live-schema.test.ts --reporter verbose --silent=false`:

```text
RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar-hero-cxn3/supabase/tests

stdout | src/live-schema.test.ts > all 17 expected objects are present with all migrations
live-schema all migrations: 17/17 true

stdout | src/live-schema.test.ts > only the seven newer objects are false through 20261102
live-schema through 20261102: 10 true, 7 false

 ✓ src/live-schema.test.ts > is one catalog-only inventory with no write keywords, even in comments 2ms
 ✓ src/live-schema.test.ts > all 17 expected objects are present with all migrations 6ms
 ✓ src/live-schema.test.ts > only the seven newer objects are false through 20261102 2ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  11:41:06
   Duration  1.90s (tests 98%, import 2%, transform 1%)
```

Literal no-write-keyword grep (exit 1 means no matches, asserted as success):

```sh
rg -ni '\b(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|GRANT)\b' docs/proposals/sql/check-live-schema.sql
# no output; rg exit 1
```

`node scripts/check-links.mjs --json`: before 1, after 1; new broken set empty.
The retained baseline is docs/proposals/rune-skill-system/README.md's reference to the absent
docs/proposals/tbh-index-research/ directory. The four changed docs alone pass the checker.
`git diff --check`: exit 0.

`node scripts/check-deno-imports.mjs`: exit 1, 80 lines. Compared current stderr with the same
command against a git archive of base 1fb25ed: `cmp` exit 0. Representative line:

```text
boss-fight: packages/game-rules/src/v2/forge/craft.ts -> ./index
```

`bash scripts/verify-pr.sh` (no --comment):

```text
scripts/verify-pr.sh: line 8: 1: pr number
```

Real live run, `node scripts/check-live.mjs --v2`, exit 1. Only public default URLs, OPTIONS and
unsigned POST requests; no environment/secret file loaded, JWT, API key or wallet used:

```text
Site https://taskbarhero-eight.vercel.app
Supabase https://qoalewtxflagoprrxrgh.supabase.co
Fuji RPC https://api.avax-test.network/ext/bc/C/rpc

PASS  function v2-boss-fight options - HTTP 204, CORS allows origin, POST and content-type
PASS  function v2-boss-fight anonymous - HTTP 401
FAIL  function v2-boss-fight oversized - HTTP 401; expected 413 or 400 (authentication may run before body validation)
PASS  function v2-choose-class options - HTTP 204, CORS allows origin, POST and content-type
PASS  function v2-choose-class anonymous - HTTP 401
FAIL  function v2-choose-class oversized - The operation was aborted due to timeout
PASS  function v2-claim options - HTTP 204, CORS allows origin, POST and content-type
PASS  function v2-claim anonymous - HTTP 401
FAIL  function v2-claim oversized - HTTP 401; expected 413 or 400 (authentication may run before body validation)
PASS  function v2-craft options - HTTP 204, CORS allows origin, POST and content-type
PASS  function v2-craft anonymous - HTTP 401
FAIL  function v2-craft oversized - HTTP 401; expected 413 or 400 (authentication may run before body validation)
PASS  function v2-equip options - HTTP 204, CORS allows origin, POST and content-type
PASS  function v2-equip anonymous - HTTP 401
FAIL  function v2-equip oversized - HTTP 401; expected 413 or 400 (authentication may run before body validation)
PASS  function v2-lock options - HTTP 204, CORS allows origin, POST and content-type
PASS  function v2-lock anonymous - HTTP 401
FAIL  function v2-lock oversized - HTTP 401; expected 413 or 400 (authentication may run before body validation)
PASS  function v2-relic-forge options - HTTP 204, CORS allows origin, POST and content-type
PASS  function v2-relic-forge anonymous - HTTP 401
FAIL  function v2-relic-forge oversized - HTTP 401; expected 413 or 400 (authentication may run before body validation)
PASS  function v2-salvage options - HTTP 204, CORS allows origin, POST and content-type
PASS  function v2-salvage anonymous - HTTP 401
FAIL  function v2-salvage oversized - HTTP 401; expected 413 or 400 (authentication may run before body validation)
PASS  function v2-state options - HTTP 204, CORS allows origin, POST and content-type
PASS  function v2-state anonymous - HTTP 401
FAIL  function v2-state oversized - HTTP 401; expected 413 or 400 (authentication may run before body validation)

9 CHECK(S) FAILED
```

## 6. NOT verified

- Current live catalog, migration application history, Vercel environment values and release build:
  no admin access used; owner runs the supplied read-only SQL and dashboard checks.
- Authorized signed-in gameplay, voucher signing/minting and actual budget enforcement: unsigned
  probes cannot prove these; no wallet or session was used.
- Oversized-body rejection after successful authentication; observed unsigned behavior fails the
  requested strict live gate. Timeout root cause is unknown.
- Release rehearsal and full v2 browser projects were not run in this mission; they remain release
  checklist items. Classic browser project did run successfully.
- verify-pr wrapper cannot evaluate this branch without a PR; direct applicable commands ran.
- Push verification and final report commit are recorded by the branch's git history and final reply.

## 7. Human decisions and suspicious items outside the zone

Before deployment, fix the known Deno map/import problem in its owning lane and review the
unsigned oversized probe expectation against auth-before-body ordering. Do not use this report as
an all-healthy signal, apply live SQL, or deploy from this mission.

The referenced wave-n plan section 4 is not present as a tracked file in this base; the explicit
31 Oct D8 DROP instruction in this mission is the source for the updated checklist. C3 supplies the
historical Oct 26/27 owner confirmations, not a new live catalog observation. Older schema/integrity
proposals retain superseded Founder or not-yet-live language; the operational docs now identify
those proposals as historical context. No new live dates or settings were inferred.

## 8. Branch, commits and reproduction

Branch: `ai/codex-n3-cutover-truth`.
Fetched base: `1fb25ed` (contains CXN2 merge `7f64b47`, #238, and CXN1 #225).
Implementation commit: `d5755ad`; report commit follows it on the same branch.
Author: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`.
Worktree: `/Users/bao/Documents/ChatGPT/taskbar-hero-cxn3`.

Reproduce from this branch with pnpm 10.28.0: install frozen; run the shared commands listed
above; run the Node classifier tests and targeted SQL vitest command. The live-only command needs
Node 20+ and no install or credentials. All SQL application in this mission was in PGlite only.
