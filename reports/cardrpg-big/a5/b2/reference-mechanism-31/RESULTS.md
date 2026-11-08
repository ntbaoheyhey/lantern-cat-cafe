# Reference mechanism31 — isolate adopted Hush behavior

The fixed calibration changed because the earlier Hush correction removed replacement attacks. Restoring only the original enemyAct function reproduces all4,000 original outcomes exactly, despite keeping current pacing, gear, AI, recommendation code and the fatal-followup guard. Restoring the intermediate utility-suppression function then reproduces every current reference outcome. The later credit correction changes none of these4,000 outcomes.

|Transition|Scene4: Spool Ram + Button Guard|Scene5: Teacup Healer + Kettle Knight|Other six scenes|
|---|---|---|---|
|Original fallthrough → stopped utility|262→499wins;237improve/0worsen|288→242wins;87improve/133worsen|Every outcome exact|
|Stopped utility → accurate suppression credit|499→499;every outcome exact|242→242;every outcome exact|Every outcome exact|

Fifteen full explanatory replays cover five prospectively selected scene/seed pairs across three snapshots. All recreate exactly through the public replay API; initial battle setups match between snapshots.

- Scene4/seed3 first diverges on Button Guard round3: an unexpected132HP hit becomes the suppressed shield turn. The route changes from loss to win.
- Scene5/seed5 first diverges on Teacup Healer round3:119absorbed damage disappears. Mochi's next divergent choice at index15 changes from shielding itself to attacking Kettle Knight. The original wins and corrected run loses. Seed2 has the same early action divergence but improves from loss to win.
- Current versus utility-only changes suppression event wording in these examples; all choices and results match. These observations do not claim that event wording is the only possible effect of the credit fix in other teams.

A stopped attack changes automatic decisions and RNG consumption. Preventing immediate damage does not guarantee a better final result. These examples do not alone establish a new AI defect or justify restoring the contradictory attack. No production, difficulty, weights, fixture or gate changed; median57.8% stays within the registered reference range. Saturation in scene4 remains visible and prevents treating this as broad balance closure.

[Pre-run registration](REGISTERED-METHOD.md) · [paired audit](audit.json) · [fallthrough traces](fallthrough/traces.json) · [current traces](current/traces.json). New diagnostic samples8,000; current4,000 outcomes reused;15 explanatory replays. AllTRAIN. First build failed before any sample because the isolated source lacked transitive dependencies; original log and dependency hashes retained. Corrected build uses identical missing files, with no sampling method or registered combat change.
