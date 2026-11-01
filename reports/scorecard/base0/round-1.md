STATUS: FAILED — grader A complete; grader B pending.

Candidate `5db4949096e93eedeb98dff94ef1ec7019485f96`, base `1fb25edf4c54ada0d161e3c1dd16a4c4550aafba`, PR246. No merge.

Grader A final0/100 due to A7; raw72.91666667. C1–C8:22.91666667/0/10/14/6/5/10/5. Complete findings and cited evidence: [grade A](../../cards/BASE0-GA-R1/grade.md).

| Lost points | Finding | Root cause / action |
| --- | --- | --- |
| A7; C1−2.08333333; C2−20 | Required1280repeat run:469pass/1fail, errors-notice.spec.ts81 cannot find craft-btn after countdown and phone-to-desktop resize.1600repeat:470pass. | Root cause not yet established. Preserve failed log; reproduce unchanged source with failure artifacts in isolated mega-base0-repair-r2. Do not increase timeouts, add retries or drop assertions. |
| C4−1 | Approved separate title/guidance context row remains different from reference. | Deliberate documented readability decision; preserve user-approved layout unless new evidence requires a change. This deduction is accepted transparently, not removed from grader score. |
| C5−2 | Unused HudProps.compact and forwarding argument. | Responsive ownership moved to CSS, leaving an obsolete API field. Remove the unused field and caller after the scored candidate is released. |
| C5−2 | Narrow shell-context repeats common declarations. | Responsive override duplicates unchanged display/alignment/background/flex properties. Retain only actual gap/padding overrides and verify both desktop and original narrow cases. |

Builder full and repeat passes remain valid historical observations on the exact head; they do not override the new independent failure. Grader B continues on the unchanged source. Apply any third-grader requirement after both results exist. A repaired source requires complete fresh exact-head verification and fresh independent graders.
