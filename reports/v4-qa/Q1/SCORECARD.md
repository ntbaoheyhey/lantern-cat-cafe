# Independent judge-eye scorecard — active, not final
Runtime b1e4398a8844fa51d2784760e92ed24528d13d2b. Two desktop runs complete; phone and layout adjudication pending. Rubric source: docs/v4/JUDGING-MAP.md. Technical25/Avalanche25-only screening remains an unverified planning assumption.
Estimates below are QA judgment, not organizer scoring. All timings are shared-machine, indicative; no FPS/audio gate claim.

| Rubric line | Estimate0–5 | Evidence and limit |
|---|---:|---|
| Technical25 | 3 | Both fresh desktop paths complete in~204–206s, with no console/request errors and18verified receipts each. Battle starts in2clicks and~2.7–3.1s. Full local suites, snapshot reproducibility and corrected metadata checks are pending; cold transfer exceeds8MB. |
| Avalanche25 | 3 | Eleven named contract/function types plus funding reached; every observed receipt shows time, fee, payer and hash link. Independent Anvil fee/payer/status checks pass. Public Fuji link resolution, sponsored latency and hosted end-to-end behavior are not certified. |

## Five largest point-loss risks, ordered
1. **Confirmed MAJOR, QA-2:**29.65MB battle-entry transfer against8MB. Large unit/rig images dominate. Evidence `../Q2/COLD-TRANSFER.md`.
2. **Unverified public proof:** local hashes do not demonstrate working public explorer receipts or the public sponsored workflow. Needed before awarding a strong Avalanche score; not a confirmed product defect.
3. **Unverified reproducibility/submission:** full safe suite, snapshot scan/quick-start and hosted artifact remain unfinished QA items; do not present SHIP's own harness verdicts as independent acceptance.
4. **Observed pacing risk:** first rewarded on-chain proof appears around99–102s into a five-minute session. This passes the stated180s QA target, but should be shown early in the recorded pitch. Native funding occurs just before the mint; the raw timing is a reward-checkpoint measurement.
5. **Confirmed MINOR, QA-3:** operator smoke instructions promise12YARN while the current withdrawal claim pays6. Correct the scripted explanation to match the cap. Evidence `../Q2/withdrawal-reproduction.json`.

## Coverage and caveats
- `q1-cold-1/results.json` retains original raw FAILs. The transfer failure is established; the six offscreen audio sliders need the closed-details adjudication in `HARNESS-NOTES.md`.
-1440 and1280 battle/receipt screenshots visually inspected. No severe visible desktop clipping found. At1280 the final screenshot already shows owned items,11.75YARN and15transactions; the first1440 proof screenshot was early and still loading.
-Keyboard reaches Play free and Start trial. This is not a complete accessibility or all-modal audit.
-Initial fixture lacked the package metadata postbuild; do not infer a product metadata defect from it. Future journeys await loaded wallet proof and exclude closed-details controls.
-Action inventory: `ACTION-INVENTORY.md`; large videos remain `work/v4qa/q1-cold-1/videos/`.
