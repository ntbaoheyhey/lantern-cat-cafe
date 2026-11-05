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
