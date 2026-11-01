# Mega scorecard — living draft

**ACTIVE: explicitly resumed2026-11-01.** Latest authority: [balanced resume](mega-resume-2026-11-01.md); read [current handoff](MEGA-CURRENT-HANDOFF.md).

Historical BASE0 round1 failed on5db4949; C was interrupted and never scored. Repaired280ff4b is coordinator-verified; round2 A passed97.64285714285714. Original B was interrupted by model-provider429 without a grade; a fresh independent recovery B is running. No mission merge exists.

| item | branch | PR | round | C1/25 | C2/20 | C3/10 | C4/15 | C5/10 | C6/5 | C7/10 | C8/5 | total | grader A | grader B | grader C | auto-fails | result | merged commit | main re-test | live check |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

| BASE0 | ai/codex-mega-deno0 | #246 | 1 | A22.9167/B25 | A0/B20 | A10/B10 | A14/B14 | A6/B8 | A5/B5 | A10/B10 | A5/B5 | A0(final)/B97 | cards/BASE0-GA-R1/grade.md | cards/BASE0-GB-R1/grade.md | INTERRUPTED; no score | A7 | FAIL; superseded candidate | NONE | NOT RUN | baseline only |

Scores will be entered only from independently observed, cited evidence. NOT VERIFIED is not PASS.

| BASE0 | ai/codex-mega-deno0 | #246 | 2 (280ff4b) | A25/B— | A20/B— | A9.642857/B— | A13/B— | A10/B— | A5/B— | A10/B— | A5/B— | A97.64285714285714/Bpending | cards/BASE0-GA-R2/grade.md | cards/BASE0-GB-R2-RECOVERY; original B interrupted/ungraded | not required yet | A:none; B:pending | A PASS; recovery B RUNNING; deployment quota hold | NONE | NOT RUN | baseline only |

Round2 A satisfies all required floors and zero auto-fails. It personally killed27/28mutants with10greencontrols; the mis-targeted survivor remains in the denominator. C4 deductions: extra context/status row and repeated NEXT/Next wording. Original B partial command results are preserved but never counted as a formal grade. The final item score and any third-grader requirement remain undecided until recovery B issues an independent result. See cards/BASE0-GA-R2/grade.json for unrounded values and evidence.
