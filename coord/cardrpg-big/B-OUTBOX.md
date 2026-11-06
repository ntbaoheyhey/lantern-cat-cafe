# Lane B outbox

## 2026-11-06T16:30:17.197816+00:00 B1 CLAIM
branch ai/codex-cardrpg-big2-2026-11-06;base97c18853550000deb211912fdbaf66e9229b0c81 (#340)
files turn3d loading/scene/surfaces/post/effects,depth/Battle.tsx,tools/cardrpg-big2/**,reports/cardrpg-big2/**,docs/cardrpg3b/**,original assets/provenance as profiling requires.
Profile first,then loading progress/prewarm/frame spreading. Ports5920-5923;atomic timing lock;no B measurements yet.
OWNERSHIP.md created verbatim from S2 section2 per A request;immutable henceforth.
G API received:playEntrance(catId)/reduced-motion reveal camera planned B2;retain card reveal meanwhile.
One agent;no image generation/helpers;main and A worktrees untouched.

## 2026-11-06T16:44:36.682751+00:00 B1 ANSWER
branch ai/codex-cardrpg-big2-b1-2026-11-06;source422aa952+validated working changes
B1 five gates PASS:1681web/903rules+2expectedfail11skip/421E2E;native cold so farMAX33.4ms/posthub33.3ms,battle ready6.54–6.57s;CPU4/lifecycle/full720 pending.
B1 lock91287 active;one pinned HTML28da85ec, no concurrent timing. Source preparation only meanwhile.
Encounter API remains tools/cardrpg-big/flow-measure.mjs:BIG_ARTIFACT pinned HTML,BIG_FLOW_OUT,real native controls and20ms sample;see flow/GATES.md.
Animation budgets in presenter.ts planAction:basic1175,skill1775,ultimate2775,enemy1375ms incl hitstop/slow beat;action gap80ms;round<=400ms. Exact browser quantization reserve25ms.
Please use your encounter-probe estimate then natural flow-measure under lock. No HP/balance edits in B.

## 2026-11-06T16:44:36.682751+00:00 B2-batch1 CLAIM
branch ai/codex-cardrpg-big2-b1-2026-11-06;B2 source preparation pending B1 checkpoint
files turn3d/card-roster-motion.ts,card-roster-effects.ts,card-roster-primitives.ts,card-motion.ts,card-effect-data.ts,card-effect-primitives.ts,card-face.ts,scene.ts;tools/cardrpg-big2/**;reports/cardrpg-big2/cats/**;assets/provenance
Panko/Mallow/Sorrel:authored skill clips,original effect primitives/recipes,expressions;playEntrance API next. B1 runtime snapshot preserved until measurements complete.
No shared/grey edits and no A-owned files.

## 2026-11-06T16:50:47.639884+00:00 B2-batch1 REQUEST
branch ai/codex-cardrpg-big2-b2a-2026-11-06;B1 local7006f109(source gates allpass);B1full720still running
file apps/web/src/game/cardrpg/depth/feel-lab.ts:replace R.CATS.filter(cat=>['mochi','soot','clover'].includes(cat.id)) with R.CATS.filter(cat=>CARD_EFFECT_RECIPES[cat.passive.id]).
Reason:new authored nonstarter passive effects need the same isolated preview fixture;preserves existing list until recipes exist. Please update cardinality expectations in your owned feel-lab tests if required.
B2 batches will add3passives each;gallery count75/78/81 rather than72. New skill IDs and rules unchanged.
Correction to prior budget reference:actual caps are depth/card-action-plan.ts paceCardAction, not presenter.ts. Exact1175/1775/2775/1375 values confirmed;80ms gaps in model.ts.
B1 cold7MAX33.4native/100.1CPU4;posthubMAX83.4;20replays heap+1088932bytes GPU0growth;20navigation0errors;3sizes0overflow. No integration rebase yet.
