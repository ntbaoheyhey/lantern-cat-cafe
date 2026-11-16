# A6 Panko — film review in progress
Current production source: source-tree.json, commit41f73c847. Numerical six-case framing/facing passes; final regression2648 tests/typecheck/3F6 passes. Film/face/performance acceptance remains pending.

## Wave1 first inspection, 16Nov09:48UTC
Viewed once: raw/action-strips-r2/wave1-poses-{1,2}.jpg and wave1-field.jpg, all seven scoped windows at10fps. Both basic windows show K0 -> crouched K1 -> extended-pin K2 -> K0; four received hits use the tucked-shield K4 and bounded recoil. The ultimate holds the separate open-armed K5 behind three original painted oven doors. Basic contact reaches the Moth; the field stays fixed, faces remain visible and the doors sit behind Panko. The small crust cut is readable at the pin tip but needs the detailed contact/role receipt; the doors read as a substantial shelter and retain a long held plateau. No current-item visual failure found in these sheets; final judgement still requires wave3/boss/900, blind labels and face/perf.

| Action | Impact s | Actor | Observed drawing | Effect/reaction | Owner |
|---|---:|---|---|---|---|
| 3 | 3.088 | panko | K1 -> K2 -> K0 | pin reaches Moth with small painted amber contact cut | A6 |
| 4 | 3.971 | foe-0-button-guard | K0 -> K4 -> K0 | received-hit tuck/recoil; inherited attacker effect | nonhero |
| 5 | 4.855 | foe-3-needle-moth | K0 -> K4 -> K0 | received-hit tuck/recoil; inherited attacker effect | A7 |
| 6 | 5.738 | foe-1-sock-skipper | K0 -> K4 -> K0 | received-hit tuck/recoil; inherited attacker effect | nonhero |
| 7 | 6.621 | foe-2-teacup-healer | K0 -> K4 -> K0 | received-hit tuck/recoil; inherited attacker effect | A7 |
| 12 | 11.238 | panko | K5 contact hold | three painted oven doors behind caster; shield number | A6 |
| 21 | 24.920 | panko | K1 -> K2 -> K0 | pin reaches Moth with small painted amber contact cut | A6 |

Inherited bright/yellow/pink/mint effects around received hits belong to A7 (Needle/Teacup) or nonhero units. Teacup legacy damage also depends on the final SHIP healer rule baseline. This is not accepted as healer-only behavior. Reference comparison remains the previously inspected private melee study in LEARN/A6.md; no copied pixels or reference input.

Blind attempt1 scored10/12, retained as blind-*-r1-fail.json and raw/blind-r1-fail. Both mismatches are at exact state boundaries: wave3 frame120 expectedhit at350.1ms, visiblyK0; wave1 frame314 expectedcast at300.0ms, visiblyK1. R2 samples strictly >34ms inside held states to respect the existing +/-1frame recorder tolerance; no renderer/timing/threshold change and no relabeling of R1. New randomized labels must precede the new key.

Attempt2 (16Nov10:03UTC): 11/12 PASS; labels saved before key comparison. Crop03 visibly reads idle and remains labelled idle; the other11 are correct. Attempt1 stays10/12 FAIL. Interior sampling excludes only the documented34ms boundary tolerance; clocks, renderer and11/12 threshold are unchanged.
