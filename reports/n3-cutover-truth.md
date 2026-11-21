STATUS: PARTIAL

T007 update, 2 Nov 2026: main includes BASE0 and CXN3-FIX (#250). The integrated branch
passes the 18-function import guard, no-drift check, classifier tests and local schema tests.
The import-map findings below are historical and resolved by BASE0. The other receipts below
describe the earlier head, not the current merge gate. Full T007 gate and release evidence
will be recorded separately; no live `--v2` check is permitted before #244 merges.

# CXN3 — cut-over truth, card P/B

1 Nov 2026. Detached continuation from `458eebd`, based on `origin/main` `1fb25ed`.
Reuse [PR #244](https://github.com/ntbaoheyhey/taskbar-hero/pull/244); no push or PR edit in this card.
The local branch checked out elsewhere remains untouched. No deployment, live SQL, sign-in,
transaction, workflow, auth/function implementation change or additional agent was used.

Current build evidence: [build-status](scorecard/cxn3/build-status.md), with raw command outputs in
[logs](scorecard/cxn3/logs/). This is builder evidence, not an independent grade or merge approval.

## Acceptance against sections 10 and 11

| Line | Observed result | Evidence |
| --- | --- | --- |
| T1: actual switch, retired steps only in History | PASS | Nine [Node tests](scorecard/cxn3/logs/classifier.log), including the authority regression. Vercel env plus redeploy is the switch; D8 is dropped; rollback keeps rows. |
| T2: exact pending migration table | PASS | The same test compares sorted filenames newer than 20261102000000 to the table, including CXN1. Four files, listed below. |
| T3: one catalog query, every expected identity, all/current-old states | PASS locally | Four [PGlite tests](scorecard/cxn3/logs/schema.log): all 17 true; through Nov 2 ten true/seven false; upgrade and second application of all four pending migrations pass. Query also executes inside a read-only transaction. |
| T3: no SQL write keyword | PASS | [rg output](scorecard/cxn3/logs/sql-no-writes.log): exit 1 means no matches; the static test also enforces one statement and catalog-only relations. |
| T4: strict response classifier, no network in tests | PASS | [Node output](scorecard/cxn3/logs/classifier.log): 9 passed, 0 failed/skipped. Exact 401; 503 hint; 500 and network errors fail; wrong CORS rejects; oversized requires 400/413. Every repository v2 route gets all three probes without credentials. |
| T5: execute read-only live probe | EXECUTED; health FAIL | [Raw live output](scorecard/cxn3/logs/live-v2.log): 17 PASS, 10 FAIL, exit 1. Nine OPTIONS 204; eight unsigned 401; eight oversized 401; boss anonymous and oversized probes time out at the existing 15-second limit. |
| T6: no new broken links | PASS comparison | [Main](scorecard/cxn3/logs/links-main.log) and [current](scorecard/cxn3/logs/links-current.log) each have one identical broken path. [Touched docs](scorecard/cxn3/logs/links-touched.log) exit 0. |
| T7: full verify suite | NOT VERIFIED in P/B | Install and generated-map drift pass; affected Supabase typecheck passes. Full baseline checks belong to the separate coordinator run. Full e2e is explicitly deferred. Older reports do not satisfy this card. |
| Mutation strength | PASS experiment | [11 mutants](scorecard/cxn3/logs/mutations.json) each exit 1 with the intended assertion failing; both unmutated scratch controls exit 0. All scratch directories removed. |
| Flags OFF / local rendering | PASS component scope only | Existing [StageLayout tests](scorecard/cxn3/logs/flag-defaults.log): 11 passed, including unset flag => classic and enabled => stage. No flag implementation changed. Production preview/live G5 remains unverified here. |
| Deno deployment guard | FAIL; cause isolated | [Guard](scorecard/cxn3/logs/deno-imports.log): 80 unresolved edges. [Scratch diagnostic](scorecard/cxn3/logs/import-diagnostic.log) fixes only the generator exclusion in a copy; all 18 functions then resolve. Product files remain identical to main. |
| Top-to-bottom cut-over acceptance | PARTIAL / NO-GO for release | Authority wording and exact procedures are corrected; import guard, rollback prerequisites, full gate and live findings remain open. |

The pending filenames are exactly:

```text
20261103000000_siwe_nonces_server_only.sql
20261104000000_v2_request_budgets.sql
20261106000000_voucher_cancel_reissue.sql
20261107000000_voucher_race_guard.sql
```

The 17 SQL rows cover six base v2 tables, the integrity table and three RPC signatures, one
restrictive false nonce policy, the implemented budget table plus two RPCs, cancel/reissue and
CXN1 resolve RPCs, and the validated cancelled-status constraint. Every exact row and boolean is
printed in schema.log. The proposed per-IP proxy table is not implemented and is correctly absent.
No SQL inventory or migration implementation needed editing.

## Corrections and causes

**CORRECTED (P/B):** the inherited report called owner-only release steps a PASS. Operational docs
now use user-approved mission section 7: existing credentials only, local score/merge gates first,
additive/idempotent/reversible migrations before functions, rollback prerequisites, default-OFF flags,
and local fallback without credentials. This card's narrower read-only authority is explicit.

**CORRECTED (P/B):** inherited full-suite/wrapper PASS tables were results of earlier work, not
reruns by this builder. They are preserved in git history and old checks, but replaced here with
current targeted evidence and explicit full-gate gaps. The earlier eight-test/three-test counts and
18/9 live result are historical; the current counts are in the acceptance table. No live success is claimed.

The Deno cause is [gen-deno-json.mjs line 24](../scripts/gen-deno-json.mjs#L24), which excludes `index.ts` file aliases while line 22
only maps directory aliases. Five type imports of './index' occur in game-rules forge/craft:8,
forge/relic:2, bag/compare:4, bag/best:6 and bag/salvage:3; each is walked in sixteen game-function
maps, yielding 80 errors. A separate repair must generate explicit extensionless forge/index and
bag/index keys, regenerate all maps, pass the unchanged guard and no-drift check, and turn the
known-defect `it.fails` in [deno-imports.test.ts line 15](../supabase/tests/src/deno-imports.test.ts#L15) into a normal regression.
Otherwise a repaired guard makes that expected-failure test unexpectedly pass and the suite fail.
No auth, function, map or generator repair is included here.

Unsigned oversized 401 is a real live finding. Source ordering in
[v2/http.ts line 69](../supabase/functions/_shared/v2/http.ts#L69) authenticates first, admits budgets at line 70 and reads
the body at line 77; the unauthenticated catch returns 401 at line 84. This explains the source
behavior and is consistent with eight observed routes; deployed source identity is not proved.
The two boss timeouts have no confirmed cause. Neither finding is hidden by retries, extra
credentials, a larger timeout or a looser classifier. A 401 does not establish budget SQL presence.

The first diagnostic scratch copy omitted auth source and deployment JSON dependencies, so its
80-edge count assertion failed; [initial output](scorecard/cxn3/logs/import-diagnostic-initial.log)
is retained. Copying those existing read-only inputs fixed the experiment. An initial runbook
backticked import specifier was treated as a missing path; the wording was corrected and the link
check rerun (initial logs retained). These were local audit fixes, not live fixes.

## References and scope

Read the CXN3 required references: C3 gaps/go-no-go, cutover-v2, go-live, runbook, deploy,
check-live, flag.ts, all migration filenames and the four pending migration bodies, and v2/http.ts.
Cross-checked the security/cut-over proposals (numbers, recovery, auth hardening, budgets and state
integrity), chain-proof/Avalanche docs, generator/import guard and test harness, verify-pr,
check-links/check-bundle, rehearsal and browser tooling. The requested manual rollback file and
supabase-manual directory are absent here; no claim to have read an unavailable file or located it
outside this checkout. UI visual comparisons are not applicable to this docs/scripts/test card.

All changed files are Tier 1: operational docs (deploy.md link only), checker/schema tests and CXN3
reports/reproduction evidence. [Scope and integrity inventory](scorecard/cxn3/logs/integrity.log)
lists files and test-output console statements. No dependencies, migrations, functions, auth,
.env, credentials, assets, contracts or .github files were changed. The checker itself remains
unchanged from 458eebd, including the strict oversized classifier and timeout.

**CORRECTED (P/B):** the old “SECRET FOUND ... masked” note referred to an existing public Anvil
example in deploy.md; it did not mean the source fixture had been removed. This card changes only
the allowed link there and copies no key bytes into evidence. [Secret scan](scorecard/cxn3/logs/secret-scan.log)
checks the added diff and CXN3 evidence without printing candidate values.

## Open acceptance gaps / handoff

- Full exact-commit suite, builds, wrapper, e2e/repeats, bundle and production-config preview proof;
  coordinator owns the separate baseline and scheduling. P/B ran no full e2e or rehearsal.
  Reserve E2E_PORT_CLASSIC=4320, E2E_PORT_V2=4321, E2E_PORT_SERVER=4322, E2E_PORT_API=4323,
  with empty VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY when browser work is authorized.
- Strict live health and Deno guard are red. An out-of-scope import-map repair and any HTTP/auth
  ordering repair require their own tested cards. No deployment is permitted from this evidence.
- Live schema/history, Vercel flag/deploy state, signed-in play, tested Vercel rollback and matching
  manual migration rollback files are not proved by this unsigned probe. Local SQL proof is complete
  for the inventory; optional section 7 release prerequisites remain.
- Two independent graders and coordinator review; no grade, merge, push or post-merge claim here.

Delivery: detached HEAD for ai/codex-n3-cutover-truth; no merge commit; PR #244;
report reports/n3-cutover-truth.md; STATUS PARTIAL, ready for coordinator review of card P/B.
