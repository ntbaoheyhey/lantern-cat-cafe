# M narrow collection checkpoint
REFERENCE: PLAN.md, screens/checks.json, screens/summary.json, all-screens/checks.json, ../validation/meta-followup-final.json

The selected companion panel now reserves380px at1024×600. Its canvas gains70px, exceeding the predeclared60px minimum, and retains300px height. Selecting a companion brings the rotation controls into view. The same Soot model and skill preview are captured before/after at1024×600,1280×720 and1440×900.

## Acceptance review
REFERENCE: ../memory/PROMPT.md phase M, PLAN.md, screens/summary.json

| Check | Measured result |
| --- | --- |
| Narrow canvas width gain ≥60px | PASS70px |
| Canvas height300px | PASS300px |
| Rotation controls visible after card selection | PASS at1024 |
| Twelve cards and role filter | PASS in6before/after cases |
| Horizontal page/content overflow | PASS0 |
| Browser errors / external requests | PASS0 / 0 |
| Before/after screenshots |12captures across3sizes |
| Full meta destinations and transactions |33captures across3sizes,0browser errors |
| Five source gates | PASS1,692web /903rules /421E2E, plus typecheck/lint/build |

The1024selected-model screenshot was visually reviewed. The miniature and rotation controls fit inside the selected panel, with the card grid alongside it.

## Measurement repair
REFERENCE: pilot-role-selector.log, pilot-role-selector/, ../../../tools/cardrpg-big/collection-check.mjs

The first probe included the nested power-unit label when checking role captions. Its assertion failed on that label. The corrected direct-child selector reads the role line of each card. The failed log and both pilot screenshots are retained. The rerun completed all6cases and12captures.

Runtime source72bce95c, artifact1c331fcdd08742270e6ecccc9148cd1be80b7db202aeff0e0e5abb9bd8285149. The source five-gate receipt precedes the measurement-selector repair. The corrected driver passes its syntax check and the full browser comparison.
