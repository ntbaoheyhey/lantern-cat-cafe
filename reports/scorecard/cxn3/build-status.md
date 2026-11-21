STATUS: PARTIAL — P/B targeted work complete; release gates remain open.

Detached base `458eebd`; `origin/main` `1fb25ed`. PR [#244](https://github.com/ntbaoheyhey/taskbar-hero/pull/244).
No push, merge, live write or agents. The older local branch remains at `139abbe`.
Full baseline checks run separately; no full e2e was run here. No numeric self-score.

Authority docs now follow user-approved section 7, with default-OFF flags, local PGlite/demo
verification, existing-credential prerequisites and rollback requirements. No runtime, auth,
function, migration or checker code changed. Tests now pin every catalog identity and route,
exercise missing/wrong CORS and all network-failure kinds, and verify pending-migration replay.

## Commands run by this builder

Raw outputs are in [logs](logs/); each contains its command and actual exit code.

| Command (repo root unless stated) | Exit | Observation / log |
| --- | ---: | --- |
| `pnpm --version` | 0 | 10.28.0; tooling.log. Node v24.22.2. |
| `CI=true pnpm install --frozen-lockfile` | 0 | install.log; lock/workspace files unchanged. |
| `pnpm gen:deno` | 0 | gen-deno.log; 18 maps. |
| `git diff --exit-code -- supabase/functions` | 0 | deno-drift.log; generation is not import validation. |
| `env -u SITE_URL -u SUPABASE_URL -u FUJI_RPC_URL node --test scripts/check-live.test.mjs` | 0 | classifier.log; 9 tests pass, no network. |
| `pnpm --filter @taskbar-hero/supabase-tests exec vitest run src/live-schema.test.ts --reporter verbose --silent=false` | 0 | schema.log; 4 tests pass; 17 true after all migrations, 10 true/7 false through Nov 2, upgrade/replay succeeds. |
| `pnpm --filter @taskbar-hero/supabase-tests typecheck` | 0 | target-typecheck.log. |
| `rg -ni '\b(INSERT\|UPDATE\|DELETE\|ALTER\|CREATE\|DROP\|GRANT)\b' docs/proposals/sql/check-live-schema.sql` | 1 | sql-no-writes.log; no matches (required result). Raw command uses regex alternation, not escaped pipes. |
| `env VITE_GAME_V2=0 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= pnpm --filter @taskbar-hero/web exec vitest run src/layout/StageLayout.test.tsx --reporter verbose` | 0 | flag-defaults.log; existing 11 component tests pass, including OFF and ON cases. |
| `node --check scripts/check-live.mjs` | 0 | syntax.log. |
| `env -u SITE_URL -u SUPABASE_URL -u FUJI_RPC_URL node scripts/check-live.mjs --v2` | 1 | live-v2.log; 17 pass/10 fail, described below. No retries. |
| `node scripts/check-deno-imports.mjs` | 1 | deno-imports.log; 80 unresolved edges. |
| `python3 reports/scorecard/cxn3/import-diagnostic.py` | 0 | import-diagnostic.log; scratch repair clears all 18 functions. Initial incomplete-copy attempt failed and is retained separately. |
| `python3 reports/scorecard/cxn3/mutations.py` | 0 | mutations.json + mutation-*.log; 11/11 killed, each test command exit 1; unmutated controls exit 0. |
| `python3 reports/scorecard/cxn3/check-links-baseline.py` | 0 | Reconstructs main's tracked paths and exact docs/checker in a disposable copy; changes no ref. |
| `node scripts/check-links.mjs --json` (main copy / current) | 1 / 1 | links-main.log / links-current.log: identical one pre-existing broken path. |
| `node scripts/check-links.mjs docs/cutover-v2.md docs/go-live.md docs/runbook.md docs/deploy.md` | 0 | links-touched.log; no new broken links. |
| `node scripts/check-links.mjs reports/n3-cutover-truth.md reports/scorecard/cxn3/build-status.md` | 0 | links-reports.log; report links resolve. |
| `python3 reports/scorecard/cxn3/audit.py` | 0 | integrity.log and secret-scan.log: scoped diff, no protected changes, no secret candidates. |
| `git diff --check origin/main` | 2 | whitespace-raw.log: only Node reporter indentation on blank lines in raw mutant logs; preserved. Source/docs check excluding raw logs exits 0 (exact command in integrity.log). |

The four pending filenames are Nov 3 siwe_nonces_server_only, Nov 4 v2_request_budgets,
Nov 6 voucher_cancel_reissue and Nov 7 voucher_race_guard (all timestamp suffixes 000000).
The exact names, all 17 SQL rows/booleans and apply/replay order are printed in schema.log.
The only budget table implemented is private.v2_request_budgets; no proxy table is expected.

Mutation coverage: anonymous 500 accepted; oversized 401 accepted; CORS origin weakened; 503 hint
removed; network failure accepted; route omitted; undersized body; migration row omitted; user-only
authority restored; existing wrong table substituted; CXN1 RPC signature changed. No mutant remained
in the checkout. Raw logs identify the specific failing assertion; scratch controls prove the harness.

## Open acceptance gaps

1. Live probe: nine OPTIONS return 204; eight anonymous POSTs return 401; eight oversized POSTs
   also return 401 (FAIL); both v2-boss-fight POSTs time out (FAIL). Handler auth at http.ts:69
   precedes parsing at :77 and returns 401 at :84. This is consistent with the live size findings;
   deployed source identity and timeout cause remain unverified. Do not weaken the 400/413 gate.
2. Deno: generator line 24 omits index-file aliases, while line 22 maps directory names only.
   Five './index' type imports × sixteen maps = 80 edges. Separate repair must generate explicit
   forge/index and bag/index aliases, regenerate maps, pass the guard/drift checks, and convert the
   existing deno-imports.test.ts:15 expected failure to an ordinary regression. Scratch diagnostic
   proves causality; real maps/functions/generator remain unchanged from main.
3. Full T7 / merge gate / independent grades: not claimed. Full suite, builds, browser work,
   production-config preview and post-merge/live checks remain with the coordinator. Browser ports:
   4320/4321/4322/4323; empty test backend config. No screenshots are needed for this card.
4. Live catalog, deploy/flag state, signed-in gameplay, Vercel rollback and manual rollback files
   are not verified. supabase-manual is absent. Local proofs do not authorize a deploy in this card.

Scope/integrity and secret-scan evidence accompany the logs. Initial link-check formatting and
incomplete diagnostic-copy failures were corrected; their raw logs are retained. Earlier report
PASS claims are historical, replaced by this builder's evidence in [the item report](../../n3-cutover-truth.md).
