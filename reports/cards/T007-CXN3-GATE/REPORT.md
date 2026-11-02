# T007 — CXN3 merge gate: BLOCKED

PR [#244](https://github.com/ntbaoheyhey/taskbar-hero/pull/244) remains OPEN / DRAFT.
The owner must recover a complete current-live Edge Function source package and a tested restore
procedure before the authorized backend release can proceed. The authenticated Supabase CLI
refused unsafe extraction; no attempt was made to bypass its guard. No merge, migration,
function deployment, Vercel setting change, or deployed `--v2` check occurred.

## Changes and dependency verification

T006's handoff file is absent. Its underlying merge dependency is satisfied: #250 merged on
2 Nov at 10:16:59 UTC as main `9c457a3e56b7c5813fa40e6aa20b0c14242ef26a`.
T014's recorded green current-main gate supplied context; fresh T007 results below do not rely
on its previous pass. The named standalone resume file could not be located. The named ledger's
CODEX-CLI-RESUME-PROMPT and mega-mission provide the recovered serial-gate and safety rules.

The existing #244 branch was reused. Main was merged without rewriting history in
`cd3b1a561bf1dce314e41cfe599e8e7e65c0e3a8`. Commit
`db0f9d64c408825a832d808bc31cfd88f1c3a014` corrects the stale runbook import-map warning and labels
older report findings historical. Both commits end with [skip ci], use the required author,
and were pushed only to `ai/codex-n3-cutover-truth`. Final candidate tree:
`df72d5845555bc3b928ff00c058f5b49211bac42`. No application, package, contract, function,
migration or workflow source differs from current main as a result of this task's correction.

## Acceptance self-check

| Criterion | Result | Evidence |
| --- | --- | --- |
| PR #244 merged or documented blocker | Documented owner-dependent blocker; PR deliberately unmerged | evidence/final-github-readback.log, evidence/live-source-download.log, evidence/backend-rollback-readiness.json; OPTIONAL-USER-STEPS.md |
| Main + live green | Fresh existing-main and merged-core/legacy live verification; extended CXN3 v2 gate remains unrun and blocked | evidence/main-*.log, evidence/legacy-live.log, evidence/live-phased-r2/summary.json, evidence/stable-window.json |

Status remains BLOCKED. These observations do not mean CXN3 has completed its full merge gate.
Separate fresh self-review A/B passes were not completed, no score is issued, and no grade >=92
is claimed. The no-live-`--v2`-before-merge rule remains in force. The optional steps document
specifies recovery and resumption; it does not ask permission to bypass the rollback requirement.

## Fresh candidate preflight on db0f9d6

Typecheck, lint, full unit/script suite (2,393 passing cases), classic build, bundle secret scan,
links (825 checked; zero broken), Deno import guard (18 clean), integrity/secret audit, all 11
mutants and both controls pass. The inherited 2 expected failures and 11 skips are unchanged.
The 1600x900 complete browser suite passes 289/289 with workers=2 and retries=0.

The safe verifier from ledger c68b53e, with FORCE_ALL=1, retained a separate clean checkout.
VERIFIER_HEAD=c68b53e; PR_HEAD=TESTED_HEAD=db0f9d6; BASE_HEAD=9c457a3. It passes installation,
Deno drift, typecheck/lint/units/build, the full 1280x720 browser suite (289), pinned contract
setup, Forge (96), ABI drift and clean-worktree checks. It was invoked without --comment.
No UI change or new browser spec is introduced by CXN3, so UI-specific audits and changed-browser
repeat checks are not applicable. Exact commands and logs are in evidence/command-receipts.json,
evidence/safe-verifier-raw.log and evidence/final-mutations/.

## Existing main and live

Target/tested main: `9c457a3e56b7c5813fa40e6aa20b0c14242ef26a`, tree
`3c662e8e7e9e28c9bb0be25045ac984c2f10fa43`. Fresh typecheck, lint, 2,380 passing unit/script
cases, build and both complete desktop browser suites pass. The inherited 2 expected failures
and 11 skips are unchanged. Browser exits are recorded individually before publication.

The legacy live checker passes all 22 checks. Fresh guest contexts pass all eight merged-core
stages at both 1280x720 and 1600x900, with zero browser/network errors. This is the approved
merged-core phase, not the future nine-stage/on-chain transaction path. Two fresh builds compare
32/32 emitted/public assets with production, with identical HTML, full entry manifest and asset
records over 254.294 seconds (12:37:10.900–12:41:25.194 UTC on 2 Nov). Both Vercel contexts
for main report success. This proves frontend artifact equivalence, not deployed Edge Function
source identity. No production key or bundle bytes were stored; configuration stayed in memory.

## Backend release blocker and limits

The authenticated catalog-only SELECT found all 17 expected schema objects present. This is an
object inventory, not migration history, function-body equivalence, or license to replay SQL.
All nine live v2 function records have update time 2026-10-31T03:54:09.558Z. Their ACTIVE state
and this timestamp do not establish that CXN3-FIX is deployed or that v2 health is green.

The exact read-only export attempted was:

    supabase functions download v2-state --project-ref qoalewtxflagoprrxrgh --use-api --workdir /tmp/tbh-t007-live-source

It exited 1 with UnsafeFunctionDownloadPathError for the bundled auth dependency outside the
allowed function directory. Only two files were partially extracted; both match main, but the
full shared HTTP/auth dependency graph was not recovered. Do not infer full release identity
or rollback readiness from those matches. No live v2 probes were made. The absent manual rollback
files are additionally noted; no migration is proposed because catalog objects already exist.

The owner action is in reports/OPTIONAL-USER-STEPS.md under T007: recover the complete deployment
source/maps and a tested restore procedure from the original deployment source or a supported
Supabase export/support route. Do not bypass unsafe extraction or send credentials. Keep #244
unmerged until that safety prerequisite and the remaining full gate are resolved.

## Retained failures and hygiene

The initial 1280 browser run on cd3b1a5 had 20 failures because a concurrent root build cleared
the nested classic/server output directories. The isolated rerun on that head passes 289;
the corrected head is separately covered by the safe verifier and final 1600 run. No assertion,
timeout or retry was changed. Initial failures, screenshots, and raw logs remain available.
The first artifact build refused the untracked CLI-created metadata directory; that failure is
retained, metadata moved aside, and the clean-checkout rerun passes. One metadata-display Python
snippet had a syntax error and was corrected without repeating its successful provider request.
A failed atomic docs patch made no changes; the corrected patch and its tests are recorded.

The secret scan redacted one inherited public Anvil test-key-shaped example from a diagnostic
excerpt; no credential is present in published evidence. Audit and mutation failures are deliberate
negative controls and must not be misread as unhandled suite failures. evidence/HARNESS-NOTES.md records
exact T014 command reuse and inherited metadata labels. The original dirty checkout is preserved.
GOAL.md and queue.json were read only. Repository remains private. No main push, Actions run,
.github change, destructive database write, wallet transaction, new asset or contest submission.
No agents, workers, timers or schedulers were used. Resume the same T007 after owner recovery;
no duplicate task is proposed.

Publication checks: the ledger branch retains one pre-existing broken reference to the absent
reference-research directory. The clean c68b53e baseline and modified-ledger checker outputs are
identical; candidate/main link checks are green. The full staged whitespace check flags original
test-log formatting (including deliberate mutant diagnostics). Raw receipts remain byte-preserved;
the authored report and ledger prose pass a separate whitespace check. These two publication-check
failures are retained and do not represent a product-test pass or a new link regression.
