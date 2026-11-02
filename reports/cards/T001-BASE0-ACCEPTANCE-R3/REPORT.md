# T001 attempt 3 — acceptance correction required

Status: **BLOCKED on orchestrator-owned task metadata**. The dispatch still says
“Deployed assets equal main 74d60da build.” That literal criterion is not satisfied
by the retained production evidence. T014 proves successor
`9c457a3e56b7c5813fa40e6aa20b0c14242ef26a`, not current production equality to
historical `74d60dab2cef8c31a3f2729d18719ff3021a9eda`.

The prior T001 retry's statement that the old criterion was superseded did not
amend its authoritative dispatch. This report corrects that closure claim without
altering the earlier evidence. GOAL.md and queue.json are read-only for this worker.
An explicit acceptance correction was requested; no response is presumed.

## Required correction

The orchestrator should change T001's deployment criterion to:

> Preserve the historical BASE0 74d60da observation evidence. For successor
> production verification, adopt completed T014's approved release target
> 9c457a3e56b7c5813fa40e6aa20b0c14242ef26a and its retained exact-build equality
> evidence. Do not claim that successor production equals 74d60da.

Alternatively, explicitly scope the 74d60da criterion to its documented historical
observation window. Then re-grade the retained evidence. This is a metadata change,
not a new T014 task, release, or source-testing task. See
[OPTIONAL-USER-STEPS.md](../../OPTIONAL-USER-STEPS.md).

## Acceptance audit

| Original criterion | Actual result |
| --- | --- |
| Verifier results recorded in reports/ with all four heads | PASS. The audit checks the original raw log, exit 0, all four commit objects, and identical PR/base/tested trees. |
| Deployed assets equal main 74d60da build | UNSATISFIED AS WRITTEN. T014's two comparisons prove all 32 files for 9c457a3 over its 334.824-second observation window. This is retained successor evidence, not a literal 74d60da pass. |
| Live phased path passes at both sizes | PASS from retained T014 evidence: eight merged-core stages at 1280x720 and 1600x900, with pinned source/deployment identities. Legacy check-live also passed. |
| Checkpoint committed and pushed on ledger branch | Existing checkpoint 57f287c276f1401d69d195394d69c8bfea8f6641 is published. This attempt's reports-only checkpoint and remote equality are recorded in .codex-orchestrator/verification/T001-attempt3/publication.json after push. |

[Receipt audit](receipt-audit.json), [real command output](logs/receipt-audit.log),
[exit code](logs/receipt-audit.exit), and [acceptance results](acceptance.json)
record the distinction between intact evidence and incomplete task acceptance.
The acceptance command is `python3 reports/cards/T001-BASE0-ACCEPTANCE-R3/check-acceptance.py`;
its [successful audit output](logs/acceptance-r3.log) records three retained passes
and the unsatisfied literal criterion. Two initial inline audit commands had a
Python newline-escaping syntax error before executing; their logs and exit 1 are
retained as `logs/acceptance.log` and `logs/acceptance-r2.log`. The file-based
command corrected that recording error; no source suite failed or ran here.

| Historical verifier identity | Commit |
| --- | --- |
| VERIFIER_HEAD | e4faf6351fc8163016f5450bd22ce3b41a4126d4 |
| PR_HEAD | 280ff4bed495fd28bd489eb5f2dcfd1910f21fc0 |
| BASE_HEAD | 74d60dab2cef8c31a3f2729d18719ff3021a9eda |
| TESTED_HEAD | 1aaa829cbfe70972e29f11ed9158a70896a4cba4 |

This attempt ran `python3 reports/cards/T001-BASE0-ACCEPTANCE-R3/audit-retained.py`:
66 historical receipt files and 120 T014 manifest files matched their committed
checkpoints. The audit also preserved prior failures, checked the live journey
receipts and source-gate exit files, and checked remote main and ledger refs.
It did not rebuild, run passed source/browser suites, probe live again, or deploy.
The named resume file remains absent at its documented locations; the explicit
T001 STEP 1 a–d scope and T014 handoff govern this narrow audit.

The original StageLayout timeout, passing unchanged rerun, historical deployment
mismatch, and initial T014 journey failure remain intact. No new product defect
was identified. Frontend artifact evidence does not establish unique provider
commit identity, Edge Function identity, or the future full nine-stage path.
