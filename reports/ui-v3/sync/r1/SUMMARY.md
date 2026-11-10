# Sync refresh R1

Merged published Lane B M5 `440ec28902cac31f8f76634e908856c942dd41df` ([#425](https://github.com/ntbaoheyhey/taskbar-hero/pull/425)) after the registered fifteen-minute wait. M4 is its ancestor. Merge `423585913e77de1cfc94bc398dee0222f8dce31d` has exactly the same Git tree as previous U9: this closes divergent branch history; all B content was already integrated. No conflicts, no runtime or rule changes.

G1 PASS (type/lint/1,867 web tests/build), G2/G5 and all 37 UI specs PASS, G9 exact protected-source/hash checks PASS, G10 421/421 PASS with zero flaky/skipped tests. Additional 24 axe scans clean; all 291 restored assets exact. Rebuilt artifact SHA is unchanged: `2a7bef0551b40376c8d51fafbd35556e4870ababc08d06de60196d5a3d9c95a5`, 31,203,011 bytes. Build receipt source `f13c622a16b441cc1a4912fa44dddcca364ca06b`, runtimeDirty=false. Because artifact bytes are exact, all 56 existing AFTER shots still apply; two fresh 1280×720 Home shots were captured and visually reviewed before publication.

Refreshed offline natural fight 13.758 s; CPU4 full interactive 1,357.2–1,376.0 ms, still PARTIAL against 223.3 ms. Sixty-second idle zero long tasks and zero draws. No gate changes. Self-score remains 8.475/10 because the runtime/artifact is unchanged.

Fresh-eyes gaps: noticeable cold opening (U, needs packaging work beyond a small fix); prototype boss art (B, current art R1 remains PARTIAL); flat Home depth (B renderer/U integration, the 3D trial failed performance). No new UI defect was observed in the fresh captures. Remaining stop conditions are not satisfied: no next A descendant report integrated, no PASS art/ART-REPORT refresh, no STOP-UI, deadline not reached. Resume ten-minute shell watch.
