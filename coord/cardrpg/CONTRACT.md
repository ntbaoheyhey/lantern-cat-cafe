# Contract 0.1.0

Source: packages/game-rules/src/cardrpg/contract.ts at 0e3f29e0a2c8b1c0558b27dde0c244d63db76599.
Import: @taskbar-hero/game-rules/cardrpg.
Stable IDs are lowercase; rarity common/rare/epic/legendary; slots weapon/outfit/charm/relic.
All points integer; probabilities basis points, 10000 total. All item/card instances soulbound.
Result discriminates ok with state/events/value or state/events/error. Preview discriminates ok with value/error.
Commands are pure immutable local reducers. Seeds, day, run ids explicit.
No persistence, network, paid path or actual mint. UI labels chain data Design only, not minted.
C0 available: data, starter constructor, fixtures. RulesApi implementations and battle bridge follow.
B UI-NEEDS v0 accepted; no rendering fields belong here. Card.role maps each cat to the existing combat role/model.

## 0.2.0 (8eb0d6fcef9a961cd47103ea2dd9bbe5fc6d0351)
Core actions and previews now implemented. AccountState.version changed; fixtures regenerated. Result default value is void.
Battle boundary: startBattle -> pending state + battle/options; use standard engine; previewBattleRewards/finishBattle; abandonBattle.
All commands reject battle-time gear/level/team changes. Lock/quest actions may still be performed locally.
getBannerOdds provides next-pull pity odds; getDrawPool includes conditional item probabilities. No UI outcome math.
All claims remain local unsaved; supply counters are a design simulation, not contract enforcement.

## 0.3.0 (05621ab9)
Snapshot adds optional itemIds/instanceId/rarity for B visuals, and explicit meta-only balance/supply settings.
Full BattleRewardPayload.reward equals finishBattle.value including caps, first clear, gear and effort seal. Regenerated reward fixture comes from a real battle.
Five consumable recipes, epic tailoring and thread mending available in RECIPES. Stamp cost now 150 (B reads data).
No action removed; AccountState.version requires regenerated fixtures. 48 focused tests pass.

## 0.4.0 final freeze (8a31d175)
All UI actions and fields are preserved. Regenerated AccountState fixtures use version 0.4.0.
The internal makeItem draft allocator is deliberately removed from the public entry point; B has no call sites. Import no internal helpers in UI.
Combat snapshot freezes effect tuning (85% starter harmful-effect chance vs ordinary enemies; 93% with Moonwick four-piece) for replay. Chosen pantry supplies cost 10 threads plus one key; mending a key costs 40 threads.
Victory reward fixture uses a real winning seed 1 and asserts won:true at generation. All preview/settlement tests pass.
663 passed, 2 expected failures, 11 skips; workspace typecheck and source audits pass. Final measured gameplay is b65168c6; 0.4.0 changes only API hygiene and fixture version.
