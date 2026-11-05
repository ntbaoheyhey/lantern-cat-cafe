# Presentation UI needs v0

Writer: B. The contract and all outcomes belong to A. Stable IDs are used for rendering.

| Screen | Inputs / fixture | Required pure actions or previews |
| --- | --- | --- |
| Hub | starter and midgame account: team, currencies, chapter, quest progress | selectTeam; startBattle bridge |
| Collection | catalog of cats, owned/unowned, rarity, level, stars, role, original lore | filter is presentation only |
| Card detail | base/effective stats, skill IDs/descriptions, equipment, level/ascension costs | preview/perform level and ascension |
| Inventory / equipment | unique instance ID, item template ID, slot, fit, rarity, affixes, set, level, locked, equippedBy | previewEquip comparison, equip/unequip, lock |
| Enhance / forge / salvage | selected item and available recipes/resources | previewEnhance, enhance, previewForge, forge, previewSalvage, salvage; errors |
| Gacha / odds / history | banner catalog, exact bp odds summing 10000, pity thresholds and progress, costs, owned history | draw with supplied seed; result list; no purchase route |
| Quests / daily | objective, progress, claimed, rewards, deterministic local day | claimQuest, advanceLocalDay if designed |
| Codex | original gameplay rules, item/cat/set/skill definitions, rarity vocabulary | read-only |
| Battle rewards | outcome, chapter, wave, deterministic reward payload and eligibility | account->turn battle options; resolve completed battle->account |
| Relic design | item ID, supply cap, issuance path, current fixture eligible count, binding/tradeable classification | deterministic eligibility/forge preview; always design only, not minted |

Please export CONTRACT_VERSION, catalog constants, typed account snapshots, pure command reducer or named functions, errors, and fixtures from @taskbar-hero/game-rules/cardrpg.
Fixtures requested: starter, midgame across all rarities, banner odds+pity near guarantee, equipped team, victorious battle reward. A discriminated result with account/events/error allows consistent UI feedback.
Prefer one applyCommand(state, command) API plus selectors/previews to minimize coupling, but the UI will adapt to your API. Keep seed/run index/day explicit in local memory. Nothing saves to storage.
UI will show common/rare/epic/legendary labels with colour AND text, earned-only non-transferable points, visible pity, exact odds, and no random tradeable Relics.
If new hero roles are designed, publish mapping to existing guardian/witch/alchemist before C2; otherwise existing original models serve role variants.
