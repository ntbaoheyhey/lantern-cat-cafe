# Independent judge-eye scorecard — cold-run evidence complete
Runtime b1e4398a8844fa51d2784760e92ed24528d13d2b. All3viewports complete. Desktop closed-audio-slider false positives independently adjudicated; phone attribution overflow is QA-4, MINOR; the phone path remains usable. Rubric source: docs/v4/JUDGING-MAP.md. Technical25/Avalanche25-only screening remains an unverified planning assumption.
Estimates below are QA judgment, not organizer scoring. All timings are shared-machine, indicative; no FPS/audio gate claim.

| Rubric line | Estimate0–5 | Evidence and limit |
|---|---:|---|
| Technical25 | 3 | Both fresh desktop paths complete in~204–206s, with no console/request errors and18verified receipts each. Battle starts in2clicks and~2.7–3.1s. Typecheck passes; the documented root test command independently fails7presentation tests (QA-5). Snapshot checks remain pending. Required metadata HTTP samples now pass after QA fixture repair; cold transfer exceeds8MB. |
| Avalanche25 | 3 | Eleven named contract/function types plus funding reached; every observed receipt shows time, fee, payer and hash link. Independent Anvil fee/payer/status checks pass. Public Fuji link resolution, sponsored latency and hosted end-to-end behavior are not certified. |

## Five largest point-loss risks, ordered
1. **Confirmed MAJOR, QA-2:**29.65MB battle-entry transfer against8MB. Large unit/rig images dominate. Evidence `../Q2/COLD-TRANSFER.md`.
2. **Unverified public proof:** local hashes do not demonstrate working public explorer receipts or the public sponsored workflow. Needed before awarding a strong Avalanche score; not a confirmed product defect.
3. **Confirmed MAJOR, QA-5:** the documented fresh-clone pnpm test command fails7presentation tests in2files; this costs reproducibility/Technical confidence. Root rules and Supabase tests pass. Snapshot and hosted artifact checks remain pending.
4. **Observed pacing risk:** first rewarded on-chain proof appears around99–102s into a five-minute session. This passes the stated180s QA target, but should be shown early in the recorded pitch. Native funding occurs just before the mint; the raw timing is a reward-checkpoint measurement.
5. **Confirmed MINOR, QA-3:** operator smoke instructions promise12YARN while the current withdrawal claim pays6. Correct the scripted explanation to match the cap. Evidence `../Q2/withdrawal-reproduction.json`.

## Coverage and caveats
- `q1-cold-1/results.json` retains original raw FAILs. The transfer failure is established; the six offscreen audio sliders are independently confirmed hidden in closed details and fit when opened (`layout-adjudication.json`).
-1440,1280 and390 battle/receipt screenshots visually inspected. No severe visible desktop clipping found. Phone attribution link is offscreen (QA-4), separate from the six closed-details false positives. At1280 the final screenshot already shows owned items,11.75YARN and15transactions; the first1440 proof screenshot was early and still loading.
-Keyboard reaches Play free and Start trial. This is not a complete accessibility or all-modal audit.
-Initial fixture lacked the package metadata postbuild; do not infer a product metadata defect from it. Future journeys await loaded wallet proof and exclude closed-details controls.
-Action inventory: `ACTION-INVENTORY.md`; large videos remain `work/v4qa/q1-cold-1/videos/`.

## Three-viewport results
| Viewport | Battle ms | Reward receipt checkpoint ms | Full path ms | Local receipts | Battle-entry bytes | Console/network errors |
|---|---:|---:|---:|---:|---:|---|
| 1-1440x900 | 3130 | 102179 | 204226 | 18 | 29,653,929 | 0/0 |
| 1-1280x720 | 2688 | 98563 | 206118 | 18 | 29,653,929 | 0/0 |
| 1-390x844 | 2641 | 95584 | 199961 | 18 | 28,682,215 | 0/0 |
Phone flow completes; letterboxed battle remains usable and the reward toast fits. Final phone wallet proof shows11.75YARN and15transactions. The toast can be dismissed; no modal trap was demonstrated.

Q1 completed 2026-11-17T02:05:57.037523+00:00 with evidence and findings; functional local path passes3/3, cold-transfer budget fails3/3, phone attribution has a minor defect, public Fuji proof remains outside this local verdict.
