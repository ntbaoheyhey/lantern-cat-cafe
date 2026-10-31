# Design: runes, skills, drops and meta systems (draft)

All numbers below are DEMO numbers (see `demo/index.html`). They are not read by the game and change nothing in `packages/game-rules`.

## 1. Goals and constraints
- Make the game feel abundant (many things to find, plan and compare) while staying original and cat-themed.
- Publish odds and formulas in the game (UI/UX, Technical, Impact scoring).
- Keep: 5 gear rarities, 4 on-chain Relic tiers, no fungible token, Fuji only, server-authoritative claims.
- Not now: 10 grades, a 197-node account tree, 1,500 items, mailbox, trade ship, DLC pools.

## 2. Structure learned from the reference, and our version
Short form here; the full coverage table (reference feature, our version, demo screen, status) is the "Notes" screen of the demo.

| Pattern in the reference | Our improvement |
|---|---|
| Active skills with cooldown, ranks, delivery tags | 12 skills, category + tags, rank table with per-second damage, cooldown slider, live "boosted by" list |
| Point-gated skill tree columns | 3 paths x 4 tiers, free refund, presets, gate shown on every tier |
| Rune/relic sockets with resonance | 6 rune types, 4 tiers, sockets by rarity, twin runes; resonance only a concept |
| Chest tables with rounded odds | Exact odds, "1 in N", 95% simulator bands, dry-streak counter, optional pity |
| Stepped offline reward table | Stepped table next to the smooth curve it replaces |
| Cube level + unlock ladder | Workshop level + ladder with fees shown |
| Synthesis with great success | Blend nine with public odds (matches `forge-great-success.md`) |
| Stat stacking / caps hidden in wiki | One printed formula, cap beside each stat |
| Pets by kill counts | Companions with progress bars, equip 2 |
| Achievements with global rates, events | Same, with exact event rules and dates |
| Index site | Codex generated from our own registries |

## 3. Data model (TypeScript sketch, new files only)
```ts
type Tag = 'DAMAGE'|'HASTE'|'CRIT'|'BURN'|'BOSS'|'CDR'|'LUCK'|'SKILL'|'RUNE'|'GUARD'|'COZY'|'MELEE'|'RANGED'|'AREA'|'DOT'|'POISON'|'MULTI'|'STUN'|'CHAIN'|'MARK'|'HEAL';
type StatKey = 'dmg'|'haste'|'critdmg'|'crit'|'burn'|'boss'|'cdr'|'find'|'rune'|'skill'|'hp'|'dodge'|'regen'|'shield'|'cozy'|'runepow';

interface SkillDef { id: string; name: string; category: 'Strike'|'Burst'|'Zone'|'Support'|'Control';
  classes: ClassId[] | 'any'; unlockLevel: number; cooldownSec: number; damagePct: number; hits: number;
  maxRank: 5; rankDamageGrowth: number; rankCooldownCut: number; tags: Tag[]; fxId: string; iconId: string; }
interface PassiveDef { id: string; path: 'claw'|'whisker'|'paw'; tier: 0|1|2|3; maxRank: number;
  effect: { key: StatKey; perRank: number }; tags: Tag[]; iconId: string; capstone?: boolean; }
interface TreeRule { tierGates: number[]; /* points on this path to open tier n */ refund: 'free'|'fee'; pointsPerLevel: number; }
interface RuneType { id: string; effect: { key: StatKey; perTier: [number,number,number,number] }; shape: string; colour: string; }
interface RuneStack { type: string /* 'purr' or twin 'purr+yowl' */; tier: 0|1|2|3; count: number; }
interface SocketRule { socketsByRarity: Record<RarityId, number>; unsocket: 'free'; twinFactor: number; }
interface UpgradeRule { fromTier: 0|1|2; runesNeeded: 3; dustCost: number; pOk: number; pDouble: number; /* rest = fail, mercy returns 1 */ }
interface DropSource { id: 'mon'|'elite'|'first'|'rep'; gearChance: number; rarityWeights: number[]; materials: Record<MaterialId,{p:number;min:number;max:number}>; runeChance: number; runeTierByChapter: number[][]; }
interface PitySpec { enabled: boolean; afterDryGearDrops: number; grants: 'rare'; }   // economy change: sign-off
interface StepTable { stageLevel: number[]; gold: number[]; xp: number[]; }          // replaces one growth exponent: sign-off
interface CompanionDef { id: string; unlock: { target: string; count: number }; bonusKey: StatKey; perLevel: number[]; }
interface QuestDef { id: string; kind: 'daily'|'weekly'|'achievement'; goal: { metric: string; count: number }; reward: Reward; }
interface EventDef { id: string; start: string; end: string; modifiers: Array<{ key: string; value: number }>; }
interface WorkshopOp { id: string; unlockLevel: number; oneTimeFee: number; }
```
Display-only rule: every table above has a `toCodexEntries()` so the Codex, the docs and the simulator read the same registry.

## 4. Mapping onto `packages/game-rules` (no changes now)
- Follow the existing registry pattern in `packages/game-rules/src/v2/content/` (typed tables + tests + `scripts/gen-content-docs.mjs`).
- New, additive modules only: `v2/skills`, `v2/runes`, `v2/workshop`, `v2/meta` (pets, quests, events). Nothing edits `V2_CONFIG`, `CONFIG`, loot weights or forge odds.
- Existing `lootcheck` and `sim` get a read-only adapter so the Drops screen shows the real current chest odds first (Phase 1), and the proposed rune/material lines separately labelled "proposed".
- Combat integration (skills firing in `v2/combat`, passives feeding stats) is Phase 4 and is the only phase that changes behaviour. It needs Tier 3 sign-off.
- Server: skills/runes/materials would live in new tables with server-authoritative claims (same pattern as relic recovery). Schema sketch only in Phase 4; not applied.

## 5. Formulas (as shown in the demo)
- `auto DPS = ATK x hits x attacks/s x (1 + crit x (critDmg - 1)) x (1 + sum of dmg%)`
- `skill DPS = ATK x skill% x rankGrowth x hits x crit factor x (1 + sum dmg% + skill%) / (CD x (1 - CDR))`
- `final stat = (base + flat) x (1 + sum additive %) x product of multiplicative layers`; caps: CDR 75%, dodge 75%, crit 100%.
- Drop odds: `P(rarity r) = P(gear drops) x w_r / sum(w)`; chapter shift `w_r *= (1 + 0.18 x chapter)^(r-1)` for r >= Rare, then normalise. 1 in N = 1 / P.
- Simulator band: 95% = expected +- 2 x sqrt(n p (1-p)).

## 6. What needs the user's sign-off (numbers and scope)
| Item | Why Tier 3 | Default |
|---|---|---|
| Rune types, tier values, upgrade odds, dust costs | Economy numbers (M-D3 rune tree was after 21 Nov) | Docs/demo only until signed |
| Pity (guaranteed Rare+) | Changes drop economy | Off; show dry-streak counter only |
| Stepped reward table | Replaces `powerGrowth` style curve (C9 numbers) | Idea only |
| Workshop level and fees | New currency sinks | Post-cut-over |
| Blend/great success | M-D1 forge great-success decision | After cut-over |
| Rune Dust, Etch Ink | New materials = schema + loot table change | Not before sign-off |
| Companions, quests, events | New server state | Only if time remains |
| Resonance on Relics | Contract/metadata thinking | Post-contest |
Read-only phases (Codex tab, odds panel, stat page, planner) change no number and can ship first.

## 7. Risks
- Scope: 12 screens is a lot. Ship by phase; the Codex and odds pages alone already show the idea.
- Originality: keep names cat-themed; run the checklist in `art/STYLE-BIBLE.md` before merging any asset.
- Abuse: any new reward needs server-side caps and the existing rate-limit pattern.
- Balance: demo numbers were not simulated for balance; Phase 3 adds a `sim` run per table.
