# A3 task 3 — primary actions and portraits in the first viewport
REFERENCE: ../../memory/PROMPT-A3.md; functional.json; layout-comparison.json; ../../validation/a3-task3-accepted.json

SUPERSEDED by ../task3-fixed/CHECKPOINT.md (32a727af). This34cc8bf9 candidate passed portrait/action samples but deeper meta testing found complete Team cards2.53px below the1024 viewport. Its receipts remain historical; do not treat it as the current accepted artifact.
Collection places leveling beside the selected companion; Team starts the next chapter from its power panel; Equipment puts the selected piece and Equip action above the workbench. Invitations shows the featured card first and keeps earned costs/odds/pity visible. Prepare folds the explanation of difficulty; Result gives the MVP a larger card. All battles and economy rules are unchanged.
Main SHA256 `34cc8bf94be87e2e444a8333d2c1309d6f8c838329fa580d5a4155d3a2794801`, 26,120,309 bytes. Baseline-v1 is byte-identical. [1024 before/after](layout-1024.png) · [1280 before/after](layout-1280.png).

| Main action | Y before→after at1024 | Y before→after at1280 |
|---|---|---|
| Collection · Level up | 1484.6→355.1 |1491.6→377.5|
| Invitations · welcome |599.0→435.6|606.0→458.5|
| Team · Begin |1546.6→199.5|1627.0→213.1|
| Equipment · Equip |1137.5→309.9|1027.8→325.8|
| Prepare · Fight |189.3→183.3|203.6→197.6|
| Result · Complete |189.3→183.3|203.6→197.6|

The before images belong to the exact task1 artifact87305a07; after images belong to34cc8bf9. Captures are real browser UI, with current source/image hashes, viewport geometry and masked text backgrounds. Full portraits use contain; this is evidence for sampled screens, not universal art acceptance.
Five source gates pass (1,735 web / 1,020 rules, 421 E2E after retry). All 27 first-viewport screens pass; 2,631 text rectangles have zero active contrast failures (nine disabled controls recorded separately). The single full functional pack and saved-receipt audit are in progress. A first layout pilot clipped5px at the invitation portrait; specificity/spacing fixed it. A contrast pilot exposed a clipped odds-table heading; paper color restored active contrast. The old “Earn stamps…” fairness-copy unit expectation was updated to “Earned in game”, with the detailed source disclosure still asserted; failure log retained.
The old V2 idle-loop E2E timed out once; unchanged isolated and complete421 retries passed. Original logs and error context are retained.
Default24MB size gate remains missed with the artifact-specific32MB exception. Historical cold/startup/quality/balance misses and Lane B requests remain in the short report. No860 matrix run by A.
