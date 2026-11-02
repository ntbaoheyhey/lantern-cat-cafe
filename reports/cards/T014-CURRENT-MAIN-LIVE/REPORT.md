# T014 — current main and production gate

Verified target: `9c457a3e56b7c5813fa40e6aa20b0c14242ef26a`.
Tested HEAD is the same commit; tree `3c662e8e7e9e28c9bb0be25045ac984c2f10fa43`.
This fresh worker performed T014 only. No product commit, PR, merge, rollback or deployment was needed.

## Release-target reconciliation and T001 closure

The orchestrator explicitly dispatched corrective task T014 (`source: corrective-of-T001`),
naming current main 9c457a3 and requiring its exact-tree release gate without rolling back successors.
[release-target.json](release-target.json) records that dispatch, target, read-only queue/GOAL hashes
and historical checkpoint. This is the existing user/orchestrator authorization, not a new approval
invented by the worker; GOAL.md and queue.json were not edited.

T001's historical proof remains valid for BASE0 `74d60dab2cef8c31a3f2729d18719ff3021a9eda`
at its historical observation time, preserved in checkpoint `89664d7057df9a3f6720162538014d4da3e70e1a`.
Its stale present-tense equality assertion was rejected by the T001 verifier and is superseded by
the approved current-main target above. **Current production is not asserted to equal 74d60da.**
The T001 report now links this successor gate; original BASE0 receipts are unchanged.
Git confirms intervening FXRB #243, CXP1 #240, CXL1 #248, ART1 #247 and CXN3-FIX #250
in [successor history](logs/successor-history.log); no duplicate work was merged.

## Fresh exact-tree checks

All commands ran directly on a clean detached checkout at `/tmp/tbh-t014-current-main`.
Frozen-lockfile install, source identities and versions are retained under logs/ and source-final.json.
This is fresh verification by one worker, not a new independent grading score.

| Check | Result | Evidence |
| --- | --- | --- |
| Typecheck / lint / normal build | PASS; all exit 0 | logs/typecheck.*, logs/lint.*, logs/build.* |
| Repository unit tests | PASS: 2,380 passing cases including 5 script tests; web 1,326, server 575 | logs/unit.* |
| Existing expected-fail/skipped cases | 2 expected failures, 11 skips / 3 skipped rule files; unchanged source, no new skips | logs/unit.log |
| Full browser, 1280×720 | 289/289 PASS; workers=2, retries=0 | logs/browser-1280.* |
| Full browser, 1600×900 | 289/289 PASS; workers=2, retries=0 | logs/browser-1600.* |
| Contract unit/fuzz/invariant suite | 96/96 PASS, no failures/skips | logs/forge.* |
| Deno map generation/drift | generator=0, drift=0 | logs/deno-drift.* |
| Final source/ref/port audit | exact HEAD/tree, clean checkout, remote main unchanged, four test ports free | source-final.json, logs/final-source-state.* |

## Production identity and live checks

Two **fresh** Vite production builds used `write:false`; all emitted files and public files
were compared in memory, including exact index.html bytes. Observed public configuration was
held only in memory: no keys or production bundle bytes were printed, stored or committed.
No Vercel settings or VITE_GAME_V2 value was changed.

[Before](artifact-before.json) and [after](artifact-after.json) each match **32/32** files by
HTTP status, byte length and SHA256. HTML, the full JS/CSS entry manifest and every asset hash
remain identical from **2026-11-02T10:34:33.965Z through 10:40:08.789Z** (334.824 seconds).
Entry: `/assets/index-N5_1FrYv.js`. HTML SHA256:
`6079e15e79a402c21e69a513b96ac8110cb38a7915c2ef0e85b01983725e9edf`.
[Stable window](stable-window.json); [exact-SHA Vercel statuses](deployment-status.json).
Both provider contexts succeeded. GitHub's deployment-list API returned no additional records;
no hidden provider commit metadata is claimed. Identical frontend builds cannot distinguish
different source commits that change only server code or documentation. This gate proves frontend
artifact equivalence to approved main, not an Edge Function deployment or backend source identity.

The legacy checker passed all 22 checks (logs/legacy-check-live.*), including bounded existing
auth-nonce behavior, anonymous rejection, relic assets and read-only Fuji calls; no wallet signing.
The corrected [merged-core live journey](live-phased-r2/summary.json) passed all eight stages at
1280×720 and 1600×900 within this identity window, using new guest contexts and real UI actions.
It checked current class-picker entry/help disclosure, class selection, visible canvas and genuine
idle reward, locked boss reason, Craft recipe/shortage action, earned Bag item/detail and wallet-required
Market. Both runs had zero browser/network errors, zero HTTP >=400 and no horizontal overflow.
Home/Forge/Bag screenshots were sampled visually; the 1280 Forge shortage button remains accessible.
No state/clock injection, signing, trading or live writes occurred during the browser journey.
CXU3/CXC2 are not merged (phase-prerequisites.json); no full nine-stage completion is claimed.

## Failures retained, not retried away

The first T014 live harness incorrectly searched for the guest disclosure only after dismissing
the initial help dialog. Both sizes failed that added check. The unchanged established
CXQ1-DEMO-PATH harness reads disclosure before dismissing help. R2 restores that observation order,
still requires visible disclosure, and retains it in the result. No product code or semantic
assertion was removed. Original logs, both failure screenshots/results, and both exact commands
remain in live-phased/, logs/live-phased.* and commands/; R2 results are separate.

The T001 verifier's failed current-production comparison and initial unit timeout are preserved
with the unchanged passing unit rerun and original paths/hashes in historical-failures/.
They remain historical failures, never relabeled as current-main results.
No current-main source suite needed a retry.
The initial staged whitespace check flagged one extra blank line at the end of this report;
it was corrected in a second docs-only commit. Its failed check log is retained in logs/.

## Publication and limits

Evidence is checkpointed on `ai/codex-mega-ledger` with a subject ending ` [skip ci]`.
Final commit, push/remote comparison and all-five-criteria audit are recorded under
`.codex-orchestrator/verification/T014/` and `.codex-orchestrator/results/T014.json`.
The committed acceptance-prepublication.json intentionally records publication as pending
at the time of its audit; the final local acceptance.json supersedes only that pending status.

Only reports/ changes are included. The original dirty checkout is untouched.
No direct main push, Actions run, .github edit, database-destructive write, migration,
edge deployment, real funds, external message, reference-asset reuse or contest submission occurred.
Repository remains private; no new user step or follow-up task is required for T014.
This finite window does not certify future deployments or the remaining mission queue.
