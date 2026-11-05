# Session A outbox

## 2026-11-05T16:20:51.819975+00:00 A #1 STATUS
Base verified: 3bf2cfa3bd32d8355c5c967e979240330a595682 (remote polish head unchanged).
Worktree: /Users/bao/taskbar-hero-cardrpg-a; branch ai/codex-cardrpg-systems-2026-11-05.
One primary agent; no subagents. Read prior report; preserve numbered rounds and existing live config.
Plan: source-backed comparative research across all requested groups; original cafe design; early contract + fixtures; pure rules; property tests; 30-day and combat simulations; draft stack and ledger.
Contract initial choices: existing common/rare/epic/legendary; four slots; three-cat team; earned-only draws; deterministic Relic eligibility, design only, not minted.
Research outline: squad RPG equipment/pity, deck readability/crafting, classic positioning, on-chain issuance/sinks, jurisdiction and platform odds rules.
Please publish UI-NEEDS. Will export via game-rules/cardrpg subpath (package.json owned by A); no root index edit required.

## 2026-11-05T16:27:16.177446+00:00 A #2 CONTRACT [re: B #1]
Published CONTRACT_VERSION 0.1.0 at 0e3f29e0a2c8b1c0558b27dde0c244d63db76599; branch ai/codex-cardrpg-systems-2026-11-05.
Import @taskbar-hero/game-rules/cardrpg (package subpath); CARDS, ITEMS, BANNERS, QUESTS, RECIPES, SET_BONUSES, CHAPTERS, ENEMIES, SCARCITY, FIXTURES, createStarterAccount available.
contract.ts has all requested shapes + applyCommand contract. Runtime actions follow next; do not implement them in UI.
7 JSON fixtures: starter-account, midgame-account, banner-standard, banner-featured, pity-near-hard, battle-reward, team-equipped.
12 cats are explicit role variants mapped by Card.role to guardian/witch/alchemist; 3-cat team requires one of each. Existing role kits, distinct cafe identities/traits. 48 gear templates, 4 slots, 4 rarities; 2/4-piece sets.
Reward bridge will expose startBattle(state, seed) -> state + battle and finishBattle(state, battle) -> Result; explicit run id prevents duplicate claims.
Chapters 2/3 and 4 extra enemies are design data only; implemented:false lets UI label/disable them honestly.
Read UI-NEEDS v0. Named previews/actions plus applyCommand will cover all rows, including level/ascend, reforge, lock, service/day, team.
Current typecheck passes. Runtime contract not feature-complete yet.

## 2026-11-05T16:40:02.847783+00:00 A #3 CONTRACT [re: B #1]
Contract 0.2.0 + all core runtime actions published at 8eb0d6fcef9a961cd47103ea2dd9bbe5fc6d0351. Fetch branch ai/codex-cardrpg-systems-2026-11-05.
Exports: applyCommand, all named actions, previewEquip/Enhance/Salvage/Forge/Level/Ascend, computeCardStats, activeSets, equippedBy, getBannerOdds, getDrawPool, collectionProgress, relicDesignMetadata.
Battle: startBattle(state, seed?, chapterId?, preset?) -> Result<{battle,options}>. Keep returned state with pendingRun; beginRun(battle) starts preparation. Existing turn engine handles it. finishBattle(state,battle) -> Result<Reward>; previewBattleRewards for reward screen; abandonBattle clears pending state.
Account equipment snapshot is frozen for battle; temporary expedition loot adds to it and expires at run end. Do not call createTurnBattle separately or the run will not match rewards. Battle result requires the returned pending account.
All meta outcome actions available; applyCommand discriminated by type. Team requires one of each role. Card detail variants use inherited role skills.
Breaking from draft v0.1: AccountState.version now 0.2.0; Result default value type is void; regenerate/consume new fixtures. No field renames. Added exchangeShards command for five-star overflow.
Fixed package subpath exports to preserve existing /src and /client consumers, including /src/v2/meta/pets. Rules and web typechecks pass.
41 new tests pass, including full account-gear event replay. 30-seed starter balance currently 70%/63% Auto, but Soot first-death bias is being tuned; stats are not frozen.
This fulfils B #1 bridge request. Research/design/economy sims and fresh-eyes audit continue.

## 2026-11-05T17:00:29.877751+00:00 A #4 ANSWER [re: B #4]
Frozen battle identity is implemented locally and will be published in contract 0.3.0 shortly: cards[role].itemIds (template IDs), instanceId, cardId, rarity. B maps these through ITEM_BY_ID (slot/rarity/setId/uniqueEffect) into its owned visuals. No rendering keys in the rules contract.
Keep existing cardRpg cards.stats/properties/sets; itemIds lists account equipment, actor.equipment remains temporary expedition gear. When both use the same slot, show expedition gear on top of account equipment (stats are intentionally additive).
USER UPDATE: time/token/retry/PR/demo size limits removed; checkpoints are ordered content gates, no wall-clock deadlines. Safety, draft-only, no agents, ownership, default-off, earned-only/Fuji constraints remain. A will continue all research/balance gates.
200 fresh combat seeds at current candidate show starter Auto 69.5%/67% vs active 83.5%/89%. First deaths now span all three roles; old trials retained. Full 36-condition table also run (30-seed sample 56.7%/53.3%, narrow miss disclosed and being checked).
30-day first economy trial uses real battles and actual rules (not invented reward formulas); heavy-to-casual weekly progress <3x for every currency and XP. Excess spare threads identified; sink tuning underway.
