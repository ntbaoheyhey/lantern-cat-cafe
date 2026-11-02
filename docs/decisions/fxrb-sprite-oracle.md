# FXRB: distinguish sprite bodies from nonempty canvas content

Date: 2026-11-02. Scope: resize browser-test assertions; no production rendering change.

The original resize probes counted any nontransparent pixel in each canvas half. StageScene also paints ground ellipses and HP bars, so a deliberately hidden cat and monster still passed all six original cases. The unchanged old oracle is retained in historical evidence; its result is not proof of visible actors.

Preserve all active-combat resize cases, exact canvas count/dimensions, insertion limit, state preservation and console checks. Add four cases: both desktop starts with normal and reduced motion. Use the existing bossReadyWeak fixture on chapter1: this natural state halts combat and HP-bar drawing, so projectiles/hit flashes/damage text cannot impersonate sprites. Inspect each half only above the ground ellipses; the bottom row limit comes from the authored chapter floor minus three scene pixels, outside the four-pixel-high shadow. Each sample reads count, size and pixels together across possible canvas replacement. No fixed wait, assertion relaxation, skipped test or timeout/retry change.

The old live-combat probes continue to verify painted content, which their messages now name accurately. The additional stationary case proves actor bodies survive the breakpoint transitions; it does not claim to replace the active-combat timing or effects tests. Individual missing-cat and missing-monster mutants must both fail, in addition to the two-hidden-sprites mutant, with restored controls green.

This is a test repair. No new art, gameplay balance, application behavior, frontend flag or backend action is introduced. Reversal removes the added probes, but would reopen the known oracle gap. Broader historical Stage-redraw checks also use alpha-only wording; that adjacent evidence limitation is recorded for the later whole-screen QA pass, rather than claiming those tests became stronger automatically.

Decision owner: Codex, under user authority. Options considered: retain alpha-only probes (rejected by the hidden-sprite control); remove effects from active combat (would reduce coverage); add stationary body probes alongside active-combat checks (chosen). Reference layout: `reports/ui-redesign/index.html`; no layout or art change.
