# CXP1 demo mechanics review

2026-11-01. Current review, not a UI gate. Opened the static rune demo in
Chromium at 1280x720 and 1600x900, selected its corresponding size, visited all
twelve demo tabs, then exercised the Companions screen. Reduced motion paused
the demo animations. Keyboard Enter operated treats and equip/unequip. Hunting
advanced goal bars, adoption enabled, feeding increased a level, and the third
equip kept two companions by replacing the oldest. No page/console errors.
Raw evidence: [demo-review.json](demo-review.json),
[corrected command](logs/demo-review-corrected.log). Two hunts were needed before
the first locked companion could be adopted; the initial harness assumed one
and failed. Its failure remains in [the initial log](logs/demo-review.log).

| Mechanic | Demo observed at both sizes | CXP1 contract | Disposition |
| --- | --- | --- | --- |
| Roster | Six placeholder companions | Twelve original cat-world IDs/names/flavour | Deliberate; no demo content adopted |
| Progress | Target-specific hunt/boss goals with bars | One acknowledged-idle-kill aggregate; per-pet threshold/progress | Deliberate; client has no species history |
| Unlock | Ready then Adopt | Automatic level one at exact threshold | Deliberate; no new action or currency |
| Levels | Treat button consumes Yarn; four display levels | Three DEMO_PREVIEW steps from counts; no cost | Authorized preview decision |
| Equip | Two, duplicates toggled, third evicts oldest | Two unique unlocked pets; duplicate/third requests explicitly rejected; separate unequip | Stricter assigned semantics |
| Bonuses | Active-looking passive percentages in the demo panel | Unitless preview labels, never inputs to power/drops/forge/server | Runtime integration belongs to CXG1 |
| Layout/art | Demo grid and equipped-summary panel | No new Pets UI/art in CXP1 | CXP2/ART2 acceptance remains separate |

All six current PNGs were opened for visual inspection. Each is below 200 KB;
capture is opt-in via SCREENSHOTS=1. Initial and exercised Companions captures:
[1280 initial](demo-1280x720-initial.png), [1280 after](demo-1280x720-after.png),
[1600 initial](demo-1600x900-initial.png), [1600 after](demo-1600x900-after.png).
Built-app Home: [1280](home-1280x720.png), [1600](home-1600x900.png).
The 1280 Home next-action pill still clips its text; this pre-existing shell
finding is outside CXP1. No app CSS, art, tokens, nav items or UI strings changed.
The demo's outer explanatory header adds height beyond its nominal stage size;
these captures document mechanics, not a no-document-scroll claim. Full screen
audits, effects, contrast and shell comparison remain coordinator/UI-item gates.
