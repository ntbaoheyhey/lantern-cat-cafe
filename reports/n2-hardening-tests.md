PARTIAL

## KNOWN DEFECTS — read first

1. **New finding: Deno cannot resolve five extensionless `./index` imports.** `scripts/gen-deno-json.mjs` excludes `index.ts` from file-key generation, while mapping directory imports to index files. Consequently `packages/game-rules/src/v2/forge/{craft,relic}.ts` and `packages/game-rules/src/v2/bag/{compare,best,salvage}.ts` import `./index` without an exact normalized map key. All sixteen game functions reach these modules: **80 diagnostics; strict guard exit 1; T1 FAIL**. Auth's two functions are clean. The clean-graph test is retained as `it.fails` with a `KNOWN DEFECT` comment. A separate passing test rejects diagnostics outside these five known edges, so the expected failure cannot conceal unrelated missing imports. No product/map file was changed.
2. **Pre-existing expected failures:** `packages/game-rules/src/v2/lootcheck/lootcheck.test.ts`, `first expected gear item counts strictly increase each chapter (V1/V6 finding)` and its `repeat` variant. Their existing `it.fails.each` checks expose flat gear item counts between chapters; see `reports/v4b-lootcheck.md`. Unchanged by CXN2. These account for the other two expected failures in the workspace run.

Suggested Claude fix card: generate exact file keys for `index.ts` modules as well as directory aliases, regenerate all maps, then convert the clean-graph test to ordinary `it`. Verify the guard exits 0 and the broken-map scratch case still exits 1. This mission intentionally does not implement that product/deploy fix.

## 1. Pieces and acceptance

Base: fetched `origin/main` at `ea3da8c`, which includes CXN1 merge `c81185c` (#225) and migration `20261107000000_voucher_race_guard.sql`. Created a separate clean worktree because the user's original checkout contained unrelated uncommitted work. No equivalent import guard existed in the scripts/tests inspected on this base.

| Case | Result | Evidence |
| --- | --- | --- |
| T1 | **FAIL — KNOWN DEFECT** | Actual branch guard exits 1 with 80 diagnostics; no product fix authorized. |
| T2 | **PASS** | Scratch copy deletes only the v2-claim api-contract v2 key; guard exits 1 and adds the exact missing edge below. Broken map is never committed. |
| T3 | **PASS** | Every concurrency/replay/budget case is mapped individually below; new cases plus existing cases all pass. |
| T4 | **PASS** | Actual migrations applied in order; table RLS/client DML/column ACL checks and new RPC execution checks pass. Existing internal helper distinction explained below. |
| T5 | **PASS** | All 15 public tables have RLS; allowlist `[]`. |
| T6 | **PASS** | `forge test`: 96 passed, zero failed/skipped; all 7 new VoucherReplay cases pass with pinned submodules. |
| T7 | **PASS** | Matrix-only link check: zero broken links. Repository baseline falls from 2 to 1; no new failures. |
| T8 | **PASS with documented expected failures** | Final full local suite exits 0; 2,239 passed, 3 expected failures, 11 unchanged pre-existing skipped tests. The new expected failure is listed first above. |

### Piece 1 — import guard

New dependency-free Node script walks each of the 18 function entrypoints with that function's own import map. Relative keys normalize against deno.json; relative edges normalize against their importer. It traverses local imports/re-exports/type imports/literal dynamic imports, handles cycles, and checks target files without Node extension/index fallback. npm/jsr/remote modules terminate the local walk; no packages are fetched or executed. Extensionless relative edges within packages require an exact map key. Missing edges print `<fn>: <importer> -> <specifier>` and cause exit 1.

`src/deno-imports.test.ts` adds the strict real-tree regression, scratch-map deletion, a passing check for unexpected diagnostics, and a small fixture proving aliases, comments/strings, type exports, dynamic imports, cycles and extension refusal. The isolated valid fixture exits 0; the actual branch fails for the known product defect.

Actual proof output:

```text
$ node scripts/check-deno-imports.mjs
boss-fight: packages/game-rules/src/v2/forge/craft.ts -> ./index
boss-fight: packages/game-rules/src/v2/forge/relic.ts -> ./index
boss-fight: packages/game-rules/src/v2/bag/compare.ts -> ./index
boss-fight: packages/game-rules/src/v2/bag/best.ts -> ./index
boss-fight: packages/game-rules/src/v2/bag/salvage.ts -> ./index
[same five diagnostics for the other fifteen game functions; 80 total]
exit 1

Broken scratch map: exit 1
v2-claim: packages/api-contract/src/index.ts -> ./v2
Diagnostics: 81 (80 baseline + 1 deliberately broken map)
```

### Piece 2 — one line per requested case

- **PASS — parallel v2-claim x5 pays once:** new `src/concurrency-hardening.test.ts`, five handlers forced through a shared first-snapshot barrier; exactly one fish payment, one revision increment, one daily key award and one final claim timestamp.
- **PASS — parallel v2-craft same requestId spends once:** existing `v2/security-races.test.ts`, `parallel craft with the same requestId stores one result and spends once` (parameterized craft/boss case, forced same initial snapshot). Reused instead of duplicating the SQL case. New in-memory demo-store control also runs five claims and five same-ID crafts with enough materials for two crafts, asserting one item and one payment.
- **PASS — same mint tx reported concurrently by two players:** new `src/concurrency-hardening.test.ts`, rightful owner succeeds; foreign player using owner's nonce gets `not_found`, foreign player using their own voucher and the same receipt gets `mint_not_confirmed`; only owner's row is minted, and the other's remains issued.
- **PASS — parallel relic-forge after expiry, one issued voucher/no double signature:** new `src/concurrency-hardening.test.ts`, five callers forced to the same expired snapshot after the configured grace; exactly one replacement, one signer invocation, no extra shard spend, successful responses share the new nonce. Racing callers may fail closed with the existing `server_error`. Existing `src/relic-recovery.test.ts` T9 and `state and a concurrent forge cannot sign a replacement before the creator's second chain read` additionally cover v1/v2 CXN1 holds, late nonce use and unsigned cancellation; these were reused rather than duplicated.
- **PASS — twenty parallel calls never admit more than burst:** new `src/request-budgets-hardening.test.ts`, real service-role SQL admission plus handler; v2-craft admits exactly 2 and rejects 18 with 429; game callback runs twice.
- **PASS — player A never charges player B:** same new test inspects exact A bucket keys before B calls, then B receives its full 2-call burst. Existing `v2/request-budgets.test.ts`, `admits only the burst, refuses the rest with retryAfter, and keeps players separate`, supplies the original SQL-level case.
- **PASS — Retry-After integer >= 1:** every one of the 18 HTTP 429 responses has a digits-only header >= 1 matching its JSON body.
- **PASS — missing v2_take_budgets returns 503:** drop the real RPC only in a disposable PGlite instance, assert SQL error code 42883 and HTTP 503/Retry-After 5, assert no game callback, restore it from the real migration in finally. Existing synthetic outage tests remain unchanged.

PGlite has one connection. Role transitions/RPCs are serialized together, while handlers overlap and barriers force stale application snapshots. These tests do not claim independent-connection PostgreSQL lock/deadlock coverage. The in-memory control runs the actual demo store with `storage: null`; it is not a substitute for SQL enforcement.

### Piece 3 — migration security

New `src/new-migration-security.test.ts`: **15 passing tests**. The global setup builds its disposable template from bootstrap plus all **14 migrations sorted by filename**. A separate fresh-from-SQL audit also returned:

```json
{"migrations":14,"publicTables":15,"rlsEnabled":15,"allowlist":[]}
```

The test discovers CREATE TABLE and CREATE/REPLACE FUNCTION declarations in the four named migrations. It includes `public.siwe_nonces` because 20261103 hardens that pre-existing table. 20261104 adds `private.v2_request_budgets`; 20261106/07 add no tables and alter `relic_vouchers`, whose owner-read policy remains intentional. Both server-only tables have RLS and deny anon/authenticated SELECT/INSERT/UPDATE/DELETE, including column grants; actual statements get permission denied. The generic catalog query audits every public ordinary/partitioned table with an empty allowlist.

All four newly introduced RPCs (`v2_take_budgets`, `v2_cleanup_budgets`, `game_voucher_cancel_reissue`, `game_voucher_reissue_resolve`) and five replaced RPCs deny both client roles and actually execute as service_role with safe disposable arguments. **Existing internal helper `game_voucher_json` is not a new RPC:** 20260106 explicitly revokes it from service_role too. Separate passing tests preserve that deliberate boundary; its definer callers execute it as owner. The initial audit over-applied the service-role requirement to this old helper; inspecting the original migration resolved the interpretation, without a product change or expected-failure exception.

### Piece 4 — contract replay

Only new `contracts/test/VoucherReplay.t.sol` was changed under contracts. All seven cases PASS: valid mint; identical voucher replay; same nonce with another relicId and a newly valid signature; expired voucher; non-signer signature; player A's voucher sent by B (`NotVoucherPlayer`); owner cancelNonce followed by mint. Checks also verify balances/nonce state where appropriate.

Foundry was already installed (`forge Version: 1.8.6-Homebrew`). Its first run auto-populated missing submodules and generated an untracked lockfile. Restored pinned submodule revisions with `git submodule update --init --recursive`, removed the generated lockfile, and reran successfully. No submodule pointer, ABI, deployment JSON, Solidity product file or other contract test is in the diff.

### Piece 5 — matrix

Rows 9, 20, 21 now point to the real merged tests. Updated the formerly proposal-only nonce row, added import-guard/RLS/Foundry/per-IP rows, and recorded actual run counts. Per-IP limits remain GAP under U-5, not before the contest. Fixed the matrix's existing incorrectly resolved auth-test path; all matrix links now resolve.

## 2. Problems found and fixed

- **Found, not fixed:** generator omits exact index-file map keys; the strict Deno guard exposes the five missing edges described first above.
- **Found, pre-existing:** loot gear-count expectations remain expected failures; no balance/content changes allowed or made.
- **Fixed in this mission:** missing offline regression coverage, stale security-matrix GAP/proposal claims, and its broken auth-test link.
- **Verification load issue:** one intermediate full-unit rerun overlapped the classic Playwright server builds. Seven existing UI tests exceeded their unchanged 5-second timeout: one ChapterMap case, three StageLayout cases and three relicWiring cases. The earlier full run passed, and the final full run after Playwright stopped passed all 1,285 web cases in 19.90 seconds. Concurrent build/browser load is the suspected cause; no assertion, timeout, snapshot or product code was altered. Final results below use the non-overlapping run.
- **Routine test-authoring corrections:** aligned the new receipt-mismatch assertion with the real `mint_not_confirmed` API code; added a DOM type reference only to the new test importing the existing browser demo class. Neither was a product defect.

## 3. Tier 2 changes

None. All seven implementation files and this report are in the mission's explicit zone. The original dirty checkout was left untouched. No AGN2 document, auth implementation, migration, package manifest, lockfile or workflow was modified.

## 4. Diff and scope

Implementation commit: `30d6ae8`. `git diff --stat origin/main...HEAD` at that commit:

```text
 contracts/test/VoucherReplay.t.sol                 | 105 ++++++++++++++++++
 docs/security-test-matrix.md                       |  28 +++--
 scripts/check-deno-imports.mjs                     |  79 +++++++++++++
 supabase/tests/src/concurrency-hardening.test.ts   | 122 +++++++++++++++++++++
 supabase/tests/src/deno-imports.test.ts            |  64 +++++++++++
 supabase/tests/src/new-migration-security.test.ts  |  93 ++++++++++++++++
 .../tests/src/request-budgets-hardening.test.ts    |  68 ++++++++++++
 7 files changed, 547 insertions(+), 12 deletions(-)
```

`git diff --name-only origin/main...HEAD` at that commit (the final report commit additionally adds only `reports/n2-hardening-tests.md`):

```text
contracts/test/VoucherReplay.t.sol
docs/security-test-matrix.md
scripts/check-deno-imports.mjs
supabase/tests/src/concurrency-hardening.test.ts
supabase/tests/src/deno-imports.test.ts
supabase/tests/src/new-migration-security.test.ts
supabase/tests/src/request-budgets-hardening.test.ts
```

Combined implementation/report scope snapshot at evidence commit `f1702f4` (later edits only refine this report):

```text
$ git diff --stat origin/main...HEAD
 contracts/test/VoucherReplay.t.sol                 | 105 +++++++++++
 docs/security-test-matrix.md                       |  28 +--
 reports/n2-hardening-tests.md                      | 195 +++++++++++++++++++++
 scripts/check-deno-imports.mjs                     |  79 +++++++++
 supabase/tests/src/concurrency-hardening.test.ts   | 122 +++++++++++++
 supabase/tests/src/deno-imports.test.ts            |  64 +++++++
 supabase/tests/src/new-migration-security.test.ts  |  93 ++++++++++
 .../tests/src/request-budgets-hardening.test.ts    |  68 +++++++
 8 files changed, 742 insertions(+), 12 deletions(-)
```

The combined `git diff --name-only origin/main...HEAD` is exactly the seven paths above plus `reports/n2-hardening-tests.md`. No product file is changed.

## 5. Actual local verification

```text
node --version: v24.22.2
corepack enable && corepack prepare pnpm@10.28.0 --activate
pnpm --version: 10.28.0
CI=true pnpm install --frozen-lockfile: exit 0
  Scope: all 7 workspace projects
  Lockfile is up to date, resolution step is skipped
  Packages: +505
  Done in 7.4s using pnpm v10.28.0
  Warning: ignored build scripts bufferutil, keccak, utf-8-validate.
  No approval requested; workspace/lockfile did not change.

pnpm gen:deno && git diff --exit-code -- supabase/functions: exit 0
  wrote 18 Edge Function import maps
  no generated drift (does not prove the maps resolve; T1 separately exposes their defect)
pnpm typecheck: exit 0, all 6 workspace packages pass
pnpm lint: exit 0, all 6 workspace packages pass
pnpm test: final exit 0
  packages/chain:       2 files,     7 passed
  packages/auth:        1 file,     24 passed
  supabase/tests:      31 files,   541 passed | 1 expected fail (542)
  packages/game-rules: 24 passed / 3 skipped files, 366 passed | 2 expected fail | 11 skipped (379)
  packages/api-contract: 1 file,    16 passed
  apps/web:           110 files, 1,285 passed
  Total: 2,239 passed | 3 expected fail | 11 pre-existing skipped

pnpm build: exit 0, all workspace packages pass
VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web build: exit 0
  vite: built in 357ms
cd apps/web && pnpm test:e2e --project=classic: exit 0
  38 passed (33.0s)
  reports/ had no generated modifications after this run.
  Other Playwright projects not run: no apps/web, packages or lockfile diff.

Targeted four new test files: 24 passed + 1 expected failure (25 total), zero unexpected failures
Final migration-security file after declaration-discovery refinement: 15 passed (15)
cd contracts && forge test: exit 0
  VoucherReplayTest: 7 passed; 0 failed; 0 skipped
  Ran 8 test suites: 96 tests passed, 0 failed, 0 skipped (96 total tests)

node scripts/check-links.mjs --json, baseline: exit 1; 67 files / 809 links / 2 broken
node scripts/check-links.mjs docs/security-test-matrix.md: exit 0; 1 file / 19 links / zero broken
node scripts/check-links.mjs --json, final: exit 1; 67 files / 820 links / 1 existing broken path, no new failures
git diff --check: exit 0
git diff --exit-code -- pnpm-workspace.yaml pnpm-lock.yaml: exit 0
```

The remaining baseline broken path is in `docs/proposals/rune-skill-system/README.md:4`, `docs/proposals/tbh-index-research/`. Outside this mission's zone; left unchanged. Final link comparison matches broken items by file/type/raw/resolved, allowing line numbers to move.

`bash scripts/verify-pr.sh` was invoked without `--comment`. It exits 1 immediately with `scripts/verify-pr.sh: line 8: 1: pr number`; this helper requires a PR number and cannot verify a bare branch. No PR was created, as instructed. Its applicable checks were run individually above. The wrapper itself is NOT VERIFIED against this branch; no workflow or comment was triggered.

## 6. NOT verified

- Live database policies/migration deployment, Supabase secrets/functions, deployed contract bytecode, real Fuji receipt/nonce timing and wallet transactions: explicitly outside scope; no live writes or transactions occurred.
- Multi-connection PostgreSQL lock scheduling/deadlock freedom; PGlite serializes SQL on one connection.
- Remote dependency graphs under npm/jsr/HTTP: guard validates local source/maps offline and treats those dependencies as terminal nodes.
- Full Playwright projects other than classic: not required by this diff's paths and not run.
- PR-only verification wrapper: no PR exists or is permitted.

## 7. Human decisions and observations outside zone

Create the Deno-map fix card before the next Edge Function deployment; do not interpret an expected failure or successful gen:deno drift check as clean imports. The proposed index-key fix above belongs to the product/generator owner. Keep per-IP U-5 deferred. No changes needed to the deliberate internal-helper grant boundary. No secrets were copied into this report or committed; all test signing keys are ephemeral and generated locally.

## 8. Branch, commits and reproduction

Branch: `ai/codex-n2-hardening-tests`. Implementation commit: `30d6ae8`. The following report commit records this evidence; get its exact hash with `git log -1 --format='%H' -- reports/n2-hardening-tests.md`. Author: `ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>`.

Reproduce with the commands in section 5. For the broken-map proof run `pnpm --filter @taskbar-hero/supabase-tests exec vitest run src/deno-imports.test.ts`: it copies the script/packages/functions to a temporary directory, deletes only the target import-map key, asserts exit 1 and the exact api-contract edge, and cleans the scratch directory. For acceptance T1 run the script directly: exit 1 is the recorded unresolved product defect, not a passing guard.

Local logs used while authoring: `/tmp/n2-deno-clean.log`, `/tmp/n2-deno-broken.log`, `/tmp/n2-typecheck-final.log`, `/tmp/n2-lint.log`, `/tmp/n2-test-serial.log`, `/tmp/n2-test-final.log` (overlapping run), `/tmp/n2-build.log`, `/tmp/n2-classic-build.log`, `/tmp/n2-e2e-classic.log`, `/tmp/n2-forge.log`, `/tmp/n2-targeted.json`, `/tmp/n2-rls-final.log`, `/tmp/n2-links-before.json`, `/tmp/n2-links-after.json`. These are local scratch evidence, not committed artifacts. The passing and failing expectations are reproducible from the committed tests.

No PR, merge, Actions invocation, deployment, live database write or transaction.
