# SINGLE2 GALLERY B — self-graded (fresh pass)

Exact head `f5c0a0c2bcc5e869f937b487bfbc3069f490bfe4`. **95/100 PASS**. Clean detached checkout on separate ports; tests completed before this fresh diff/scope and native screenshot review. No unresolved defect was found in the final scoped change.

Typecheck, lint, build, script/package units, 1,467 web units and art checks pass. Related Playwright specs repeat three times: **24 executions per viewport per reviewer**, at 1280×720 and 1600×900. The one full-suite run per exact head passes **399/399 at each size** (A). Each reviewer passes 20 resize cases (five repetitions per size), 18 strict geometry views and 38 pinned axe scans with zero violations. Across A/B: resize 0/40, geometry 0/36, axe 0/76. Two expected package failures and eleven inherited skips remain disclosed, unchanged.

The runtime tree is identical to accepted stack `1eefc3ef6d828b06710c8be18feb08e90b099e3e`. Its measured nominal 60 fps/CLS 0, lazy Phaser and 14 mocked recovery cases remain applicable unchanged; they were not rerun or falsely attributed to a new product revision. No production asset or live backend acceptance is claimed.

Standalone artifact gate passes **24 repeated browser checks per reviewer**, across both sizes, all three HTML surfaces and the card index. Regeneration leaves tracked output unchanged. All 910 image hashes match (286 current candidate + 624 historical), all local destinations exist, videos play, filters work, pinned axe passes and pages make zero network requests. The four videos remain explicitly historical. Sixteen natural guest timing receipts are retained.

Full builder/test diff reviewed: new STACK coverage and the third standalone surface extend existing checks; no assertion threshold, retry or exclusion was weakened. Native gallery screenshots at 1280×720 and 1600×900 show readable release labels, table and links; current fixtures and historical captures are clearly identified.

Five points are reserved for local-only evidence, bounded automation and unverified deployed/native-runtime behavior, not a hidden failing assertion. Automated accessibility inspection is not a human screen-reader listening session.

[Exact commands and exits](b/receipt.json) · [Scope](b-scope.json). All raw logs and axe captures are alongside the receipt. The integration branch must never be merged; capacity still blocks release.
