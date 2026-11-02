# T001 retry 2 — BASE0 verification closure

T001 STEP 1 a–d is complete under the corrective release target explicitly assigned in T014:
**current main `9c457a3e56b7c5813fa40e6aa20b0c14242ef26a`**, tree
`3c662e8e7e9e28c9bb0be25045ac984c2f10fa43`. Current production does **not** equal historical
BASE0 `74d60dab2cef8c31a3f2729d18719ff3021a9eda`. The old SHA criterion is superseded,
not marked literally satisfied. [T014 dispatch/authority](../T014-CURRENT-MAIN-LIVE/release-target.json)
requires this reconciliation without rolling back merged successors.

This retry audited existing committed evidence and performed fresh read-only live asset requests.
It did not rerun passed source suites, rebuild, rerun browser journeys, merge, or deploy.

## Acceptance evidence

| Requested criterion | Result and evidence |
| --- | --- |
| Verifier results recorded in reports/ with all four heads | PASS. Raw verifier output, exit 0, commit objects and equal PR/base/tested trees rechecked by [audit.py](audit.py). See [receipt-audit.json](receipt-audit.json) and [audit log](logs/receipt-audit-r2.log). |
| Deployed assets equal main 74d60da build | Historical equality remains valid at its original observation time. Present-tense SHA is superseded by T014's approved current-main target. T014's two exact-main production builds matched all 32 files; this retry freshly fetched and matched all 32 hashes and lengths at 11:12:13.885Z–11:12:17.918Z on 2026-11-02. HTML/entry manifest and remote main were stable. [Fresh results](live-assets.json), [command](live-assets.mjs), [log](logs/live-assets.log). |
| Live phased path passes at both sizes | PASS, adopted from the unchanged T014 checkpoint: eight merged-core stages at 1280×720 and 1600×900, source/deployment identity pinned. [Phased summary](../T014-CURRENT-MAIN-LIVE/live-phased-r2/summary.json). Both occurred inside T014's 334.824-second equality window. |
| Checkpoint committed and pushed on ledger branch | This reports-only closure is published on `ai/codex-mega-ledger`, with `[skip ci]`. Final commit, push, remote equality and all-criteria checks are recorded in `.codex-orchestrator/verification/T001-retry2/` and `.codex-orchestrator/results/T001.json`. |

Legacy `check-live` also passed: its exact committed log contains `ALL CHECKS PASSED`, and its
exit file is 0. [Legacy log](../T014-CURRENT-MAIN-LIVE/logs/legacy-check-live.log).
Current T014 source gates are adopted only for their exact `9c457a3` head: typecheck, lint,
unit, build, 289 browser tests at each desktop size, 96 Forge tests, and Deno drift.
No historical 74d60da suite outcome is relabeled as a current-main result.

## Four historical verifier heads

| Identity | Commit |
| --- | --- |
| VERIFIER_HEAD | `e4faf6351fc8163016f5450bd22ce3b41a4126d4` |
| PR_HEAD | `280ff4bed495fd28bd489eb5f2dcfd1910f21fc0` |
| BASE_HEAD | `74d60dab2cef8c31a3f2729d18719ff3021a9eda` |
| TESTED_HEAD | `1aaa829cbfe70972e29f11ed9158a70896a4cba4` |

PR/base/tested tree: `58b9abb2c30023dd33325603fa40bd3af13528a1`.
Raw [verifier log](../BASE0-POSTMERGE/74d60da/cli-forge-fixed/logs/verifier-raw.log) contains
all four heads. This retry checked all 66 files in the three historical receipt directories
against original checkpoint `89664d7057df9a3f6720162538014d4da3e70e1a`, including the
previously verified 57-file subset. Every file matched. All 120 T014 manifest files also
matched their SHA256, length, and checkpoint `4b895739a69cca13b9e331d224e5e834cf8bf39d` bytes.

## Failures and limits retained

The historical failed 74d60da/live comparison, `StageLayout.test.tsx:175` timeout, unchanged
passing full unit rerun, and T014's initial disclosure-order harness failure remain untouched.
[Failure manifest](../T014-CURRENT-MAIN-LIVE/historical-failures/manifest.json).
The initial timeout occurred during concurrent build work; isolated and subsequent full tests
passed. No reproducible product defect was established, and unconditional first-run reliability
is not claimed. No additional stress suite was run outside this task's STEP 1 a–d scope.

This retry's first receipt audit looked for TESTED_HEAD in the main repository's object store
and failed. The object exists in the retained verifier repository; the corrected audit verifies
it there, without fetching or changing any source. [Initial log](logs/receipt-audit.log) and
exit 1 are retained alongside the corrected log and exit 0.
The first publication precheck used a root-level `vercel.json` path that does not exist;
the corrected check reads `apps/web/vercel.json` and confirms ledger deployment is disabled.
Both [initial](logs/prepublication.log) and [corrected](logs/prepublication-r2.log) outputs remain.

The fresh asset comparison reuses T014's audited production-build hashes; it is not a new build.
Frontend equality does not identify a unique provider commit or prove Edge Function identity.
The phased journey does not claim the future full nine-stage path, boss victory, funded crafting,
or on-chain transactions. No bundle bytes or keys were stored. No GOAL/queue changes, Actions,
direct main push, `.github` edits, database writes, migrations, edge deploys, or user steps occurred.
The named resume file was absent from the documented root/adjacent locations; scope was bounded
by the explicit T001 dispatch and T014's recorded STEP 1c phase authority.
