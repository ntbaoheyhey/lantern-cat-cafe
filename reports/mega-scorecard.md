T001 reconciliation — 2026-11-02T10:15:04.155386+00:00. BASE0 STEP 1 a–d was already complete in ledger 89664d7.
Revalidated all four verifier heads, matching PR/base/tested trees, 55 original evidence files,
32/32 historical deployed assets, legacy check-live and phased live at both desktop sizes.
No suites rerun. Main has advanced to 9ee71d4 and the live entry changed; current-main/live
equality is NOT established by this historical BASE0 proof. Existing T002–T005 need Git
reconciliation before any work. [T001 evidence](cards/T001-BASE0-RECONCILE/REPORT.md).

Earlier entries below are historical snapshots, not current remote status.

**ACTIVE — 2026-11-02T08:05:14.050734+00:00.** Saved effects recovered: FXRB7f00ef5 full1280 272/272 and corrected keyboard/reference gates pass; original setup failure retained. No new score/product push/merge. [Verified state](cards/FXRB-CURRENT-R1/resume-20261102-3/REPORT.md).

**ACTIVE — 2026-11-02T07:54:16.606884+00:00.** Explicit resume; FXRB ungraded and keyboard failure retained. BASE0 historical scores unchanged.

**USER PAUSED — 2026-11-02T07:51:12.287587+00:00.** FXRB remains ungraded; reference/keyboard failure retained. BASE0 historical scores unchanged. No automatic resume.

# Mega scorecard — living draft

**ACTIVE SESSION 2026-11-02T14:28:16.266172+07:00; existing BASE0 scores unchanged. FXRB7f00ef5 has no grade.** Latest authority: [fresh-start mission](mega-resume-2026-11-02.md); read [current handoff](MEGA-CURRENT-HANDOFF.md).

Historical BASE0 round1 failed on5db4949 and C was interrupted/ungraded. Repaired280ff4b now has independent A97.64285714285714 and recovery B98, each passing every floor with zero auto-fails. The difference is0.35714285714286, so no third grader is required. Score gate PASS; BASE0 merged as74d60da. Provider Ready/exactSHA observed; actual-main safe FORCE_ALL verifier and phased live journeys PASS; artifact32/32 and legacy checker PASS.

| item | branch | PR | round | C1/25 | C2/20 | C3/10 | C4/15 | C5/10 | C6/5 | C7/10 | C8/5 | total | grader A | grader B | grader C | auto-fails | result | merged commit | main re-test | live check |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| BASE0 | ai/codex-mega-deno0 | #246 | 1 | A22.9167/B25 | A0/B20 | A10/B10 | A14/B14 | A6/B8 | A5/B5 | A10/B10 | A5/B5 | A0(final)/B97 | cards/BASE0-GA-R1/grade.md | cards/BASE0-GB-R1/grade.md | INTERRUPTED; no score | A7 | FAIL; superseded candidate | NONE | NOT RUN | baseline only |

Future scores require two separate self-graded (fresh pass) reviews with cited exact-head evidence. NOT VERIFIED is not PASS.
Latest user instruction2026-11-02 forbids further subagents/helpers. Existing BASE0 grades remain valid. The fresh-start user instruction explicitly replaces future independent reviews with separate A/B self-graded (fresh pass) reviews; never label them independent. All numeric floors and gates remain.

| BASE0 | ai/codex-mega-deno0 | #246 | 2 (280ff4b) | A25/B25 | A20/B20 | A9.642857/B10 | A13/B13 | A10/B10 | A5/B5 | A10/B10 | A5/B5 | A97.64285714285714/B98 | cards/BASE0-GA-R2/grade.md | cards/BASE0-GB-R2-RECOVERY/grade.md | NOT REQUIRED; difference0.357143 | NONE | MERGED; MAIN + PHASED LIVE PASS | 74d60dab2cef8c31a3f2729d18719ff3021a9eda | 74d60da core/build/full265each/repeat700each PASS; repaired wrapper265browser+96Forge PASS; old failure retained | ProductionReady/exactSHA observed; artifact32/32 and legacy PASS; phased journey PASS; future full nine-stage not yet applicable |

Round2 A:27/28mutants killed,10greencontrols; B:22/22kills,20greencontrols. Both independently ran700/700repeats at each size. C4 deducts the context/status row and retained NEXT/Next wording; A retains one mis-targeted mutant survivor in its denominator. Original B partial commands remain ungraded historical evidence. Grade arithmetic and decision are in cards/BASE0-MERGE-GATE/score-aggregation-r2.json; raw grades remain unmodified. BASE0 actual-main and current phased-live certification now PASS; see cards/BASE0-POSTMERGE/74d60da/REPORT.md.

Recovered state 2026-11-02T07:38:31.614876+00:00: FXRB core checks completed; repeat1280 active. No grade yet; all score thresholds unchanged.
