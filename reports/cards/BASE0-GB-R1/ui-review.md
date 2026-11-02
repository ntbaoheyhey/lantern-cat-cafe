# Independent UI review

Scope is BASE0 prerequisite compatibility, not completion of the queued redesign cards. Exact candidate5db4949; reference reports/ui-redesign/index.html through corrected R2captures. Personally viewed all8 R2 PNGs (Home+Bag, app+reference,1280x720+1600x900), checked18 comparison records, and source-diff checked unchanged core screens. The first reference capture is excluded because document chrome made its app bounds invalid. PNG inventory in delivered-figures.json records13 existing delivered images, each below200KiB; any later own2 home captures bring this to15. Mutant images/video frames are raw diagnostics, not delivered figures.

| Area | Independent observation | Disposition |
|---|---|---|
| Rail | All seven destinations retain order, icons, visible labels and active state; reference icon art/brand differ. | Inherited original art/data; source unchanged. Own14rail journeys plus6Forge subnav visits pass; keyboard.json and logs/keyboard-witch-ready.log. |
| HUD | Status row has160x10 XP, semantic green and power/wallet; candidate also retains progress/sync. Title and full guidance appear below header, displacing panel top by about54px vs reference. | Explained retained visible difference: -1 C4 under literal explained-but-unfixed anchor, even though accepted scoped decision. No full pixel-match claim. |
| Home | Reference stage left/context right; candidate hero/goal left, stage center, loot right. Candidate art and current stats differ. | Inherited unchanged layout source; assigned by user to CXR1/future cards. Not an unexplained BASE0 regression or a claim that redesign is complete. |
| Bag | Empty0/200 inventory vs populated12/40 reference; candidate small empty cells, rounded filters and different inactive detail panel. | Real fixture/content differences plus inherited unchanged layout; CXR1 owns design review. |
| Map/Forge/Market/Hero/Help | Eighteen R2 records cover all nine manifest screens across bothsizes, including Forge subtabs. Reference/current content differs as documented. | Existing baseline and queued card scope; own all-screen audit/effects checks pass; audit-review.json and effects-review.json. |
| Type, tokens, focus | HUD uses shared tokens and existing font stack. Currency labels preserved accessibly on narrow layout. Added contrast checks cover muted-on-surface2 and good-on-surface2. | Own root contrast suite passes; full-text geometry includes actual fallback fonts and errors. |
| Reduced motion | New HUD tests require transition0s and one canvas. Stage original two motion cases and manifest effects remain mandatory. | No limit changed. Results verified in results.jsonl and follow-results.jsonl. |

No unexplained BASE0 design difference identified from source and existing R2 evidence. The literal C4 deduction above does not transfer unrelated future-card acceptance into this prerequisite.

Final own captures at both sizes were visually reviewed with both actors present. Invalid early captures and the wrong-class half-canvas predicate are disclosed in capture-readiness-note.md; final capture uses the unchanged original ranged-witch contract. All15delivered PNGs are below200KiB.
