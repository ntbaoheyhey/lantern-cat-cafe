# Guardian prevention valuation: source review

This is read-only attribution on selected runtime `6772eb343`, alongside the [eighteen exact replays](guardian-attribution.json). No new battle sample, changed coefficient or fourth S5 design candidate is introduced. The full TRAIN shares remain Mochi2 **0.38%** and Panko2 **0.29%**, below the unchanged 5% floor.

The saved replays establish availability: Mochi2 was legal on 40/40 observed turns and Panko2 on 74/74, with no selections. The following source properties narrow the next investigation; they do not quantify each property's contribution to those decisions.

1. `skills-v5/policy.ts` values shield as `min(shield, maxHp * .35) * .45`. It does not match shield value to the recipient's incoming damage window. Warm uses aggregate enemy attack rather than the actual affected targets. This can undervalue timely prevention and overvalue protection on a safe ally.
2. The same evaluator's `due` term counts an unacted foe only when its declared `targetId` equals the actor or the actor carries Shelter. It does not expand Row, All, Splash or random-hit recipients. The production shape resolver does expand those shapes, so this heuristic is not an exact incoming-damage estimate.
3. Bread cover supplies an ally-row shield plus self Shelter. Shelter changes `due`, but `due` only contributes through Decoy and Link cover terms. Shelter alone has no independent value term. Link cover is also multiplied by the ally's missing-HP fraction, making it zero at full HP. These choices intentionally avoid counting redirected damage as a free heal; their prevention benefit remains incompletely represented.

The automatic controller also grants a 200-point removal bonus when any enemy falls, including Binding Threads. That is established source behavior, not evidence that this bonus alone causes the guardian misses. The separate thread weight of 0.2 applies to actor value, not that removal bonus.

The smallest future TRAIN investigation is to value one concrete impending protection opportunity, including its actual recipients and the protector's cost. Compare the same saved decisions and paired pacing outcomes before changing a coefficient. Preserve the rejected broad cooldown package: it produced 17.967 normal rounds. Keep this issue **PARTIAL** after the three S5 packages; any change after acceptance requires a newly registered block.

Sources: [V5 policy](../../../../../packages/game-rules/src/cardrpg/depth/skills-v5/policy.ts), [automatic controller](../../../../../packages/game-rules/src/cardrpg/depth/policies.ts), [kits](../../../../../packages/game-rules/src/cardrpg/depth/skills-v5/kits.ts), [shape resolver](../../../../../packages/game-rules/src/cardrpg/depth/skills-v5/shapes.ts). Current OFF8250, fallback180/45 and six source gates remain exact in [selected closure](../../s5-selected/audit.json). No renderer or compatibility code changed.
