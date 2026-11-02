# T001 — BASE0 STEP 1 a–d reconciliation

Status: DONE for the exact BASE0 head, using verified existing receipts. No test suite was rerun.
The task's starting assumption was stale: STEP 1 a–d was already published in ledger
commit 89664d7057df9a3f6720162538014d4da3e70e1a.
This audit rechecks evidence bytes, Git objects, tree identity, exit files and raw logs.

## Acceptance evidence

| Criterion | Result | Evidence |
| --- | --- | --- |
| Safe verifier recorded with all four heads | PASS, original execution; receipt audit passed | [Raw verifier log](../BASE0-POSTMERGE/74d60da/cli-forge-fixed/logs/verifier-raw.log), [reconciled result](../BASE0-POSTMERGE/74d60da/cli-forge-fixed/reconciled-result.json) |
| Deployed assets equal main 74d60da build | PASS at 2026-11-02T06:25:05Z; all 32 files, byte lengths and SHA256, stable entry manifest | [Artifact equality](../BASE0-POSTMERGE/74d60da/cli-20261102/artifact-equality.json) |
| Legacy check-live | PASS, prior bounded check; raw log and exit 0 rechecked | [Legacy log](../BASE0-POSTMERGE/74d60da/cli-20261102/logs/legacy-check-live.log) |
| Phased live journey at 1280×720 and 1600×900 | PASS on that same deployment identity; all required steps present, zero recorded errors | [Browser summary](../BASE0-POSTMERGE/74d60da/live-phased-cli/summary.json), [Forge scroll proof](../BASE0-POSTMERGE/74d60da/live-phased-cli/forge-scroll-r4.json) |
| Checkpoint committed and pushed on ledger | Original checkpoint 89664d7 is in fetched origin/ai/codex-mega-ledger ancestry; this reconciliation is a further docs-only ledger checkpoint | [Publication/ancestry audit](logs/tree-and-checkpoint.log), [receipt audit](logs/receipt-audit.log) |

Four recorded verifier heads:

- VERIFIER_HEAD: e4faf6351fc8163016f5450bd22ce3b41a4126d4
- PR_HEAD: 280ff4bed495fd28bd489eb5f2dcfd1910f21fc0
- BASE_HEAD: 74d60dab2cef8c31a3f2729d18719ff3021a9eda
- TESTED_HEAD: 1aaa829cbfe70972e29f11ed9158a70896a4cba4

PR/base/tested tree: 58b9abb2c30023dd33325603fa40bd3af13528a1.
The retained verifier checkout still has TESTED_HEAD and no tracked changes.
The original raw run records 265 browser passes and 96 Forge passes, with exit 0.
Earlier interrupted/failed runs and Forge setup diagnostics remain untouched.
The phased path checks current merged surfaces, including the boss lock and Craft surface;
it does not claim boss victory, completed crafting, on-chain proof, or the future nine-step flow.

## Commands run for this reconciliation

- Fetched main and ledger; queried PR #246 and private-repository metadata; checked remote refs and commit history.
- Direct Git rev-parse/status/cat-file/merge-base checks against the retained verifier and original checkpoint.
- Direct Python receipt audit: SHA256 and sizes of all 51 manifest files, including screenshots;
  compared those and four asset/legacy receipts byte-for-byte to checkpoint 89664d7.
- Parsed original verifier, artifact, legacy and browser output; checked all required exit files.
- Read-only HTTP GET of the live HTML; recorded only status, hash and asset paths.
- No verifier, build, unit, browser, legacy-live, wallet, database or deployment command was rerun.

[Audit data](audit.json), [receipt audit output](logs/receipt-audit.log),
[committed-byte audit output](logs/committed-bytes-audit.log).
Four preliminary Python command-construction attempts failed before doing any work;
their SyntaxError logs are retained. Corrected audit commands passed. These were not product test failures.

## Current state differs from the historical BASE0 gate

At 2026-11-02T10:10:35Z, current main is 9ee71d44e3d1f12d149e4defbbe11e5fa3c2b7a6,
a descendant of 74d60da after FXRB #243, CXP1 #240, CXL1 #248 and ART1 #247.
The current live HTML hash is 6079e15e79a402c21e69a513b96ac8110cb38a7915c2ef0e85b01983725e9edf
and entry is /assets/index-N5_1FrYv.js, different from BASE0's /assets/index-BjY7onxL.js.
Therefore the historical 32/32 result must not be described as today's 74d60da deployment
or as proof that today's live equals today's main. Current deployment source was not verified here.
See [remote state](logs/remote-state.log), [live observation](logs/live-entry-final.log).

T002–T005 already cover the successor PR gates and must reconcile their stale pending status
against Git before any work. No duplicate follow-up is created. No rollback, duplicate merge,
product modification or user action is required to close the exact-head BASE0 task.
All new files are Tier 1 evidence; adjacent living-report edits only reconcile that evidence.
No new grade, visual asset, API mutation, external message, Action or deployment was produced.
