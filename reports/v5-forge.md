# V5 forge, salvage and Relic rules

Date: 2026-10-24 (Asia/Ho_Chi_Minh).
Repository: ntbaoheyhey/taskbar-hero (private).
Branch: `ai/codex-v5-forge`.
Base: fetched main `6744e9b15977186b411d68174ddd779e6b11b13e`.
Implementation pushed before this report was written: `0356567cc1f4728cf7f1a6d520bf6ffe42c0aed4`.

## Result

- Added pure craftBlock, seeded craft, salvage and relicForgeBlockV2 functions, with a local ForgeState type.
- Added exactly one export line to v2/index.ts.
- Craft returns a catalog itemKey, slot, optional weaponType, rarity, itemLevel and bonusLines; spent is { materials, fish }. It does not mutate balances.
- Ordered shortages: recipe, slot, Yarn, Fluff Tuft, Shiny Button, Catnip Crystal, Starlight Scale, Moon Pearl, Fish.
- Salvage returns a fresh copy of the registry's materials for the rarity.
- Relic cost reads RELIC_RECIPE (30 Yarn + 1 Moon Pearl). Checks daily limit, Yarn, Pearl. rollRelicRarity is the identical v1 function, re-exported.
- Regenerated all nine Deno maps; seven changed, auth maps stayed identical.
- No dependencies added. No GitHub Actions dispatched or triggered; reviewed workflow triggers (CI manual, deploy main only). No PR opened. GitHub's automatic push output includes a PR suggestion; it was not followed.
- All six required commands passed locally, including frozen install, regeneration with no drift, typecheck, lint, full tests and build. Full test total: 687 tests across 48 files; includes 31 forge tests. A separate forge-only run also passed all 31.
- Changed source files are exclusively the five allowed forge files, the one-line v2 export, generated deno.json files and this report.

## Assumptions and uncertainties

1. The available local design evidence is content/recipes.ts (its Forge section 5 commentary), the full content registries, and docs/proposals/schema-v2.md. No separate full Cat RPG plan file was found in this checkout. The user-supplied Forge requirements were followed.
2. The prompt does not specify a stage-to-item-level formula. Used floor(bestStage), clamped to 1..rarity.maxLevel, documented in craft.ts and tested. Nonfinite stages throw RangeError.
3. The prompt does not specify blocked craft behavior or the full output shape. craft throws Error with the exact craftBlock reason when blocked; callers can inspect craftBlock first. Costs are returned, never applied. Catalog ids are itemKey, and owned-instance ids remain the caller's responsibility.
4. Bonus stat ids are sampled without replacement from STATS entries marked bonusLine, with uniform values from BONUS_LINE_RANGES. The seed also selects the catalog design. This yields exactly the rarity's bonus line count with distinct stats.
5. Game days are numeric dayIndex values, matching v1 pure rules. The caller must record lastRelicDay and spend resources atomically after success. A pure eligibility helper does not enforce database concurrency by itself; tests simulate successful recording and verify same-day blocks and the UTC+7 reset.
6. Current gear recipes do not use Moon Pearl. A test-only mocked recipe declares all six materials in reverse order, so tests verify the complete specified shortage order without changing production content.
7. Another process added unrelated lootcheck files/export to the original shared checkout during work. They were left untouched. Final code, fresh dependency install, all rerun checks, commits and pushes use the isolated checkout `/private/tmp/taskbar-hero-v5-forge`. Its v2/index.ts diff contains exactly the permitted export line and its generated maps contain no lootcheck entries.
8. pnpm reported existing ignored optional native build scripts; no scripts were newly approved. The build emitted the existing node:worker_threads browser externalization warning and succeeded.
9. The first commit succeeded, then its chained author audit failed because the isolated clone did not yet have origin/main. This stopped the chain before push. A fresh git fetch origin restored remote refs; the author/committer audit then passed and push succeeded. No amend was necessary.
10. Initial exploratory inventory output was truncated by the tool display. The complete available captured command outputs are pasted below; no successful validation is inferred from a truncated log. Early identity/setup output is recorded separately.
11. This report snapshots commands through the successful implementation push. Its own final commit/push cannot recursively embed their resulting commit hash and output. Those final publication commands are listed at the end; their actual result is verified after execution and supplied in the chat.

## Initial Git identity and setup

Working directory: /Users/bao/Documents/ChatGPT/taskbar hero

```console
$ git config user.email
108352255+ntbaoheyhey@users.noreply.github.com
$ git config user.name
ntbaoheyhey
$ git status --short --branch
## ai/codex-v4-loot...origin/ai/codex-v4-loot
```

Both identity values already matched. The first git fetch origin advanced origin/main from d5e67bc to 6744e9b and returned exit 0. The original checkout was clean before work. No ancestor AGENTS.md or tracked AGENTS.md was found by the following command, which also created the requested branch:

```sh
for p in /AGENTS.md /Users/AGENTS.md /Users/bao/AGENTS.md /Users/bao/Documents/AGENTS.md /Users/bao/Documents/ChatGPT/AGENTS.md; do if [ -f "$p" ]; then printf '%s\n' "$p"; cat "$p"; fi; done; git ls-files '*AGENTS.md'; git remote -v; git switch -c ai/codex-v5-forge origin/main
```

```text
origin	https://github.com/ntbaoheyhey/taskbar-hero.git (fetch)
origin	https://github.com/ntbaoheyhey/taskbar-hero.git (push)
Switched to a new branch 'ai/codex-v5-forge'
branch 'ai/codex-v5-forge' set up to track 'origin/main'.
```

Early inventory commands (display output was truncated for the broad docs search):

```sh
pwd; rg --files -g AGENTS.md -g '*plan*' -g '*Plan*' -g package.json -g pnpm-workspace.yaml -g '*forge*'
rg --files packages/game-rules docs scripts .github | head -120; rg -n -i 'Forge|30 Yarn|Moon Pearl|salvage' docs --glob '*.md' | head -100
sed -n '45,85p' docs/proposals/schema-v2.md; cat packages/game-rules/src/v2/content/index.ts; cat packages/game-rules/src/index.ts; cat packages/game-rules/src/v2/content/content.test.ts | head -55
```

The source edits were made with apply_patch (not shell commands). The remaining captured shell transcript follows, including exploratory reads, checks in the original checkout, and authoritative checks in the isolated checkout. Output continuation entries belong to the command with that session id. Exit codes are recorded when the process completes.

## Captured command transcript

### 1. Command

```sh
cat packages/game-rules/src/v2/content/{recipes,materials,rarities,slots,classes,items,stats}.ts packages/game-rules/src/rng.ts
```

```text
import type { MaterialId } from './materials';
import type { GearRarityId } from './rarities';

/**
 * Forge data (DATA ONLY; rules are V5 in ../forge). Plan section 5: the player picks a slot and a
 * rarity; the rarity is guaranteed, bonus lines are random, the item level follows the highest
 * cleared stage. Salvage returns about 25% of the cost, so craft-then-salvage always loses.
 */
export type MaterialCost = Partial<Record<MaterialId, number>>;

export interface RecipeDef {
  id: string;
  rarity: GearRarityId;
  /** Yarn is a material here (stored as v1 shards). */
  materials: MaterialCost;
  fish: number;
}

export interface SalvageDef {
  rarity: GearRarityId;
  materials: MaterialCost;
}

export const RECIPES: readonly RecipeDef[] = [
  { id: 'rcp.common', rarity: 'common', materials: { yarn: 10, fluffTuft: 4 }, fish: 50 },
  { id: 'rcp.uncommon', rarity: 'uncommon', materials: { yarn: 25, fluffTuft: 8, shinyButton: 1 }, fish: 150 },
  { id: 'rcp.rare', rarity: 'rare', materials: { yarn: 60, fluffTuft: 10, shinyButton: 6 }, fish: 500 },
  { id: 'rcp.epic', rarity: 'epic', materials: { yarn: 150, shinyButton: 6, catnipCrystal: 3 }, fish: 1500 },
  { id: 'rcp.legendary', rarity: 'legendary', materials: { yarn: 400, catnipCrystal: 6, starlightScale: 2 }, fish: 5000 },
];

export const SALVAGE: readonly SalvageDef[] = [
  { rarity: 'common', materials: { yarn: 1, fluffTuft: 2 } },
  { rarity: 'uncommon', materials: { yarn: 3, fluffTuft: 4 } },
  { rarity: 'rare', materials: { yarn: 8, shinyButton: 2 } },
  { rarity: 'epic', materials: { yarn: 20, catnipCrystal: 1 } },
  { rarity: 'legendary', materials: { yarn: 50, starlightScale: 1 } },
];

/** The daily Relic NFT forge: 30 Yarn + 1 Moon Pearl, still one per day (odds stay in v1 CONFIG.relic). */
export const RELIC_RECIPE = { id: 'rcp.relic', materials: { yarn: 30, moonPearl: 1 } as MaterialCost, perDay: 1 } as const;
export const MATERIAL_IDS = [
  'yarn',
  'fluffTuft',
  'shinyButton',
  'catnipCrystal',
  'starlightScale',
  'moonPearl',
  'catKey',
] as const;
export type MaterialId = (typeof MATERIAL_IDS)[number];

export interface MaterialDef {
  id: MaterialId;
  name: string;
  /** 0 = base (Yarn), 1..4 = crafting tiers; 'relic' and 'key' are special. */
  tier: 0 | 1 | 2 | 3 | 4 | 'relic' | 'key';
  /** Most a player can hold. */
  maxStack: number;
  /** v1 field this material is stored in today (Yarn is the existing shards). */
  v1Field?: 'shards' | 'bossKeys';
}

export const MATERIALS: readonly MaterialDef[] = [
  { id: 'yarn', name: 'Yarn', tier: 0, maxStack: 999_999, v1Field: 'shards' },
  { id: 'fluffTuft', name: 'Fluff Tuft', tier: 1, maxStack: 99_999 },
  { id: 'shinyButton', name: 'Shiny Button', tier: 2, maxStack: 99_999 },
  { id: 'catnipCrystal', name: 'Catnip Crystal', tier: 3, maxStack: 9_999 },
  { id: 'starlightScale', name: 'Starlight Scale', tier: 4, maxStack: 9_999 },
  { id: 'moonPearl', name: 'Moon Pearl', tier: 'relic', maxStack: 999 },
  { id: 'catKey', name: 'Cat Key', tier: 'key', maxStack: 5, v1Field: 'bossKeys' },
];
/**
 * v2 GEAR rarities (5 tiers). Deliberately separate from the Relic tiers in ../../content.ts
 * (RARITIES, relicIdOf): those are on-chain ids and must never move. Do not import them here.
 */
export const GEAR_RARITY_IDS = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type GearRarityId = (typeof GEAR_RARITY_IDS)[number];

export interface GearRarityDef {
  id: GearRarityId;
  /** Multiplies an item's base stats. */
  statMultiplier: number;
  /** Random bonus lines an item of this rarity rolls. */
  bonusLines: number;
  /** Highest item level. */
  maxLevel: number;
}

/** Lowest to highest. */
export const GEAR_RARITIES: readonly GearRarityDef[] = [
  { id: 'common', statMultiplier: 1, bonusLines: 0, maxLevel: 10 },
  { id: 'uncommon', statMultiplier: 1.3, bonusLines: 1, maxLevel: 20 },
  { id: 'rare', statMultiplier: 1.7, bonusLines: 2, maxLevel: 30 },
  { id: 'epic', statMultiplier: 2.3, bonusLines: 3, maxLevel: 40 },
  { id: 'legendary', statMultiplier: 3.2, bonusLines: 4, maxLevel: 50 },
];
import type { StatId } from './stats';

export const GEAR_SLOT_IDS = [
  'weapon',
  'helmet',
  'armor',
  'gloves',
  'boots',
  'collar',
  'earring',
  'ring',
  'charm',
] as const;
export type GearSlotId = (typeof GEAR_SLOT_IDS)[number];

export interface GearSlotDef {
  id: GearSlotId;
  /** 'main' slots are drawn on the cat; 'accessory' slots only add secondary stats. */
  group: 'main' | 'accessory';
  /** Drawn on the cat. */
  visible: boolean;
  /** Cat level that unlocks the slot (main slots: 1). */
  unlockLevel: number;
  /**
   * Stats every item in this slot has as base stats. Accessories have none in common: each
   * accessory design picks its own secondary stat (items.ts).
   */
  primaryStats: readonly StatId[];
}

/** Display order: main slots, then accessories. */
export const GEAR_SLOTS: readonly GearSlotDef[] = [
  { id: 'weapon', group: 'main', visible: true, unlockLevel: 1, primaryStats: ['atk'] },
  { id: 'helmet', group: 'main', visible: true, unlockLevel: 1, primaryStats: ['hp', 'def'] },
  { id: 'armor', group: 'main', visible: true, unlockLevel: 1, primaryStats: ['hp', 'def'] },
  { id: 'gloves', group: 'main', visible: true, unlockLevel: 1, primaryStats: ['atk', 'critChance'] },
  { id: 'boots', group: 'main', visible: true, unlockLevel: 1, primaryStats: ['hp', 'attackSpeed'] },
  { id: 'collar', group: 'accessory', visible: false, unlockLevel: 1, primaryStats: [] },
  { id: 'earring', group: 'accessory', visible: false, unlockLevel: 5, primaryStats: [] },
  { id: 'ring', group: 'accessory', visible: false, unlockLevel: 10, primaryStats: [] },
  { id: 'charm', group: 'accessory', visible: false, unlockLevel: 20, primaryStats: [] },
];
/**
 * The 7 cat classes and their weapon types (plan sections 1 and 6).
 *
 * Stat multipliers shape the shared base stats (deriveStats, V2). ATK is per hit, so slow or
 * multi-hit classes carry a per-hit ATK that keeps damage per second close to the Warrior's once
 * the passive is counted; the boss-time test in V2 checks this. Tuned in V6.
 */
export const WEAPON_TYPE_IDS = ['sword', 'hammer', 'daggers', 'spear', 'bow', 'staff', 'flasks'] as const;
export type WeaponType = (typeof WEAPON_TYPE_IDS)[number];

export interface WeaponProfile {
  id: WeaponType;
  /** Time from attack start to the first frame of the swing or throw. */
  windupMs: number;
  /**
   * Hit moments in ms from attack start, one per hit of one attack (daggers hit twice). For
   * projectile weapons this is the release; the hit lands `projectile.travelMs` later.
   */
  hitAtMs: readonly number[];
  projectile: null | { kind: 'arrow' | 'bolt' | 'flask'; travelMs: number };
}

export const WEAPON_TYPES: readonly WeaponProfile[] = [
  { id: 'sword', windupMs: 180, hitAtMs: [240], projectile: null },
  { id: 'hammer', windupMs: 420, hitAtMs: [520], projectile: null },
  { id: 'daggers', windupMs: 90, hitAtMs: [140, 300], projectile: null },
  { id: 'spear', windupMs: 220, hitAtMs: [300], projectile: null },
  { id: 'bow', windupMs: 300, hitAtMs: [300], projectile: { kind: 'arrow', travelMs: 200 } },
  { id: 'staff', windupMs: 500, hitAtMs: [500], projectile: { kind: 'bolt', travelMs: 350 } },
  { id: 'flasks', windupMs: 260, hitAtMs: [260], projectile: { kind: 'flask', travelMs: 450 } },
];

export const CLASS_IDS = ['warrior', 'guardian', 'rogue', 'hunter', 'archer', 'witch', 'alchemist'] as const;
export type ClassId = (typeof CLASS_IDS)[number];

/** Passive ids; params are documented per passive below and read by V2/V3. */
export type ClassPassive =
  /** Every `every`-th attack also hits the next monster for `splash` of the damage. */
  | { id: 'cleave'; params: { every: number; splash: number } }
  /** Each hit pushes the target's next attack back by `delayMs`. */
  | { id: 'bonk'; params: { delayMs: number } }
  /** Two hits per attack (see daggers hitAtMs). */
  | { id: 'twinStrike'; params: { hits: number } }
  /** First hit marks the target: it takes `damageTaken` more damage. Also +materialFind. */
  | { id: 'markPrey'; params: { damageTaken: number; materialFind: number } }
  /** Every `every`-th shot fires `arrows` arrows; extra arrows deal `extraArrowDamage` each. */
  | { id: 'volley'; params: { every: number; arrows: number; extraArrowDamage: number } }
  /** Bolts splash `splash` to nearby monsters and burn for `burnFraction` of the hit over `durationMs`. */
  | { id: 'burn'; params: { splash: number; burnFraction: number; durationMs: number; tickMs: number } }
  /** Flasks poison for `poisonFraction` of the hit over `durationMs`; heal `healOnKill` of max HP per kill. */
  | { id: 'poison'; params: { poisonFraction: number; durationMs: number; tickMs: number; healOnKill: number } };

export type Range = 'melee' | 'reach' | 'ranged';

export interface ClassDef {
  id: ClassId;
  name: string;
  weaponType: WeaponType;
  /** Multipliers on the shared base HP, ATK (per hit) and DEF. */
  stats: { hp: number; atk: number; def: number };
  /** Time between attack starts at 0 attackSpeed. */
  attackIntervalMs: number;
  critChance: number;
  critMultiplier: number;
  /** Base chance to avoid a hit. */
  dodge: number;
  range: Range;
  passive: ClassPassive;
  /** Free Common weapon of this class's weapon type (items.ts). */
  starterWeaponId: string;
}

export const CLASSES: readonly ClassDef[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    weaponType: 'sword',
    stats: { hp: 1, atk: 1, def: 1 },
    attackIntervalMs: 1000,
    critChance: 0.05,
    critMultiplier: 1.5,
    dodge: 0,
    range: 'melee',
    passive: { id: 'cleave', params: { every: 3, splash: 0.5 } },
    starterWeaponId: 'wpn.sword.twig',
  },
  {
    id: 'guardian',
    name: 'Guardian',
    weaponType: 'hammer',
    stats: { hp: 1.3, atk: 1.35, def: 1.3 },
    attackIntervalMs: 1400,
    critChance: 0.05,
    critMultiplier: 1.5,
    dodge: 0,
    range: 'melee',
    passive: { id: 'bonk', params: { delayMs: 500 } },
    starterWeaponId: 'wpn.hammer.mallet',
  },
  {
    id: 'rogue',
    name: 'Rogue',
    weaponType: 'daggers',
    stats: { hp: 0.85, atk: 0.3, def: 0.85 },
    attackIntervalMs: 800,
    critChance: 0.25,
    critMultiplier: 2.5,
    dodge: 0.1,
    range: 'melee',
    passive: { id: 'twinStrike', params: { hits: 2 } },
    starterWeaponId: 'wpn.daggers.claws',
  },
  {
    id: 'hunter',
    name: 'Hunter',
    weaponType: 'spear',
    stats: { hp: 1, atk: 0.9, def: 0.85 },
    attackIntervalMs: 1100,
    critChance: 0.05,
    critMultiplier: 1.5,
    dodge: 0,
    range: 'reach',
    passive: { id: 'markPrey', params: { damageTaken: 0.2, materialFind: 0.1 } },
    starterWeaponId: 'wpn.spear.reed',
  },
  {
    id: 'archer',
    name: 'Archer',
    weaponType: 'bow',
    stats: { hp: 0.85, atk: 0.75, def: 0.85 },
    attackIntervalMs: 900,
    critChance: 0.05,
    critMultiplier: 1.5,
    dodge: 0,
    range: 'ranged',
    passive: { id: 'volley', params: { every: 5, arrows: 3, extraArrowDamage: 0.5 } },
    starterWeaponId: 'wpn.bow.willow',
  },
  {
    id: 'witch',
    name: 'Witch',
    weaponType: 'staff',
    stats: { hp: 0.85, atk: 1.2, def: 0.7 },
    attackIntervalMs: 1600,
    critChance: 0.05,
    critMultiplier: 1.5,
    dodge: 0,
    range: 'ranged',
    passive: { id: 'burn', params: { splash: 0.4, burnFraction: 0.3, durationMs: 3000, tickMs: 1000 } },
    starterWeaponId: 'wpn.staff.branch',
  },
  {
    id: 'alchemist',
    name: 'Alchemist',
    weaponType: 'flasks',
    stats: { hp: 1, atk: 0.85, def: 0.85 },
    attackIntervalMs: 1300,
    critChance: 0.05,
    critMultiplier: 1.5,
    dodge: 0,
    range: 'ranged',
    passive: { id: 'poison', params: { poisonFraction: 0.5, durationMs: 4000, tickMs: 1000, healOnKill: 0.03 } },
    starterWeaponId: 'wpn.flasks.vial',
  },
];
import type { WeaponType } from './classes';
import { GEAR_RARITY_IDS, type GearRarityId } from './rarities';
import type { GearSlotId } from './slots';
import type { StatBlock } from './stats';

/**
 * Item catalog. Each entry is one item kind players can own; ids are stable forever (they are
 * stored in gear.item_key), so rename the `name`, never the id. Adding an item = adding one entry
 * (plus an icon); validateContent() checks every entry.
 *
 * baseStats are the item's stats at level 1 BEFORE the rarity multiplier; deriveStats (V2) applies
 * rarity x level growth. Items of one family share base stats and differ by rarity and look.
 */
export interface ItemDef {
  id: string;
  slot: GearSlotId;
  /** Weapons only. */
  weaponType?: WeaponType;
  rarity: GearRarityId;
  name: string;
  baseStats: StatBlock;
  /** Drawing set (armor set, weapon type or accessory design) and the palette it is recoloured with. */
  visual: { set: string; palette: GearRarityId };
  /** Chapter indexes (1-based) where this item can drop. */
  dropChapters: readonly number[];
}

const ALL_CHAPTERS = [1, 2, 3, 4, 5] as const;

/** Base stats per main slot, before rarity. */
const MAIN_BASE: Readonly<Record<'weapon' | 'helmet' | 'armor' | 'gloves' | 'boots', StatBlock>> = {
  weapon: { atk: 8 },
  helmet: { hp: 20, def: 2 },
  armor: { hp: 35, def: 4 },
  gloves: { atk: 3, critChance: 0.02 },
  boots: { hp: 15, attackSpeed: 0.03 },
};

type ByRarity<T> = Readonly<Record<GearRarityId, T>>;

// ---------------------------------------------------------------------------------- weapons
/** One named weapon per weapon type and rarity: [id suffix, name]. */
const WEAPON_NAMES: Readonly<Record<WeaponType, ByRarity<readonly [string, string]>>> = {
  sword: {
    common: ['twig', 'Twig Sword'],
    uncommon: ['tin', 'Tin Whisker Blade'],
    rare: ['silver', 'Silverclaw Saber'],
    epic: ['sunfang', 'Sunfang'],
    legendary: ['ninelives', 'Nine Lives Edge'],
  },
  hammer: {
    common: ['mallet', 'Yarn Mallet'],
    uncommon: ['cork', 'Cork Knocker'],
    rare: ['anvil', 'Anvil Paw'],
    epic: ['thunder', 'Thunderpurr'],
    legendary: ['catastrophe', 'Cat-astrophe'],
  },
  daggers: {
    common: ['claws', 'Kitten Claws'],
    uncommon: ['thorns', 'Rose Thorns'],
    rare: ['fangs', 'Twin Fangs'],
    epic: ['shadow', 'Shadowpounce Pair'],
    legendary: ['midnight', 'Midnight Whiskers'],
  },
  spear: {
    common: ['reed', 'Cattail Reed'],
    uncommon: ['pike', 'Fishing Pike'],
    rare: ['harpoon', 'Tuna Harpoon'],
    epic: ['moonlance', 'Moonlance'],
    legendary: ['pounce', 'Pride of the Pounce'],
  },
  bow: {
    common: ['willow', 'Willow Bow'],
    uncommon: ['yarnstring', 'Yarnstring Bow'],
    rare: ['feather', 'Featherflight'],
    epic: ['starcatcher', 'Starcatcher'],
    legendary: ['aurora', 'Aurora Longbow'],
  },
  staff: {
    common: ['branch', 'Catnip Branch'],
    uncommon: ['wand', 'Wand of Whiskers'],
    rare: ['crystal', 'Crystal Scepter'],
    epic: ['comet', 'Comet Staff'],
    legendary: ['eclipse', 'Eclipse Staff'],
  },
  flasks: {
    common: ['vial', 'Milk Vial'],
    uncommon: ['tonic', 'Bubbly Tonic'],
    rare: ['brew', 'Catnip Brew'],
    epic: ['elixir', 'Moonglow Elixir'],
    legendary: ['purrfect', 'Purrfect Elixir'],
  },
};

export function weaponItems(): ItemDef[] {
  const out: ItemDef[] = [];
  for (const [weaponType, byRarity] of Object.entries(WEAPON_NAMES) as [WeaponType, ByRarity<readonly [string, string]>][]) {
    for (const rarity of GEAR_RARITY_IDS) {
      const [suffix, name] = byRarity[rarity];
      out.push({
        id: `wpn.${weaponType}.${suffix}`,
        slot: 'weapon',
        weaponType,
        rarity,
        name,
        baseStats: MAIN_BASE.weapon,
        visual: { set: weaponType, palette: rarity },
        dropChapters: ALL_CHAPTERS,
      });
    }
  }
  return out;
}

// ------------------------------------------------------------------------------ armor sets
type ArmorSlot = 'helmet' | 'armor' | 'gloves' | 'boots';
const ARMOR_SLOTS: readonly ArmorSlot[] = ['helmet', 'armor', 'gloves', 'boots'];

interface ArmorSetDef {
  id: string;
  /** Piece name per slot. */
  pieces: Readonly<Record<ArmorSlot, string>>;
  /** Name prefix per rarity. */
  prefixes: ByRarity<string>;
  dropChapters: readonly number[];
}

/** Launch armor looks: each drawn once, recoloured per rarity (15 looks per slot from 3 drawings). */
export const ARMOR_SETS: readonly ArmorSetDef[] = [
  {
    id: 'cozy',
    pieces: { helmet: 'Knit Beanie', armor: 'Cozy Sweater', gloves: 'Mitten Paws', boots: 'Fuzzy Booties' },
    prefixes: { common: 'Patched', uncommon: 'Snug', rare: 'Woolly', epic: 'Hearthwarm', legendary: "Grandma's" },
    dropChapters: [1, 2, 3],
  },
  {
    id: 'ranger',
    pieces: { helmet: 'Leather Cap', armor: 'Ranger Vest', gloves: 'Ranger Gloves', boots: 'Trail Boots' },
    prefixes: { common: 'Scuffed', uncommon: 'Trail', rare: 'Pathfinder', epic: 'Wildwood', legendary: 'Evergreen' },
    dropChapters: [2, 3, 4, 5],
  },
  {
    id: 'moon',
    pieces: { helmet: 'Moon Helm', armor: 'Moon Plate', gloves: 'Moon Gauntlets', boots: 'Moon Greaves' },
    prefixes: { common: 'Dim', uncommon: 'Silver', rare: 'Moonlit', epic: 'Starforged', legendary: 'Celestial' },
    dropChapters: [4, 5],
  },
];

/** Generator: every set x slot x rarity, named "<prefix> <piece>". */
export function armorItems(sets: readonly ArmorSetDef[] = ARMOR_SETS): ItemDef[] {
  const out: ItemDef[] = [];
  for (const set of sets) {
    for (const slot of ARMOR_SLOTS) {
      for (const rarity of GEAR_RARITY_IDS) {
        out.push({
          id: `arm.${set.id}.${slot}.${rarity}`,
          slot,
          rarity,
          name: `${set.prefixes[rarity]} ${set.pieces[slot]}`,
          baseStats: MAIN_BASE[slot],
          visual: { set: set.id, palette: rarity },
          dropChapters: set.dropChapters,
        });
      }
    }
  }
  return out;
}

// ----------------------------------------------------------------------------- accessories
type AccessorySlot = 'collar' | 'earring' | 'ring' | 'charm';

interface AccessoryDesign {
  id: string;
  slot: AccessorySlot;
  name: string;
  /** The design's own secondary stat, before rarity. */
  baseStats: StatBlock;
}

/** 4 slots x 3 designs; each design has one secondary stat. */
export const ACCESSORY_DESIGNS: readonly AccessoryDesign[] = [
  { id: 'bell', slot: 'collar', name: 'Bell Collar', baseStats: { critChance: 0.03 } },
  { id: 'ribbon', slot: 'collar', name: 'Ribbon Collar', baseStats: { xpBonus: 0.05 } },
  { id: 'studded', slot: 'collar', name: 'Studded Collar', baseStats: { critDamage: 0.1 } },
  { id: 'fishhook', slot: 'earring', name: 'Fishhook Earring', baseStats: { fishBonus: 0.05 } },
  { id: 'feather', slot: 'earring', name: 'Feather Earring', baseStats: { dodge: 0.02 } },
  { id: 'pearl', slot: 'earring', name: 'Pearl Stud', baseStats: { hpRegen: 0.003 } },
  { id: 'paw', slot: 'ring', name: 'Paw Print Ring', baseStats: { attackSpeed: 0.03 } },
  { id: 'hunter', slot: 'ring', name: "Hunter's Ring", baseStats: { bossDamage: 0.05 } },
  { id: 'lucky', slot: 'ring', name: 'Lucky Ring', baseStats: { materialFind: 0.05 } },
  { id: 'catnip', slot: 'charm', name: 'Catnip Charm', baseStats: { hpRegen: 0.003 } },
  { id: 'mouse', slot: 'charm', name: 'Mouse Charm', baseStats: { bossDamage: 0.05 } },
  { id: 'star', slot: 'charm', name: 'Star Charm', baseStats: { critDamage: 0.1 } },
];

const ACCESSORY_PREFIXES: ByRarity<string> = {
  common: 'Plain',
  uncommon: 'Polished',
  rare: 'Fine',
  epic: 'Gleaming',
  legendary: 'Radiant',
};

export function accessoryItems(designs: readonly AccessoryDesign[] = ACCESSORY_DESIGNS): ItemDef[] {
  const out: ItemDef[] = [];
  for (const d of designs) {
    for (const rarity of GEAR_RARITY_IDS) {
      out.push({
        id: `acc.${d.slot}.${d.id}.${rarity}`,
        slot: d.slot,
        rarity,
        name: `${ACCESSORY_PREFIXES[rarity]} ${d.name}`,
        baseStats: d.baseStats,
        visual: { set: d.id, palette: rarity },
        dropChapters: ALL_CHAPTERS,
      });
    }
  }
  return out;
}

/** The whole catalog: 35 weapons, 60 armor pieces, 60 accessories. */
export const ITEMS: readonly ItemDef[] = [...weaponItems(), ...armorItems(), ...accessoryItems()];
import type { GearRarityId } from './rarities';

/**
 * v2 stat ids. Flat stats (hp, atk, def) are plain numbers; every other stat is a fraction
 * (0.05 = +5%). Meaning of each fractional stat, as deriveStats (V2) reads it:
 * - attackSpeed: attacks come this much faster (interval / (1 + attackSpeed)).
 * - critChance: chance per hit; critDamage: added to the class crit multiplier.
 * - dodge: chance to avoid a hit; hpRegen: share of max HP healed per second.
 * - fishBonus, xpBonus, materialFind: extra share of that reward; bossDamage: extra damage vs bosses.
 */
export const STAT_IDS = [
  'hp',
  'atk',
  'def',
  'attackSpeed',
  'critChance',
  'critDamage',
  'dodge',
  'hpRegen',
  'fishBonus',
  'xpBonus',
  'materialFind',
  'bossDamage',
] as const;
export type StatId = (typeof STAT_IDS)[number];

export type StatBlock = Partial<Record<StatId, number>>;

export interface StatDef {
  id: StatId;
  /** 'flat' stats add plain numbers; 'fraction' stats add shares (0.05 = 5%). */
  kind: 'flat' | 'fraction';
  /** Whether this stat can roll as a bonus line on gear. */
  bonusLine: boolean;
}

export const STATS: readonly StatDef[] = [
  { id: 'hp', kind: 'flat', bonusLine: false },
  { id: 'atk', kind: 'flat', bonusLine: false },
  { id: 'def', kind: 'flat', bonusLine: false },
  { id: 'attackSpeed', kind: 'fraction', bonusLine: true },
  { id: 'critChance', kind: 'fraction', bonusLine: true },
  { id: 'critDamage', kind: 'fraction', bonusLine: true },
  { id: 'dodge', kind: 'fraction', bonusLine: true },
  { id: 'hpRegen', kind: 'fraction', bonusLine: true },
  { id: 'fishBonus', kind: 'fraction', bonusLine: true },
  { id: 'xpBonus', kind: 'fraction', bonusLine: true },
  { id: 'materialFind', kind: 'fraction', bonusLine: true },
  { id: 'bossDamage', kind: 'fraction', bonusLine: true },
];

/** [min, max] roll range of one bonus line, uniform. */
export type RollRange = readonly [min: number, max: number];

/**
 * Bonus line roll ranges per stat and gear rarity. Common has 0 bonus lines today; its row exists
 * so a recipe or a future rule can still roll one. Ranges grow with rarity.
 */
export const BONUS_LINE_RANGES: Readonly<Partial<Record<StatId, Readonly<Record<GearRarityId, RollRange>>>>> = {
  attackSpeed: { common: [0.01, 0.02], uncommon: [0.02, 0.03], rare: [0.03, 0.05], epic: [0.04, 0.07], legendary: [0.06, 0.1] },
  critChance: { common: [0.01, 0.02], uncommon: [0.01, 0.03], rare: [0.02, 0.04], epic: [0.03, 0.06], legendary: [0.05, 0.08] },
  critDamage: { common: [0.03, 0.05], uncommon: [0.05, 0.08], rare: [0.08, 0.12], epic: [0.12, 0.18], legendary: [0.18, 0.25] },
  dodge: { common: [0.005, 0.01], uncommon: [0.01, 0.015], rare: [0.01, 0.02], epic: [0.02, 0.03], legendary: [0.03, 0.04] },
  hpRegen: { common: [0.001, 0.002], uncommon: [0.002, 0.003], rare: [0.003, 0.004], epic: [0.004, 0.006], legendary: [0.006, 0.008] },
  fishBonus: { common: [0.02, 0.04], uncommon: [0.03, 0.06], rare: [0.05, 0.08], epic: [0.07, 0.11], legendary: [0.1, 0.15] },
  xpBonus: { common: [0.02, 0.04], uncommon: [0.03, 0.06], rare: [0.05, 0.08], epic: [0.07, 0.11], legendary: [0.1, 0.15] },
  materialFind: { common: [0.02, 0.04], uncommon: [0.03, 0.06], rare: [0.05, 0.08], epic: [0.07, 0.11], legendary: [0.1, 0.15] },
  bossDamage: { common: [0.02, 0.04], uncommon: [0.03, 0.06], rare: [0.05, 0.08], epic: [0.07, 0.11], legendary: [0.1, 0.15] },
};
/** Deterministic PRNG (mulberry32). Seeds are uint32. */
export type Seed = number;

/** Mix a seed with a salt (splitmix32 style) to derive an independent stream. */
export function deriveSeed(seed: Seed, salt: number): Seed {
  let z = (seed + Math.imul(salt | 0, 0x9e3779b9) + 0x9e3779b9) | 0;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
  return (z ^ (z >>> 16)) >>> 0;
}

export class Rng {
  private s: number;
  constructor(seed: Seed) {
    this.s = seed >>> 0;
  }
  /** Float in [0, 1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  /** Pick a key by relative weights. */
  weighted<K extends string>(weights: Record<K, number>, order: readonly K[]): K {
    let total = 0;
    for (const k of order) total += weights[k];
    let r = this.next() * total;
    for (const k of order) {
      r -= weights[k];
      if (r < 0) return k;
    }
    return order[order.length - 1] as K;
  }
}
```

Exit code: 0.

### 2. Command

```sh
cat .github/workflows/*.yml; cat tsconfig.json packages/game-rules/tsconfig.json; rg --files -g '*eslint*' -g '*vitest*' -g AGENTS.md -g '!contracts/**'
```

```text
name: CI
# Minutes matter on a private repo (2000 free per month). Pull requests are verified outside Actions
# with scripts/verify-pr.sh (see docs/verify-pr.md). Until the user says the monthly quota has reset
# this workflow is manual only (Actions > CI > Run workflow); to restore the slim check after each
# push to main, add `push: { branches: [main] }` under `on:`.
on:
  workflow_dispatch:
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  changes:
    runs-on: ubuntu-latest
    timeout-minutes: 3
    outputs:
      code: ${{ steps.f.outputs.code }}
      web: ${{ steps.f.outputs.web }}
      contracts: ${{ steps.f.outputs.contracts }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - id: f
        env:
          BASE: ${{ github.event.before }}
        run: |
          if [ -z "$BASE" ] || [ "$BASE" = "0000000000000000000000000000000000000000" ] || ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then
            files=$(git ls-files)
          else
            files=$(git diff --name-only "$BASE" HEAD)
          fi
          echo "$files"
          flag() { if echo "$files" | grep -Eq "$1"; then echo true; else echo false; fi; }
          # code: anything except docs, markdown and screenshots; web: what the app build/e2e depends on.
          code=$(echo "$files" | grep -Ev '^(docs/|screenshots/)|\.md$' | grep -c . || true)
          echo "code=$([ "$code" -gt 0 ] && echo true || echo false)" >> "$GITHUB_OUTPUT"
          echo "web=$(flag '^(apps/web/|packages/|pnpm-lock.yaml|package.json|\.github/)')" >> "$GITHUB_OUTPUT"
          echo "contracts=$(flag '^(contracts/|packages/chain/|\.gitmodules|\.github/)')" >> "$GITHUB_OUTPUT"
  node:
    needs: changes
    if: needs.changes.outputs.code == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm gen:deno
      - run: git diff --exit-code -- supabase/functions
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
  # Playwright only on a manual run; scripts/verify-pr.sh runs it for every PR.
  e2e:
    needs: changes
    if: github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
        working-directory: apps/web
      - run: pnpm --filter @taskbar-hero/web build
      - run: pnpm --filter @taskbar-hero/web test:e2e
  contracts:
    needs: changes
    if: needs.changes.outputs.contracts == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    defaults:
      run:
        working-directory: contracts
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - uses: foundry-rs/foundry-toolchain@v1
      - run: forge build
      - run: forge test -vv
      # Deploy.t.sol rewrites packages/chain/deployments/31337.json; gen rewrites the ABIs.
      # Both must match what is committed.
      - run: node ../packages/chain/scripts/gen-abi.mjs
      - run: git diff --exit-code -- ../packages/chain
name: Deploy Edge Functions
# Deploys the Supabase Edge Functions to the live project (docs/go-live.md) when code they bundle
# changes on main, or by hand. Pull requests do not run it (Actions minutes).
on:
  push:
    branches: [main]
    paths:
      - supabase/functions/**
      - supabase/config.toml
      - packages/auth/**
      - packages/game-rules/**
      - packages/api-contract/** # types, error codes and statuses imported by _shared/game.ts
      - packages/chain/deployments/43113.json # RelicNFT address imported by _shared/game-server.ts
      - .github/workflows/deploy-functions.yml
  workflow_dispatch:

concurrency:
  group: deploy-functions
  cancel-in-progress: false

permissions:
  contents: read

env:
  PROJECT_REF: qoalewtxflagoprrxrgh
  FUNCTIONS: auth-nonce auth-verify game-state idle-claim equip boss-fight upgrade relic-forge relic-mint-report

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Decide whether to deploy
        id: gate
        env:
          HAS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN != '' }}
          EVENT: ${{ github.event_name }}
        run: |
          if [ "$EVENT" = "pull_request" ]; then
            echo "::notice title=Deploy skipped::Pull request run. Functions deploy when this merges to main."
            echo "deploy=false" >> "$GITHUB_OUTPUT"
          elif [ "$HAS_TOKEN" != "true" ]; then
            echo "::notice title=Deploy skipped::SUPABASE_ACCESS_TOKEN repo secret is not set (see docs/go-live.md)."
            echo "deploy=false" >> "$GITHUB_OUTPUT"
          else
            echo "deploy=true" >> "$GITHUB_OUTPUT"
          fi
      - uses: supabase/setup-cli@v1
        if: steps.gate.outputs.deploy == 'true'
        with:
          version: 2.122.0
      - name: Deploy
        if: steps.gate.outputs.deploy == 'true'
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        # --use-api bundles on Supabase's side (no Docker); each function's deno.json maps the
        # packages/* imports. Our functions check their own session JWT, hence --no-verify-jwt.
        run: |
          # shellcheck disable=SC2086 # FUNCTIONS is a space-separated list
          supabase functions deploy $FUNCTIONS --project-ref "$PROJECT_REF" --use-api --no-verify-jwt
cat: tsconfig.json: No such file or directory
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
supabase/tests/vitest.config.ts
```

Exit code: 0.

### 3. Command

```sh
cat packages/game-rules/src/v2/index.ts packages/game-rules/src/loot.ts packages/game-rules/package.json package.json scripts/gen-deno-json.mjs; rg -n 'rollRelicRarity|RELIC|forgeBlock' packages/game-rules/src/rules.ts packages/game-rules/src/config.ts; rg -n -i 'forge|30 yarn|moon pearl' --glob '*.md' --glob '!contracts/**' --glob '!docs/qa*' --glob '!docs/*screenshots*' | tail -100
```

```text
/** Cat RPG v2 rules, built beside v1 until cut-over (V29). Import as `v2` from the package root. */
export * from './content';
import { deriveSeed, Rng, type Seed } from './rng';

export type WeightedEntry<T> = { weight: number; value: T | { table: string } };
export type LootLine<T> = {
  chance: number;
  count: [min: number, max: number];
  pick: WeightedEntry<T>[];
};
export type LootTable<T> = { id: string; lines: LootLine<T>[] };
export type LootRegistry<T> = Record<string, LootTable<T>>;

const MAX_DEPTH = 4;

// Objects with a string-valued `table` field are reserved for references.
function isReference<T>(value: T | { table: string }): value is { table: string } {
  return typeof value === 'object' && value !== null && 'table' in value &&
    typeof value.table === 'string';
}

function getTable<T>(registry: LootRegistry<T>, id: string): LootTable<T> {
  if (!Object.hasOwn(registry, id)) throw new Error(`Unknown loot table: ${id}`);
  return registry[id]!;
}

/** Report structural problems across the entire registry, including unused tables. */
export function validateRegistry<T>(registry: LootRegistry<T>): string[] {
  const problems: string[] = [];
  for (const [id, table] of Object.entries(registry)) {
    table.lines.forEach((line, lineIndex) => {
      const location = `Table ${id}, line ${lineIndex}`;
      if (!Number.isFinite(line.chance) || line.chance < 0 || line.chance > 1) {
        problems.push(`${location}: chance must be finite and within 0..1`);
      }
      const [min, max] = line.count;
      if (min > max) problems.push(`${location}: count min > max`);
      if (min < 0 || max < 0) problems.push(`${location}: negative counts`);
      if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
        problems.push(`${location}: counts must be finite safe integers`);
      }
      if (line.pick.length === 0) problems.push(`${location}: empty pick list`);
      line.pick.forEach((entry, entryIndex) => {
        if (!Number.isFinite(entry.weight) || entry.weight <= 0) {
          problems.push(`${location}, pick ${entryIndex}: weight must be finite and positive`);
        }
        if (isReference(entry.value) && !Object.hasOwn(registry, entry.value.table)) {
          problems.push(`${location}, pick ${entryIndex}: unknown table ${entry.value.table}`);
        }
      });
    });
  }

  const visited = new Set<string>();
  const active = new Set<string>();
  const visit = (id: string): void => {
    if (active.has(id)) {
      problems.push(`Table ${id}: cycle detected`);
      return;
    }
    if (visited.has(id)) return;
    active.add(id);
    for (const line of getTable(registry, id).lines) {
      for (const { value } of line.pick) {
        if (isReference(value) && Object.hasOwn(registry, value.table)) visit(value.table);
      }
    }
    active.delete(id);
    visited.add(id);
  };
  for (const id of Object.keys(registry)) visit(id);
  return problems;
}

function assertValid<T>(registry: LootRegistry<T>): void {
  const problems = validateRegistry(registry);
  if (problems.length) throw new Error(`Invalid loot registry:\n${problems.join('\n')}`);
}

// Scaling first keeps the sum finite even when individual weights are near MAX_VALUE.
function probabilities<T>(entries: WeightedEntry<T>[]): number[] {
  const scale = entries.reduce((max, entry) => Math.max(max, entry.weight), 0);
  const weights = entries.map((entry) => entry.weight / scale);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => weight / total);
}

function assertDepth(depth: number): void {
  if (depth > MAX_DEPTH) throw new Error(`Loot nesting depth exceeds ${MAX_DEPTH}`);
}

/** Roll in line/unit order. The root is depth 0; at most four nested references are allowed. */
export function rollLoot<T>(registry: LootRegistry<T>, tableId: string, seed: Seed): T[] {
  assertValid(registry);
  const rng = new Rng(deriveSeed(seed, 0));
  const rewards: T[] = [];
  const roll = (id: string, depth: number): void => {
    assertDepth(depth);
    for (const line of getTable(registry, id).lines) {
      if (!rng.chance(line.chance)) continue;
      const count = rng.int(...line.count);
      const odds = probabilities(line.pick);
      for (let unit = 0; unit < count; unit++) {
        let remaining = rng.next();
        let selected = line.pick[line.pick.length - 1]!;
        for (let index = 0; index < line.pick.length; index++) {
          remaining -= odds[index]!;
          if (remaining < 0) {
            selected = line.pick[index]!;
            break;
          }
        }
        if (isReference(selected.value)) roll(selected.value.table, depth + 1);
        else rewards.push(selected.value);
      }
    }
  };
  roll(tableId, 0);
  return rewards;
}

/** Analytic expected counts (subject to floating-point precision), with no random sampling. */
export function expectedCounts<T>(
  registry: LootRegistry<T>,
  tableId: string,
  key: (value: T) => string,
): Record<string, number> {
  assertValid(registry);
  const counts = new Map<string, number>();
  const visit = (id: string, depth: number, multiplier: number): void => {
    assertDepth(depth);
    for (const line of getTable(registry, id).lines) {
      const meanCount = line.count[0] / 2 + line.count[1] / 2;
      if (line.chance === 0 || meanCount === 0) continue;
      const odds = probabilities(line.pick);
      line.pick.forEach(({ value }, index) => {
        const expected = multiplier * line.chance * meanCount * odds[index]!;
        if (isReference(value)) visit(value.table, depth + 1, expected);
        else {
          const rewardKey = key(value);
          counts.set(rewardKey, (counts.get(rewardKey) ?? 0) + expected);
        }
      });
    }
  };
  visit(tableId, 0, 1);
  return Object.fromEntries(counts);
}
{
  "name": "@taskbar-hero/game-rules",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "vitest run",
    "lint": "tsc --noEmit",
    "typecheck": "tsc --noEmit",
    "build": "tsc --noEmit"
  },
  "devDependencies": {
    "fast-check": "^4.10.2",
    "typescript": "5.9.3",
    "vitest": "5.0.5"
  }
}
{
  "name": "taskbar-hero",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@10.28.0",
  "scripts": {
    "gen:deno": "node scripts/gen-deno-json.mjs",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck"
  }
}
// Generates Edge Function import maps. Edit these templates, then run `pnpm gen:deno`.
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const functionsDir = join(root, 'supabase/functions');

/**
 * game-rules imports its own modules without extensions ('./rng', './v2'), which Deno does not
 * resolve. Map every non-test module (and every folder with an index.ts) to its file, so new
 * modules need no edit here.
 */
function gameRulesImports() {
  const src = join(root, 'packages/game-rules/src');
  const out = {};
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('__')) continue;
        if (existsSync(join(full, 'index.ts'))) out[spec(full)] = `${spec(full)}/index.ts`;
        walk(full);
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && entry.name !== 'index.ts') {
        out[spec(full.slice(0, -3))] = `${spec(full)}`;
      }
    }
  };
  // Specifier as seen from supabase/functions/<name>/.
  const spec = (p) => `../../../${relative(root, p).split('\\').join('/')}`;
  walk(src);
  return out;
}

const auth = {
  imports: {
    '@supabase/supabase-js': 'npm:@supabase/supabase-js@2.117.3',
    'jose': 'npm:jose@6.2.12',
    'viem': 'npm:viem@2.57.4',
    'viem/siwe': 'npm:viem@2.57.4/siwe',
  },
};

const game = {
  imports: {
    ...auth.imports,
    'viem/accounts': 'npm:viem@2.57.4/accounts',
    '@taskbar-hero/api-contract': '../../../packages/api-contract/src/index.ts',
    '../../../packages/api-contract/src/endpoints': '../../../packages/api-contract/src/endpoints.ts',
    '../../../packages/api-contract/src/errors': '../../../packages/api-contract/src/errors.ts',
    '../../../packages/api-contract/src/state': '../../../packages/api-contract/src/state.ts',
    '../../../packages/api-contract/src/types': '../../../packages/api-contract/src/types.ts',
    // chain/src/index.ts reads deployment JSON, which Deno cannot import without import
    // attributes, so the functions get the JSON-free constants module instead.
    '@taskbar-hero/chain': '../../../packages/chain/src/constants.ts',
    '../../../packages/chain/src/abi': '../../../packages/chain/src/abi.ts',
    '@taskbar-hero/game-rules': '../../../packages/game-rules/src/index.ts',
    ...gameRulesImports(),
  },
};

const functions = readdirSync(functionsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
  .map((entry) => entry.name)
  .filter((name) => existsSync(join(functionsDir, name, 'index.ts')))
  .sort();

for (const name of functions) {
  const template = name.startsWith('auth-') ? auth : game;
  writeFileSync(join(functionsDir, name, 'deno.json'), `${JSON.stringify(template, null, 2)}\n`);
}

console.log(`wrote ${functions.length} Edge Function import maps`);
packages/game-rules/src/rules.ts:164:export function rollRelicRarity(seed: Seed): Rarity {
packages/game-rules/src/rules.ts:192:export function forgeBlock(state: PlayerState, today: number): ForgeBlock | null {
packages/game-rules/src/rules.ts:200:  return forgeBlock(state, today) === null;
docs/onboarding-test.md:40:| **8. Init submodules** | `git submodule update --init --recursive` | README | Fresh clone | **PASS** | `forge-std` and `openzeppelin-contracts` + recursive checked out |
docs/onboarding-test.md:41:| **9. Run Foundry tests** | `cd contracts && forge test -vv` | README | Clean cache | **PASS** | 5 suites, 83 tests passed (0 failed, 0 skipped) |
docs/onboarding-test.md:42:| **10. Local deploy (Anvil)** | `anvil` + `forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast` | `docs/deploy.md` | Local Anvil | **PASS** | RelicNFT & RelicMarket deployed; matched committed `31337.json` |
docs/onboarding-test.md:43:| **11. Deploy script env check** | `forge script script/Deploy.s.sol` (no env vars) | `docs/deploy.md` | Unconfigured | **FAIL (Expected)** | Failed with missing `DEPLOYER_PRIVATE_KEY` error |
docs/onboarding-test.md:44:| **12. Rebuild contracts** | `cd contracts && forge build` | `docs/deploy.md` | Clean build | **PASS** | Emitted 5 compiler/linter warnings in Foundry 1.8.6 |
docs/onboarding-test.md:106:    - `relic: signer not configured` (expected test case in `forge.test.ts`)
docs/onboarding-test.md:107:    - `Error: rpc down` (expected test case in `forge.test.ts` testing network receipt failures)
docs/onboarding-test.md:114:  - If a user clones without `--recursive` and runs `cd contracts && forge test -vv` directly before `git submodule update`:
docs/onboarding-test.md:115:    - **Error**: `forge` cannot resolve `forge-std/Test.sol` or `@openzeppelin/contracts/`.
docs/onboarding-test.md:120:  forge test -vv
docs/onboarding-test.md:144:  forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
docs/onboarding-test.md:162:  forge script script/Deploy.s.sol
docs/onboarding-test.md:189:  cd contracts && forge build
docs/onboarding-test.md:197:  - `warning[reentrancy-events]` on `src/RelicNFT.sol:86:9` (`emit RelicForged(...)`)
docs/onboarding-test.md:265:   - *Friction*: If a user clones without `--recursive`, `forge test` fails until `git submodule update --init --recursive` is run.
docs/onboarding-test.md:273:   - *Friction*: `forge build` logs several warnings about reentrancy and timestamp usage under Foundry 1.8.6.
docs/onboarding-test.md:277:   - *Friction*: Running `forge script script/Deploy.s.sol` without env vars halts at `DEPLOYER_PRIVATE_KEY` without indicating the other required keys (`VOUCHER_SIGNER_ADDRESS`, `RELIC_BASE_URI`) up front.
docs/proposals/schema-v2.md:8:2. **Shared on purpose:** `players` (accounts, wallets), `relic_forges` and `relic_vouchers` (Relic history and the one-Relic-a-day limit). The voucher functions are reused unchanged.
docs/proposals/schema-v2.md:24:| `relic_forges`, `relic_vouchers` | one forge per game day; EIP-712 vouchers and mint status |
docs/proposals/schema-v2.md:122:Every function below locks `players` first (`select ... for update`), like every v1 function. That one rule serializes all v1 and v2 writes for a player, including the shared Relic forge. All amounts, costs and limits are parameters computed by the Edge Function from game-rules config; the SQL only checks and applies.
docs/proposals/schema-v2.md:134:| `v2_relic_forge(player, day, relic_id, rarity, yarn_cost, pearl_cost, expires_at)` | `v2-relic-forge` | Same as v1 `game_forge`, but pays Yarn and a Moon Pearl from `player_stacks` instead of shards and a Boss Key. Writes the same `relic_forges` and `relic_vouchers` rows. | `pending` voucher returned, or blocked `daily_limit`, `not_enough_yarn`, `no_moon_pearl` (V5 `relicForgeBlockV2` order) |
docs/proposals/schema-v2.md:153:- `boss_clears` first-clear and `relic_forges unique (player_id, day)` make "only once" rules hold even under parallel requests.
docs/proposals/schema-v2.md:168:| Edge Functions | `game-state`, `idle-claim`, `equip`, `boss-fight`, `upgrade`, `relic-forge`, `relic-mint-report` | `v2-state`, `v2-claim`, `v2-equip`, `v2-choose-class`, `v2-boss-fight`, `v2-craft`, `v2-salvage`, `v2-lock`, `v2-relic-forge` (mint reports reuse v1 `relic-mint-report`, which only checks the chain) |
docs/proposals/schema-v2.md:170:| Shared | `players`, `relic_forges`, `relic_vouchers` | same |
docs/proposals/schema-v2.md:172:Effect of sharing the Relic tables: a tester who forges in v2 has used that day's Relic in v1 too, and vice versa. That is the intended "one Relic a day per player" rule and keeps on-chain history in one place.
docs/proposals/schema-v2.md:179:2. Apply a small cut-over migration that calls `v2_grant_founder` for every `players` row that exists at that moment (all current players are Fuji testers). Contents are fixed (no roll), from the V6 numbers table, for example some Fish, Yarn, Fluff Tufts, 1 Moon Pearl and 2 Cat Keys. No gear, because the player has not picked a class yet; the first class pick gives the starter weapon.
docs/proposals/schema-v2.md:193:- **Rollback after cut-over:** switch the client flag back and redeploy. v1 tables still hold every save as of cut-over, so v1 resumes from that moment (anything earned in v2 since is not carried back, and Relics forged in v2 stay real, which is correct). No data restore needed.
docs/proposals/schema-v2.md:198:A later migration, approved separately, drops `idle_state`, `gear`, `boss_attempts`, `boss_keys` and the v1 `game_*` functions that only they use (`game_snapshot`, `game_claim`, `game_equip`, `game_boss_fight`, `game_upgrade`, `game_forge`). Not part of this plan.
docs/proposals/schema-v2.md:217:Migrations apply on top of v1; v1 tests still pass unchanged; RLS and grants on every new table and function; every refusal code above; bag limit and auto-salvage; key cap 5; stacks never negative; first clear exactly once under two parallel wins; claim compare-and-set against a parallel boss win and class change; Relic forge v2 shares the daily limit with v1 (`game_forge` then `v2_relic_forge` on one day is `daily_limit`); Founder grant only once; rollback script leaves the v1 schema unchanged.
docs/go-live.md:3:The database migrations are applied to the live Supabase project (`qoalewtxflagoprrxrgh`). The nine Edge Functions (`auth-nonce`, `auth-verify`, `game-state`, `idle-claim`, `equip`, `boss-fight`, `upgrade`, `relic-forge`, `relic-mint-report`) are deployed by GitHub Actions (`.github/workflows/deploy-functions.yml`) on every push to `main` that changes code they bundle (`supabase/functions`, `packages/auth`, `packages/game-rules`, `packages/api-contract` and the Fuji deployment file), or by hand from the Actions tab. Each function's `deno.json` import map is generated: edit `scripts/gen-deno-json.mjs`, run `pnpm gen:deno` and commit the result (CI fails on drift). This page lists what a person has to set once.
docs/go-live.md:25:| `VOUCHER_SIGNER_PRIVATE_KEY` | The voucher signer's private key (`0x` + 64 hex). Its address must equal `signer()` on the deployed RelicNFT. Use a dedicated key that holds no funds; never reuse the deployer key. Unset or malformed: `relic-forge` answers 500 `server_error` and spends nothing. | the seven game functions (relic-forge and game-state sign) |
docs/contracts.md:3:Foundry project in `contracts/` (Solidity 0.8.24, OpenZeppelin Contracts v5.1.0, forge-std).
docs/contracts.md:9:forge build
docs/contracts.md:10:forge test -vv
docs/contracts.md:28:On success it emits `RelicForged(player, relicId, rarity, nonce)` and an ERC-1155 `TransferSingle`.
docs/ui-guide.md:17:| [inventory/](../apps/web/src/inventory), [boss/](../apps/web/src/boss), [forge/](../apps/web/src/forge), [market/](../apps/web/src/market) | Feature components, text helpers, styles and tests. |
docs/extending.md:41:3. Add a new migration that drops and re-adds the rarity check constraints on `gear`, `relic_forges` and `relic_vouchers` (see `20260104000000_game_api.sql` and `20260106000000_relic_forge.sql`).
docs/extending.md:43:5. Add a `--rarity-<id>` token and a `.rarity-<id>` rule in `apps/web/src/theme.css`, then the per-rarity glow rules in `apps/web/src/forge/forge.css`, `apps/web/src/inventory/inventory.css` and `apps/web/src/market/market.css`.
docs/extending.md:63:1. Create the tab component in its own folder under `apps/web/src/`, like `apps/web/src/forge/ForgeTab.tsx`.
docs/runbook.md:32:4. Sign in on the live site once, open the Forge and Market tabs, and confirm the account loads. Use a fresh account for the demo so the daily forge is unspent.
docs/runbook.md:55:5. Vouchers issued with the old key stop working immediately. A player with an unminted voucher can mint again after the voucher expires (30 minutes plus a 2 minute grace): `relic-forge` then re-signs the same Relic with a new nonce and the new key, and no shards or keys are spent twice. If one specific voucher is the problem, the owner can instead kill just that nonce with `cancelNonce` (see [contracts](contracts.md)).
docs/security-web.md:43:| 4 | Low | `forge/TodayRelicCard.tsx` builds the Snowtrace link from `today.txHash` as received from the server, without the `^0x[0-9a-fA-F]{64}$` check that `mintStore.ts` uses. The host is fixed, so it cannot become a `javascript:` link, but a bad value gives a broken or misleading path. | Run the hash through the same regex inside `txUrl`. |
docs/security-web.md:44:| 5 | Low | Two links use `rel="noreferrer"` without `noopener` (`ForgeTab.tsx`, `WalletButton.tsx`). Modern browsers imply `noopener` for `_blank`, so this is cosmetic. | Use `rel="noopener noreferrer"` to match `TodayRelicCard`. |
docs/demo-script.md:34:| `shards` | **Yarn** | Crafting resource dropped from idle kills (30 needed for Forge) |
docs/demo-script.md:35:| `bossKey` | **Cat Key** | Earned by defeating the daily boss (1 needed for Forge) |
docs/demo-script.md:36:| `relicId: 1` (Common) | **Paw Charm** | ERC-1155 token, 60% forge odds |
docs/demo-script.md:37:| `relicId: 2` (Rare) | **Silver Bell** | ERC-1155 token, 28% forge odds |
docs/demo-script.md:38:| `relicId: 3` (Epic) | **Moon Collar** | ERC-1155 token, 10% forge odds |
docs/demo-script.md:39:| `relicId: 4` (Legendary) | **Golden Maneki** | ERC-1155 token, 2% forge odds |
docs/demo-script.md:61:> *Your cat hero, Mochi, fights quietly in the background while you work, gathering Fish and Yarn with zero gas and zero popups. When you beat the daily boss and forge a rare Relic, that milestone is verified off-chain by server-signed EIP-712 vouchers and minted as a true ERC-1155 NFT on Avalanche Fuji.*
docs/demo-script.md:76:1:05 - 1:55 (50s) : Scene 3 — The Forge, EIP-712 Voucher & Fuji Minting
docs/demo-script.md:89:| **1:05 - 1:25** | Click the **Forge** tab. Show the cost (30 Yarn + 1 Cat Key) and current odds (60% Common, 28% Rare, 10% Epic, 2% Legendary). Click **Forge**. The card rises with the pixel reveal animation. A Rare Silver Bell emerges! | *"Now for the magic. In the Forge, we combine 30 Yarn and 1 Cat Key. The server verifies our inventory and generates an EIP-712 typed voucher binding our wallet, the Relic ID, rarity, and an unspent nonce. We just forged a Rare Silver Bell!"* | The 2.5s reveal animation (`ForgeReveal.tsx`) creates anticipation and highlights pixel art. |
docs/demo-script.md:90:| **1:25 - 1:55** | The **MintPanel** appears. Click **Mint to wallet**. Core/MetaMask pops up with the transaction to `RelicNFT` on Avalanche Fuji. Click confirm. Transaction confirms in ~1.5 seconds. Link opens on Snowtrace showing `RelicForged` event. | *"We click 'Mint to wallet'. Our wallet submits `mint(voucher, signature)` directly to the RelicNFT contract on Avalanche Fuji. In less than two seconds, Avalanche finalizes the block! RelicNFT verifies the signature, caller, and nonce, permanently minting our ERC-1155 token."* | Highlight the Snowtrace tab showing contract address `0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D`. |
docs/demo-script.md:111:- **Action**: Click the **Menu** toggle button in the bottom strip. The main UI drawer opens displaying the **Café Board** and navigation tabs (`Hero`, `Inventory`, `Boss`, `Forge`, `Market`).
docs/demo-script.md:124:- **Action**: Switch to the **Forge** tab.
docs/demo-script.md:127:  - Show the Forge requirements:
docs/demo-script.md:128:    - *"To forge a Relic, a player must spend 30 Yarn and 1 Cat Key. Forging is strictly limited to one Relic per account per day."*
docs/demo-script.md:130:  - Click **Forge**:
docs/demo-script.md:131:    - *"When I click Forge, our backend checks the player's off-chain balance, verifies they haven't forged today, burns the Yarn and Cat Key in the database, rolls the rarity using server randomness, and cryptographically signs an EIP-712 typed voucher."*
docs/demo-script.md:202:| **5. Post-Mint Reconciliation** | Client submits transaction hash; server reads Fuji receipt and confirms `RelicForged` event. | **Chain as Ultimate Source of Truth**: The off-chain database does not finalize the player's Relic ownership until it observes the confirmed event on Avalanche Fuji. If a transaction reverts or is dropped, state remains clean. |
docs/demo-script.md:220:    Issue -->|Already Forged Today| FallbackForge[Explain 1/Day Rule + Re-sign Pending Voucher]
docs/demo-script.md:248:     - Walk through the verified Solidity code on Snowtrace showing exact transaction receipts and event logs for `RelicForged` and `Listed`.
docs/demo-script.md:250:### Scenario D: Daily Forge Limit Reached ("You have already forged today")
docs/demo-script.md:251:- **Symptom**: Forge button is disabled with message: *"You forged today. Come back at midnight Vietnam time (UTC+7)."*
docs/demo-script.md:252:- **Root Cause**: The account successfully forged earlier during rehearsals.
docs/demo-script.md:254:  1. Turn this into a feature showcase: *"This demonstrates our strict anti-cheat and anti-inflation mechanics. The server guarantees that even on testnet, players cannot flood the market with minted NFTs; each player gets exactly one forge opportunity every 24 hours."*
docs/demo-script.md:256:  3. Alternatively, switch wallet account to a fresh address to demonstrate a brand-new forge flow.
docs/demo-script.md:259:- **Symptom**: Claims, Boss fight, or Forge button spins with a network error.
docs/demo-script.md:287:> *"The browser client is strictly an untrusted interface. All damage rolls, gear stats, loot drops, and forge rolls are executed on Supabase Edge Functions using server-side HMAC seeds that the client cannot predict. When a forge occurs, the server signs the EIP-712 voucher using a private key stored securely in server environment variables. The `RelicNFT` smart contract checks that the signature recovers to the authorized `signer` address, that `msg.sender` matches the player, that the voucher has not expired, and that the voucher nonce has never been used on-chain before."*
docs/demo-script.md:312:Forge Cost: 30 Yarn + 1 Cat Key (Limit: 1 forge/day)
docs/demo-script.md:318:3. Forge & Mint  : 30 Yarn + 1 Cat Key -> EIP-712 Voucher -> Mint on Fuji (~1.5s)
docs/submission.md:16:An idle RPG that lives in a thin strip at the bottom of a web page, where everyday progress is free and off-chain and the rare Relics you forge are real ERC-1155 NFTs on Avalanche Fuji that you can trade.
docs/submission.md:20:Taskbar Hero is a cozy idle RPG that sits in a strip at the bottom of a web page, like a game on your taskbar. Mochi the cat fights on its own while you work; you claim Fish (gold), Yarn (shards) and gear drops, upgrade gear, and beat a daily boss for a Cat Key. Spend 30 Yarn and one Cat Key to forge a collectible Relic: the server signs a voucher, your wallet mints it on Avalanche Fuji, and you can list it on a fixed-price market for test AVAX. Gameplay stays fast and free of gas; only the things worth owning go on-chain. There is no fungible token.
docs/submission.md:26:**Solution.** Taskbar Hero keeps fast, frequent progress off-chain and decided by the server (gold, gear, shards, Boss Keys), so it cannot be forged from the browser. Only the rare, collectible outcome, the Relic, becomes an NFT. The server proves a forge was earned by signing an EIP-712 voucher; the player's wallet submits it and pays only test-AVAX gas for the mint. Relics then trade peer to peer in an escrow market. The game is low-attention by design, so it fits next to your real work.
docs/submission.md:32:- **Server-signed EIP-712 vouchers:** the voucher binds player, Relic ID, rarity, nonce and expiry to this chain and contract. RelicNFT checks the signer, the caller, expiry, that the nonce is unused, and that rarity matches the Relic ID, then mints one copy. Expired vouchers are re-signed with a new nonce only after the server confirms on-chain that the old nonce was not used, so one paid forge can never mint twice.
docs/submission.md:34:- **Reconciliation:** after minting, the client reports the transaction hash; the server reads the receipt on Fuji and accepts it only if RelicNFT emitted a matching `RelicForged` event for that voucher. The chain is the source of truth for ownership.
docs/submission.md:63:5. Claim, upgrade, win the boss for a Cat Key, then Forge (30 Yarn + 1 Cat Key, once per day) and approve the mint in your wallet.
docs/submission.md:66:Without a wallet you can still see the game, but claims, the Forge and the Market need sign-in. Running locally without Supabase config uses a mock backend that does not mint (see the README).
docs/game-rules.md:31:- `canForge(state, today)`, `forgeBlock(state, today)`, `canClaimBossKey(state, today)`, `dayIndex(unixSeconds)`
docs/game-rules.md:79:| `relic.shardCost` | 30 | Shards to forge a Relic. |
docs/game-rules.md:80:| `relic.bossKeyCost` | 1 | Boss Keys to forge a Relic. |
docs/game-rules.md:82:| `time.secondsPerDay` | 86400 | Length of a forge / key day. |
docs/game-rules.md:88:Limits: one Boss Key and one Relic per account per day, enforced via `lastBossKeyDay` / `lastForgeDay`.
docs/abuse-controls.md:5:The main exposure is availability: valid and invalid requests can consume Edge Function, database and Fuji RPC resources without an application request budget. Existing checks substantially constrain forged rewards, ownership violations and replay, but gameplay caps do not throttle HTTP requests. Wallet sign-in also does not establish one human per account.
docs/abuse-controls.md:68:### `relic-forge`
docs/abuse-controls.md:70:**Abuse:** Race requests to double-spend resources or reroll rarity; repeatedly retrieve/reissue vouchers; withhold mint reports to try to obtain a second voucher for an already minted forge. Even blocked calls consume server/database work, and expired-pending calls can trigger Fuji reads.
docs/abuse-controls.md:72:**Existing limits:** One paid forge per player per UTC+7 day is enforced by a unique row and player lock. A new forge costs 30 shards and one Boss Key, deducted transactionally. An issued pending voucher is returned without another spend or reroll, even if from an earlier day. Rarity is fixed by the HMAC of player/day. Voucher lifetime is 30 minutes. Reissue waits until more than 120 seconds after expiry, checks `usedNonces` on Fuji, and either marks the old voucher minted or replaces it with a fresh nonce for the same paid forge/relic/rarity. SQL serializes reissue; only one issued voucher per forge is allowed. Repeated renewals can accumulate expired rows; there is no lifetime renewal count.
docs/abuse-controls.md:74:EIP-712 binds the voucher to player, relic ID, rarity, nonce, expiry, chain 43113 and the configured RelicNFT address. The contract requires the caller to be that player, a valid authorized signature, an unexpired voucher and an unused nonce; it marks the nonce used before the ERC-1155 receiver hook. These protect replay across callers/chains/contracts and reuse of one nonce. The contract itself has no per-human or daily forge cap: it trusts server issuance.
docs/abuse-controls.md:82:**Existing limits:** Nonces must be positive decimal strings within signed Postgres bigint range; hashes must be 32-byte hex. SQL first loads the caller's voucher, so an unknown/foreign nonce returns `not_found` before a chain read. Unminted reports require a successful receipt containing a `RelicForged` log emitted by configured RelicNFT with matching player, relic ID, rarity and nonce. A successful unrelated tx or event from another contract is insufficient. An already minted voucher returns state without another receipt read. Errors return 409 `mint_not_confirmed` and remain retryable. The RPC transport has a ten-second timeout and one retry, but there is no per-player RPC budget, persistent negative cache or application concurrency cap. Receipt validation does not wait for a confirmation depth or recheck canonicality later; it validates event provenance, not the outer transaction's destination.
docs/abuse-controls.md:94:| 5 | Set a small global admission/RPC budget and a server-side emergency switch for new sign-ins/forges, supported by aggregate endpoint/status/RPC-error and new-wallet counts. Give the owner a short recovery runbook and expiry for temporary blocks/counters. | Estimated $0 extra services with existing logs/config and private counters; about half to one day plus manual monitoring during the demo. | Log no bearer tokens, signatures, message bodies or secrets. Test that disabling issuance preserves reads and mint-report recovery. A global budget can deny legitimate users during abuse, so it is a last-resort availability tradeoff; it also cannot refund already invoked functions. |
docs/test-stability.md:12:Every failure before the fix was `Error: Hook timed out in 10000ms` in the `beforeAll` of supabase test files (run 1: `auth-wrappers`, `concurrency`, `forge`, `siwe`; run 2 and 3: `concurrency`, `siwe`; run 4: `siwe`). No assertion ever failed: no test was wrong, the setup was too slow. The cause is that every test file migrated its own fresh PGlite (about 3 s alone, much longer when twelve files do it at once on four cores) and vitest's default hook timeout is 10 s. This also explains the single suite-level failure seen once while developing `malformed.test.ts` (#90).
docs/test-stability.md:33:| supabase | `forge.test.ts` | 1.5 s |
docs/test-stability.md:36:| web | `boss/BossTab.test.tsx`, `forge/ForgeTab.test.tsx` | 1.1 s each |
docs/contracts-coverage.md:3:Measured with `forge coverage --offline --report summary` in `contracts/` on `main` (64 tests) and after this change (83 tests). Contracts under `src/` are unchanged.
docs/contracts-coverage.md:27:Results: `forge test --offline` passes (83 tests, none skipped). No contract bug was found by the new tests.
docs/pitch-outline.md:34:- **Pure collectibles, no tokenomics**: There is no fungible in-game token; players forge rare ERC-1155 Relic NFTs once per day through verified gameplay achievements.
docs/pitch-outline.md:48:- **Voucher-gated forge**: Spend 30 Yarn and 1 Cat Key in the Forge to trigger server verification and receive an instant, cryptographically signed EIP-712 mint voucher.
docs/pitch-outline.md:52:Fast-paced product walkthrough or split-screen sequence: Mochi defeating the Yarn Giant -> Forge reveal animation of a rising pixel-art Relic (`docs/screenshots/forge-reveal.png`) -> Relic listed in the market (`docs/screenshots/market.png`).
docs/pitch-outline.md:79:- **Reconciled truth**: All Relic ownership and marketplace trades are verifiable on Snowtrace and Routescan; the backend checks the mint receipt for the `RelicForged` event before it marks a Relic as minted. Be upfront that `RelicNFT` has an owner who can rotate the signer and change the metadata URI.
docs/pitch-outline.md:82:Snowtrace / Routescan block explorer tabs showing verified Solidity source code, contract ABIs, and recent `RelicForged` and listing transaction logs for both contract addresses on Fuji.
```

Exit code: 0.

### 4. Command

```sh
cat packages/game-rules/src/v2/index.ts packages/game-rules/src/v2/content/stats.ts packages/game-rules/src/rng.ts; cat packages/game-rules/src/loot.ts; cat package.json packages/game-rules/package.json; cat .github/workflows/ci.yml .github/workflows/deploy-functions.yml
```

```text
/** Cat RPG v2 rules, built beside v1 until cut-over (V29). Import as `v2` from the package root. */
export * from './content';
import type { GearRarityId } from './rarities';

/**
 * v2 stat ids. Flat stats (hp, atk, def) are plain numbers; every other stat is a fraction
 * (0.05 = +5%). Meaning of each fractional stat, as deriveStats (V2) reads it:
 * - attackSpeed: attacks come this much faster (interval / (1 + attackSpeed)).
 * - critChance: chance per hit; critDamage: added to the class crit multiplier.
 * - dodge: chance to avoid a hit; hpRegen: share of max HP healed per second.
 * - fishBonus, xpBonus, materialFind: extra share of that reward; bossDamage: extra damage vs bosses.
 */
export const STAT_IDS = [
  'hp',
  'atk',
  'def',
  'attackSpeed',
  'critChance',
  'critDamage',
  'dodge',
  'hpRegen',
  'fishBonus',
  'xpBonus',
  'materialFind',
  'bossDamage',
] as const;
export type StatId = (typeof STAT_IDS)[number];

export type StatBlock = Partial<Record<StatId, number>>;

export interface StatDef {
  id: StatId;
  /** 'flat' stats add plain numbers; 'fraction' stats add shares (0.05 = 5%). */
  kind: 'flat' | 'fraction';
  /** Whether this stat can roll as a bonus line on gear. */
  bonusLine: boolean;
}

export const STATS: readonly StatDef[] = [
  { id: 'hp', kind: 'flat', bonusLine: false },
  { id: 'atk', kind: 'flat', bonusLine: false },
  { id: 'def', kind: 'flat', bonusLine: false },
  { id: 'attackSpeed', kind: 'fraction', bonusLine: true },
  { id: 'critChance', kind: 'fraction', bonusLine: true },
  { id: 'critDamage', kind: 'fraction', bonusLine: true },
  { id: 'dodge', kind: 'fraction', bonusLine: true },
  { id: 'hpRegen', kind: 'fraction', bonusLine: true },
  { id: 'fishBonus', kind: 'fraction', bonusLine: true },
  { id: 'xpBonus', kind: 'fraction', bonusLine: true },
  { id: 'materialFind', kind: 'fraction', bonusLine: true },
  { id: 'bossDamage', kind: 'fraction', bonusLine: true },
];

/** [min, max] roll range of one bonus line, uniform. */
export type RollRange = readonly [min: number, max: number];

/**
 * Bonus line roll ranges per stat and gear rarity. Common has 0 bonus lines today; its row exists
 * so a recipe or a future rule can still roll one. Ranges grow with rarity.
 */
export const BONUS_LINE_RANGES: Readonly<Partial<Record<StatId, Readonly<Record<GearRarityId, RollRange>>>>> = {
  attackSpeed: { common: [0.01, 0.02], uncommon: [0.02, 0.03], rare: [0.03, 0.05], epic: [0.04, 0.07], legendary: [0.06, 0.1] },
  critChance: { common: [0.01, 0.02], uncommon: [0.01, 0.03], rare: [0.02, 0.04], epic: [0.03, 0.06], legendary: [0.05, 0.08] },
  critDamage: { common: [0.03, 0.05], uncommon: [0.05, 0.08], rare: [0.08, 0.12], epic: [0.12, 0.18], legendary: [0.18, 0.25] },
  dodge: { common: [0.005, 0.01], uncommon: [0.01, 0.015], rare: [0.01, 0.02], epic: [0.02, 0.03], legendary: [0.03, 0.04] },
  hpRegen: { common: [0.001, 0.002], uncommon: [0.002, 0.003], rare: [0.003, 0.004], epic: [0.004, 0.006], legendary: [0.006, 0.008] },
  fishBonus: { common: [0.02, 0.04], uncommon: [0.03, 0.06], rare: [0.05, 0.08], epic: [0.07, 0.11], legendary: [0.1, 0.15] },
  xpBonus: { common: [0.02, 0.04], uncommon: [0.03, 0.06], rare: [0.05, 0.08], epic: [0.07, 0.11], legendary: [0.1, 0.15] },
  materialFind: { common: [0.02, 0.04], uncommon: [0.03, 0.06], rare: [0.05, 0.08], epic: [0.07, 0.11], legendary: [0.1, 0.15] },
  bossDamage: { common: [0.02, 0.04], uncommon: [0.03, 0.06], rare: [0.05, 0.08], epic: [0.07, 0.11], legendary: [0.1, 0.15] },
};
/** Deterministic PRNG (mulberry32). Seeds are uint32. */
export type Seed = number;

/** Mix a seed with a salt (splitmix32 style) to derive an independent stream. */
export function deriveSeed(seed: Seed, salt: number): Seed {
  let z = (seed + Math.imul(salt | 0, 0x9e3779b9) + 0x9e3779b9) | 0;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
  return (z ^ (z >>> 16)) >>> 0;
}

export class Rng {
  private s: number;
  constructor(seed: Seed) {
    this.s = seed >>> 0;
  }
  /** Float in [0, 1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  /** Pick a key by relative weights. */
  weighted<K extends string>(weights: Record<K, number>, order: readonly K[]): K {
    let total = 0;
    for (const k of order) total += weights[k];
    let r = this.next() * total;
    for (const k of order) {
      r -= weights[k];
      if (r < 0) return k;
    }
    return order[order.length - 1] as K;
  }
}
import { deriveSeed, Rng, type Seed } from './rng';

export type WeightedEntry<T> = { weight: number; value: T | { table: string } };
export type LootLine<T> = {
  chance: number;
  count: [min: number, max: number];
  pick: WeightedEntry<T>[];
};
export type LootTable<T> = { id: string; lines: LootLine<T>[] };
export type LootRegistry<T> = Record<string, LootTable<T>>;

const MAX_DEPTH = 4;

// Objects with a string-valued `table` field are reserved for references.
function isReference<T>(value: T | { table: string }): value is { table: string } {
  return typeof value === 'object' && value !== null && 'table' in value &&
    typeof value.table === 'string';
}

function getTable<T>(registry: LootRegistry<T>, id: string): LootTable<T> {
  if (!Object.hasOwn(registry, id)) throw new Error(`Unknown loot table: ${id}`);
  return registry[id]!;
}

/** Report structural problems across the entire registry, including unused tables. */
export function validateRegistry<T>(registry: LootRegistry<T>): string[] {
  const problems: string[] = [];
  for (const [id, table] of Object.entries(registry)) {
    table.lines.forEach((line, lineIndex) => {
      const location = `Table ${id}, line ${lineIndex}`;
      if (!Number.isFinite(line.chance) || line.chance < 0 || line.chance > 1) {
        problems.push(`${location}: chance must be finite and within 0..1`);
      }
      const [min, max] = line.count;
      if (min > max) problems.push(`${location}: count min > max`);
      if (min < 0 || max < 0) problems.push(`${location}: negative counts`);
      if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
        problems.push(`${location}: counts must be finite safe integers`);
      }
      if (line.pick.length === 0) problems.push(`${location}: empty pick list`);
      line.pick.forEach((entry, entryIndex) => {
        if (!Number.isFinite(entry.weight) || entry.weight <= 0) {
          problems.push(`${location}, pick ${entryIndex}: weight must be finite and positive`);
        }
        if (isReference(entry.value) && !Object.hasOwn(registry, entry.value.table)) {
          problems.push(`${location}, pick ${entryIndex}: unknown table ${entry.value.table}`);
        }
      });
    });
  }

  const visited = new Set<string>();
  const active = new Set<string>();
  const visit = (id: string): void => {
    if (active.has(id)) {
      problems.push(`Table ${id}: cycle detected`);
      return;
    }
    if (visited.has(id)) return;
    active.add(id);
    for (const line of getTable(registry, id).lines) {
      for (const { value } of line.pick) {
        if (isReference(value) && Object.hasOwn(registry, value.table)) visit(value.table);
      }
    }
    active.delete(id);
    visited.add(id);
  };
  for (const id of Object.keys(registry)) visit(id);
  return problems;
}

function assertValid<T>(registry: LootRegistry<T>): void {
  const problems = validateRegistry(registry);
  if (problems.length) throw new Error(`Invalid loot registry:\n${problems.join('\n')}`);
}

// Scaling first keeps the sum finite even when individual weights are near MAX_VALUE.
function probabilities<T>(entries: WeightedEntry<T>[]): number[] {
  const scale = entries.reduce((max, entry) => Math.max(max, entry.weight), 0);
  const weights = entries.map((entry) => entry.weight / scale);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => weight / total);
}

function assertDepth(depth: number): void {
  if (depth > MAX_DEPTH) throw new Error(`Loot nesting depth exceeds ${MAX_DEPTH}`);
}

/** Roll in line/unit order. The root is depth 0; at most four nested references are allowed. */
export function rollLoot<T>(registry: LootRegistry<T>, tableId: string, seed: Seed): T[] {
  assertValid(registry);
  const rng = new Rng(deriveSeed(seed, 0));
  const rewards: T[] = [];
  const roll = (id: string, depth: number): void => {
    assertDepth(depth);
    for (const line of getTable(registry, id).lines) {
      if (!rng.chance(line.chance)) continue;
      const count = rng.int(...line.count);
      const odds = probabilities(line.pick);
      for (let unit = 0; unit < count; unit++) {
        let remaining = rng.next();
        let selected = line.pick[line.pick.length - 1]!;
        for (let index = 0; index < line.pick.length; index++) {
          remaining -= odds[index]!;
          if (remaining < 0) {
            selected = line.pick[index]!;
            break;
          }
        }
        if (isReference(selected.value)) roll(selected.value.table, depth + 1);
        else rewards.push(selected.value);
      }
    }
  };
  roll(tableId, 0);
  return rewards;
}

/** Analytic expected counts (subject to floating-point precision), with no random sampling. */
export function expectedCounts<T>(
  registry: LootRegistry<T>,
  tableId: string,
  key: (value: T) => string,
): Record<string, number> {
  assertValid(registry);
  const counts = new Map<string, number>();
  const visit = (id: string, depth: number, multiplier: number): void => {
    assertDepth(depth);
    for (const line of getTable(registry, id).lines) {
      const meanCount = line.count[0] / 2 + line.count[1] / 2;
      if (line.chance === 0 || meanCount === 0) continue;
      const odds = probabilities(line.pick);
      line.pick.forEach(({ value }, index) => {
        const expected = multiplier * line.chance * meanCount * odds[index]!;
        if (isReference(value)) visit(value.table, depth + 1, expected);
        else {
          const rewardKey = key(value);
          counts.set(rewardKey, (counts.get(rewardKey) ?? 0) + expected);
        }
      });
    }
  };
  visit(tableId, 0, 1);
  return Object.fromEntries(counts);
}
{
  "name": "taskbar-hero",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@10.28.0",
  "scripts": {
    "gen:deno": "node scripts/gen-deno-json.mjs",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck"
  }
}
{
  "name": "@taskbar-hero/game-rules",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "vitest run",
    "lint": "tsc --noEmit",
    "typecheck": "tsc --noEmit",
    "build": "tsc --noEmit"
  },
  "devDependencies": {
    "fast-check": "^4.10.2",
    "typescript": "5.9.3",
    "vitest": "5.0.5"
  }
}
name: CI
# Minutes matter on a private repo (2000 free per month). Pull requests are verified outside Actions
# with scripts/verify-pr.sh (see docs/verify-pr.md). Until the user says the monthly quota has reset
# this workflow is manual only (Actions > CI > Run workflow); to restore the slim check after each
# push to main, add `push: { branches: [main] }` under `on:`.
on:
  workflow_dispatch:
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  changes:
    runs-on: ubuntu-latest
    timeout-minutes: 3
    outputs:
      code: ${{ steps.f.outputs.code }}
      web: ${{ steps.f.outputs.web }}
      contracts: ${{ steps.f.outputs.contracts }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - id: f
        env:
          BASE: ${{ github.event.before }}
        run: |
          if [ -z "$BASE" ] || [ "$BASE" = "0000000000000000000000000000000000000000" ] || ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then
            files=$(git ls-files)
          else
            files=$(git diff --name-only "$BASE" HEAD)
          fi
          echo "$files"
          flag() { if echo "$files" | grep -Eq "$1"; then echo true; else echo false; fi; }
          # code: anything except docs, markdown and screenshots; web: what the app build/e2e depends on.
          code=$(echo "$files" | grep -Ev '^(docs/|screenshots/)|\.md$' | grep -c . || true)
          echo "code=$([ "$code" -gt 0 ] && echo true || echo false)" >> "$GITHUB_OUTPUT"
          echo "web=$(flag '^(apps/web/|packages/|pnpm-lock.yaml|package.json|\.github/)')" >> "$GITHUB_OUTPUT"
          echo "contracts=$(flag '^(contracts/|packages/chain/|\.gitmodules|\.github/)')" >> "$GITHUB_OUTPUT"
  node:
    needs: changes
    if: needs.changes.outputs.code == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm gen:deno
      - run: git diff --exit-code -- supabase/functions
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
  # Playwright only on a manual run; scripts/verify-pr.sh runs it for every PR.
  e2e:
    needs: changes
    if: github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
        working-directory: apps/web
      - run: pnpm --filter @taskbar-hero/web build
      - run: pnpm --filter @taskbar-hero/web test:e2e
  contracts:
    needs: changes
    if: needs.changes.outputs.contracts == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    defaults:
      run:
        working-directory: contracts
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - uses: foundry-rs/foundry-toolchain@v1
      - run: forge build
      - run: forge test -vv
      # Deploy.t.sol rewrites packages/chain/deployments/31337.json; gen rewrites the ABIs.
      # Both must match what is committed.
      - run: node ../packages/chain/scripts/gen-abi.mjs
      - run: git diff --exit-code -- ../packages/chain
name: Deploy Edge Functions
# Deploys the Supabase Edge Functions to the live project (docs/go-live.md) when code they bundle
# changes on main, or by hand. Pull requests do not run it (Actions minutes).
on:
  push:
    branches: [main]
    paths:
      - supabase/functions/**
      - supabase/config.toml
      - packages/auth/**
      - packages/game-rules/**
      - packages/api-contract/** # types, error codes and statuses imported by _shared/game.ts
      - packages/chain/deployments/43113.json # RelicNFT address imported by _shared/game-server.ts
      - .github/workflows/deploy-functions.yml
  workflow_dispatch:

concurrency:
  group: deploy-functions
  cancel-in-progress: false

permissions:
  contents: read

env:
  PROJECT_REF: qoalewtxflagoprrxrgh
  FUNCTIONS: auth-nonce auth-verify game-state idle-claim equip boss-fight upgrade relic-forge relic-mint-report

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Decide whether to deploy
        id: gate
        env:
          HAS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN != '' }}
          EVENT: ${{ github.event_name }}
        run: |
          if [ "$EVENT" = "pull_request" ]; then
            echo "::notice title=Deploy skipped::Pull request run. Functions deploy when this merges to main."
            echo "deploy=false" >> "$GITHUB_OUTPUT"
          elif [ "$HAS_TOKEN" != "true" ]; then
            echo "::notice title=Deploy skipped::SUPABASE_ACCESS_TOKEN repo secret is not set (see docs/go-live.md)."
            echo "deploy=false" >> "$GITHUB_OUTPUT"
          else
            echo "deploy=true" >> "$GITHUB_OUTPUT"
          fi
      - uses: supabase/setup-cli@v1
        if: steps.gate.outputs.deploy == 'true'
        with:
          version: 2.122.0
      - name: Deploy
        if: steps.gate.outputs.deploy == 'true'
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        # --use-api bundles on Supabase's side (no Docker); each function's deno.json maps the
        # packages/* imports. Our functions check their own session JWT, hence --no-verify-jwt.
        run: |
          # shellcheck disable=SC2086 # FUNCTIONS is a space-separated list
          supabase functions deploy $FUNCTIONS --project-ref "$PROJECT_REF" --use-api --no-verify-jwt
```

Exit code: 0.

### 5. Command

```sh
rg --files -g '*.md' -g '!contracts/**' -g '!node_modules/**' | rg -i 'cat|v2|plan'; cat packages/game-rules/src/rules.ts; cat scripts/gen-deno-json.mjs; cat tsconfig.base.json; tail -15 packages/game-rules/src/v2/content/items.ts
```

```text
docs/proposals/schema-v2.md
import { CONFIG } from './config';
import { relicIdOf } from './content';
import { Rng, deriveSeed, type Seed } from './rng';
import type {
  BossEvent,
  BossResult,
  ForgeBlock,
  Gear,
  IdleGains,
  PlayerState,
  Rarity,
  Slot,
} from './types';

const C = CONFIG;

export function gearStat(g: Gear): number {
  const base = C.gear.baseStat[g.slot] * C.gear.rarityMultiplier[g.rarity];
  return base * (1 + C.gear.levelGrowth * (g.level - 1));
}

/** Hero power: base plus the best item of each slot. */
export function heroPower(gear: readonly Gear[]): number {
  const best = new Map<Slot, number>();
  for (const g of gear) best.set(g.slot, Math.max(best.get(g.slot) ?? 0, gearStat(g)));
  let p: number = C.hero.basePower;
  for (const v of best.values()) p += v;
  return p;
}

export function goldPerSecond(power: number): number {
  return C.idle.baseGoldPerSecond + C.idle.goldPerSecondPerPower * Math.max(0, power);
}

export function starterGear(): Gear[] {
  return C.slots.map((slot) => ({ slot, rarity: 'common' as const, level: 1 }));
}

export function newPlayer(): PlayerState {
  return {
    gear: starterGear(),
    gold: 0,
    shards: 0,
    bossKeys: 0,
    bossLevel: 1,
    lastBossKeyDay: -1,
    lastForgeDay: -1,
  };
}

export function upgradeCost(g: Gear): number | null {
  if (g.level >= C.gear.maxLevel) return null;
  return Math.ceil(
    C.gear.upgradeBaseCost *
      Math.pow(C.gear.upgradeCostGrowth, g.level - 1) *
      C.gear.upgradeRarityCostMultiplier[g.rarity],
  );
}

export interface ComputeOptions {
  /** True when the time was spent away: efficiency penalty applies. */
  offline?: boolean;
}

/**
 * Gains for `elapsedSeconds` of idle progress. Time is clamped to the offline
 * cap. One kill per `secondsPerKill`; gear and shards roll per kill.
 * Pure: same (state.gear, state.bossLevel, elapsed, seed, opts) => same result.
 */
export function computeIdleGains(
  state: Pick<PlayerState, 'gear' | 'bossLevel'>,
  elapsedSeconds: number,
  seed: Seed,
  opts: ComputeOptions = {},
): IdleGains {
  const counted = Math.min(Math.max(0, Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0), C.idle.offlineCapSeconds);
  const eff = opts.offline ? C.idle.offlineEfficiency : 1;
  const effective = counted * eff;
  const gold = Math.floor(goldPerSecond(heroPower(state.gear)) * effective);
  const kills = Math.floor(effective / C.idle.secondsPerKill);
  const rng = new Rng(deriveSeed(seed, 1));
  let shards = 0;
  const drops: Gear[] = [];
  for (let i = 0; i < kills; i++) {
    if (rng.chance(C.idle.shardDropChance)) shards += C.idle.shardsPerDrop;
    if (rng.chance(C.idle.gearDropChance)) {
      drops.push({
        slot: C.slots[rng.int(0, C.slots.length - 1)] as Slot,
        rarity: rng.weighted(C.idle.dropRarityWeights, C.rarities),
        level: Math.min(C.gear.maxLevel, Math.max(1, state.bossLevel)),
      });
    }
  }
  drops.sort((a, b) => gearStat(b) - gearStat(a));
  return { gold, shards, drops: drops.slice(0, C.idle.maxDropsPerClaim), countedSeconds: counted };
}

/**
 * Gains for one server claim covering `elapsedSeconds` since the previous claim. The first
 * `idle.onlineWindowSeconds` pay the full rate (an open game claims often); the rest pays
 * `idle.offlineEfficiency`. Total time is capped at `idle.offlineCapSeconds`. The two parts roll
 * with independent seeds derived from `seed`; drops are merged, best first, and capped.
 */
export function computeClaimGains(
  state: Pick<PlayerState, 'gear' | 'bossLevel'>,
  elapsedSeconds: number,
  seed: Seed,
): IdleGains {
  const counted = Math.min(Math.max(0, Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0), C.idle.offlineCapSeconds);
  const online = Math.min(counted, C.idle.onlineWindowSeconds);
  const a = computeIdleGains(state, online, deriveSeed(seed, 10));
  const b = computeIdleGains(state, counted - online, deriveSeed(seed, 11), { offline: true });
  const drops = [...a.drops, ...b.drops].sort((x, y) => gearStat(y) - gearStat(x));
  return {
    gold: a.gold + b.gold,
    shards: a.shards + b.shards,
    drops: drops.slice(0, C.idle.maxDropsPerClaim),
    countedSeconds: counted,
  };
}

export function bossPower(level: number): number {
  const l = Math.min(Math.max(1, Math.floor(level)), C.boss.maxLevel);
  return C.boss.basePower * Math.pow(C.boss.powerGrowth, l - 1);
}

/** Deterministic boss fight, 1 round per second; log is for client animation. */
export function simulateBoss(power: number, bossLevel: number, seed: Seed): BossResult {
  const rng = new Rng(deriveSeed(seed, 2));
  const bp = bossPower(bossLevel);
  const heroMaxHp = Math.round(power * C.hero.hpPerPower);
  const bossMaxHp = Math.round(bp * C.boss.hpPerPower);
  let heroHp = heroMaxHp;
  let bossHp = bossMaxHp;
  const log: BossEvent[] = [];
  let won = false;
  for (let t = 1; t <= C.boss.maxRounds; t++) {
    const crit = rng.chance(C.hero.critChance);
    const dmg = Math.round(power * C.hero.damagePerPower * (crit ? C.hero.critMultiplier : 1));
    bossHp = Math.max(0, bossHp - dmg);
    log.push({ t, type: 'hero_hit', damage: dmg, crit, bossHp });
    if (bossHp === 0) {
      won = true;
      break;
    }
    const spread = 1 + (rng.next() * 2 - 1) * C.boss.damageSpread;
    const bd = Math.round(bp * C.boss.damagePerPower * spread);
    heroHp = Math.max(0, heroHp - bd);
    log.push({ t, type: 'boss_hit', damage: bd, heroHp });
    if (heroHp === 0) break;
  }
  log.push({ t: log.length ? (log[log.length - 1] as BossEvent).t : 0, type: 'end', won });
  return { won, log, bossMaxHp, heroMaxHp };
}

/** Relic rarity odds as probabilities (sum to 1). */
export function relicOdds(): Record<Rarity, number> {
  const total = C.rarities.reduce((s, r) => s + C.relic.rarityOddsBp[r], 0);
  const out = {} as Record<Rarity, number>;
  for (const r of C.rarities) out[r] = C.relic.rarityOddsBp[r] / total;
  return out;
}

export function rollRelicRarity(seed: Seed): Rarity {
  const rng = new Rng(deriveSeed(seed, 3));
  return rng.weighted(C.relic.rarityOddsBp, C.rarities);
}

/** On-chain rarity (uint8): the index of `rarity` in CONFIG.rarities. */
export function rarityIndex(rarity: Rarity): number {
  return C.rarities.indexOf(rarity);
}

/**
 * The RelicNFT token id for a rarity tier. One relicId per tier (common = 1, ...) so a relicId's
 * rarity never changes (docs/contracts.md, rule 1). Server and client must both use this.
 */
export function relicIdFor(rarity: Rarity): number {
  return relicIdOf(rarity);
}

/** Day index (days reset at midnight UTC+7) for a unix time in seconds. */
export function dayIndex(unixSeconds: number): number {
  return Math.floor((unixSeconds + C.time.dayOffsetSeconds) / C.time.secondsPerDay);
}

export function canClaimBossKey(state: PlayerState, today: number): boolean {
  return state.lastBossKeyDay !== today;
}

/** Null when forging is allowed, otherwise the reason it is blocked. */
export function forgeBlock(state: PlayerState, today: number): ForgeBlock | null {
  if (state.lastForgeDay === today) return 'daily_limit';
  if (state.bossKeys < C.relic.bossKeyCost) return 'no_boss_key';
  if (state.shards < C.relic.shardCost) return 'not_enough_shards';
  return null;
}

export function canForge(state: PlayerState, today: number): boolean {
  return forgeBlock(state, today) === null;
}
// Generates Edge Function import maps. Edit these templates, then run `pnpm gen:deno`.
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const functionsDir = join(root, 'supabase/functions');

/**
 * game-rules imports its own modules without extensions ('./rng', './v2'), which Deno does not
 * resolve. Map every non-test module (and every folder with an index.ts) to its file, so new
 * modules need no edit here.
 */
function gameRulesImports() {
  const src = join(root, 'packages/game-rules/src');
  const out = {};
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('__')) continue;
        if (existsSync(join(full, 'index.ts'))) out[spec(full)] = `${spec(full)}/index.ts`;
        walk(full);
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && entry.name !== 'index.ts') {
        out[spec(full.slice(0, -3))] = `${spec(full)}`;
      }
    }
  };
  // Specifier as seen from supabase/functions/<name>/.
  const spec = (p) => `../../../${relative(root, p).split('\\').join('/')}`;
  walk(src);
  return out;
}

const auth = {
  imports: {
    '@supabase/supabase-js': 'npm:@supabase/supabase-js@2.117.3',
    'jose': 'npm:jose@6.2.12',
    'viem': 'npm:viem@2.57.4',
    'viem/siwe': 'npm:viem@2.57.4/siwe',
  },
};

const game = {
  imports: {
    ...auth.imports,
    'viem/accounts': 'npm:viem@2.57.4/accounts',
    '@taskbar-hero/api-contract': '../../../packages/api-contract/src/index.ts',
    '../../../packages/api-contract/src/endpoints': '../../../packages/api-contract/src/endpoints.ts',
    '../../../packages/api-contract/src/errors': '../../../packages/api-contract/src/errors.ts',
    '../../../packages/api-contract/src/state': '../../../packages/api-contract/src/state.ts',
    '../../../packages/api-contract/src/types': '../../../packages/api-contract/src/types.ts',
    // chain/src/index.ts reads deployment JSON, which Deno cannot import without import
    // attributes, so the functions get the JSON-free constants module instead.
    '@taskbar-hero/chain': '../../../packages/chain/src/constants.ts',
    '../../../packages/chain/src/abi': '../../../packages/chain/src/abi.ts',
    '@taskbar-hero/game-rules': '../../../packages/game-rules/src/index.ts',
    ...gameRulesImports(),
  },
};

const functions = readdirSync(functionsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
  .map((entry) => entry.name)
  .filter((name) => existsSync(join(functionsDir, name, 'index.ts')))
  .sort();

for (const name of functions) {
  const template = name.startsWith('auth-') ? auth : game;
  writeFileSync(join(functionsDir, name, 'deno.json'), `${JSON.stringify(template, null, 2)}\n`);
}

console.log(`wrote ${functions.length} Edge Function import maps`);
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "noEmit": true
  }
}
        id: `acc.${d.slot}.${d.id}.${rarity}`,
        slot: d.slot,
        rarity,
        name: `${ACCESSORY_PREFIXES[rarity]} ${d.name}`,
        baseStats: d.baseStats,
        visual: { set: d.id, palette: rarity },
        dropChapters: ALL_CHAPTERS,
      });
    }
  }
  return out;
}

/** The whole catalog: 35 weapons, 60 armor pieces, 60 accessories. */
export const ITEMS: readonly ItemDef[] = [...weaponItems(), ...armorItems(), ...accessoryItems()];
```

Exit code: 0.

### 6. Command

```sh
rg -n -i 'moon pearl|section 5|craft|bestStage|itemLevel' README.md docs/proposals/schema-v2.md packages/game-rules/src/v2 reports --glob '*.md' --glob '*.ts' | head -100; git log -1 --format='%H %an <%ae>'; git status --short
```

```text
docs/proposals/schema-v2.md:55:| `best_stage` | integer not null default 0 | highest stage ever cleared; sets crafted item level |
docs/proposals/schema-v2.md:79:| `source` | text not null | in (`starter`, `drop`, `chest`, `craft`, `founder`), for support and drop-rate checks |
docs/proposals/schema-v2.md:86:**Bag limit 200** (config `bagLimit`, passed in): every function that adds items counts the player's rows under the player lock. Idle drops and chest items that do not fit are salvaged at once into materials (the caller sends each item's salvage value with it) and the result lists them as `autoSalvaged`, so a full bag never loses value silently. Crafting into a full bag is refused (`bag_full`) because the player paid for a specific item.
docs/proposals/schema-v2.md:131:| `v2_craft(player, cost jsonb, item jsonb, bag_limit)` | `v2-craft` | Spends the recipe cost (Yarn, materials, Fish) and inserts the item with `source = 'craft'`. | `not_enough` with the first missing `stack_id`, `bag_full` |
docs/proposals/schema-v2.md:134:| `v2_relic_forge(player, day, relic_id, rarity, yarn_cost, pearl_cost, expires_at)` | `v2-relic-forge` | Same as v1 `game_forge`, but pays Yarn and a Moon Pearl from `player_stacks` instead of shards and a Boss Key. Writes the same `relic_forges` and `relic_vouchers` rows. | `pending` voucher returned, or blocked `daily_limit`, `not_enough_yarn`, `no_moon_pearl` (V5 `relicForgeBlockV2` order) |
docs/proposals/schema-v2.md:146:- craft: `"v2craft:<player>:<count of crafted items>"`; Relic: unchanged `"relic:<player>:<game day>"`, so v1 and v2 roll the same Relic on the same day.
docs/proposals/schema-v2.md:152:- Stack changes are deltas checked against the locked balance, so a craft and a claim in parallel both apply correctly.
docs/proposals/schema-v2.md:168:| Edge Functions | `game-state`, `idle-claim`, `equip`, `boss-fight`, `upgrade`, `relic-forge`, `relic-mint-report` | `v2-state`, `v2-claim`, `v2-equip`, `v2-choose-class`, `v2-boss-fight`, `v2-craft`, `v2-salvage`, `v2-lock`, `v2-relic-forge` (mint reports reuse v1 `relic-mint-report`, which only checks the chain) |
docs/proposals/schema-v2.md:179:2. Apply a small cut-over migration that calls `v2_grant_founder` for every `players` row that exists at that moment (all current players are Fuji testers). Contents are fixed (no roll), from the V6 numbers table, for example some Fish, Yarn, Fluff Tufts, 1 Moon Pearl and 2 Cat Keys. No gear, because the player has not picked a class yet; the first class pick gives the starter weapon.
docs/proposals/schema-v2.md:223:3. **Full bag:** idle drops and chest items that do not fit are salvaged automatically and shown in the result; crafting into a full bag is refused. Approve?
packages/game-rules/src/v2/content/chests.ts:45: * below. Chapter 2+ chests add Catnip Crystals, chapter 3+ Starlight Scales (plan section 5).
packages/game-rules/src/v2/content/recipes.ts:5: * Forge data (DATA ONLY; rules are V5 in ../forge). Plan section 5: the player picks a slot and a
packages/game-rules/src/v2/content/recipes.ts:7: * cleared stage. Salvage returns about 25% of the cost, so craft-then-salvage always loses.
packages/game-rules/src/v2/content/recipes.ts:40:/** The daily Relic NFT forge: 30 Yarn + 1 Moon Pearl, still one per day (odds stay in v1 CONFIG.relic). */
packages/game-rules/src/v2/content/materials.ts:15:  /** 0 = base (Yarn), 1..4 = crafting tiers; 'relic' and 'key' are special. */
packages/game-rules/src/v2/content/materials.ts:29:  { id: 'moonPearl', name: 'Moon Pearl', tier: 'relic', maxStack: 999 },
packages/game-rules/src/v2/content/validate.ts:249:    else if ((s.materials.yarn ?? 0) >= (recipe.materials.yarn ?? 0)) err(`salvage ${s.rarity}: returns as much Yarn as crafting costs`);
6744e9b15977186b411d68174ddd779e6b11b13e ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
```

Exit code: 0.

### 7. Command

```sh
pnpm install --frozen-lockfile
```

```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 450ms using pnpm v10.28.0
```

Exit code: 0.

### 8. Command

```sh
pnpm gen:deno
```

```text

> taskbar-hero@0.0.0 gen:deno /Users/bao/Documents/ChatGPT/taskbar hero
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```

Exit code: 0.

### 9. Command

```sh
pnpm typecheck
```

Process session: 80971.

```text

> taskbar-hero@0.0.0 typecheck /Users/bao/Documents/ChatGPT/taskbar hero
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
```

### 10. Command

```sh
pnpm lint
```

Process session: 87349.

```text

> taskbar-hero@0.0.0 lint /Users/bao/Documents/ChatGPT/taskbar hero
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
```

### 11. Command

```sh
pnpm --filter @taskbar-hero/game-rules test
```

Process session: 38830.

```text

> @taskbar-hero/game-rules@0.0.0 test /Users/bao/Documents/ChatGPT/taskbar hero/packages/game-rules
> vitest run

```

### 12. Output continuation (session 38830)

```text

 RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/packages/game-rules


 Test Files  7 passed (7)
      Tests  140 passed (140)
   Start at  19:30:52
   Duration  673ms (transform 58%, tests 26%, import 14%, worker 2%)

```

Exit code: 0.

### 13. Output continuation (session 80971)

```text
packages/chain typecheck: Done
packages/game-rules typecheck: Done
packages/auth typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

Exit code: 0.

### 14. Output continuation (session 87349)

```text
packages/chain lint: Done
packages/game-rules lint: Done
packages/auth lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done
```

Exit code: 0.

### 15. Command

```sh
git diff --check; git diff --stat; rg --files -g '*vitest*' -g '*vite*' -g '!contracts/**'; cat .gitignore; git status --short
```

```text
 packages/game-rules/src/v2/index.ts            | 2 ++
 supabase/functions/boss-fight/deno.json        | 7 ++++++-
 supabase/functions/equip/deno.json             | 7 ++++++-
 supabase/functions/game-state/deno.json        | 7 ++++++-
 supabase/functions/idle-claim/deno.json        | 7 ++++++-
 supabase/functions/relic-forge/deno.json       | 7 ++++++-
 supabase/functions/relic-mint-report/deno.json | 7 ++++++-
 supabase/functions/upgrade/deno.json           | 7 ++++++-
 8 files changed, 44 insertions(+), 7 deletions(-)
apps/web/vite.config.ts
supabase/tests/vitest.config.ts
node_modules
dist
.env
.env.*
!.env.example
*.tsbuildinfo
coverage
test-results
playwright-report
dist-v2
 M packages/game-rules/src/v2/index.ts
 M supabase/functions/boss-fight/deno.json
 M supabase/functions/equip/deno.json
 M supabase/functions/game-state/deno.json
 M supabase/functions/idle-claim/deno.json
 M supabase/functions/relic-forge/deno.json
 M supabase/functions/relic-mint-report/deno.json
 M supabase/functions/upgrade/deno.json
?? packages/game-rules/src/v2/forge/
?? packages/game-rules/src/v2/lootcheck/
```

Exit code: 0.

### 16. Command

```sh
pnpm test
```

Process session: 44703.

```text

> taskbar-hero@0.0.0 test /Users/bao/Documents/ChatGPT/taskbar hero
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
packages/game-rules test$ vitest run
supabase/tests test$ vitest run
packages/game-rules test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/packages/game-rules
```

### 17. Command

```sh
pnpm build
```

Process session: 40875.

```text

> taskbar-hero@0.0.0 build /Users/bao/Documents/ChatGPT/taskbar hero
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
```

### 18. Command

```sh
git diff -- packages/game-rules/src/v2/index.ts supabase/functions/game-state/deno.json; rg --files packages/game-rules/src/v2/forge packages/game-rules/src/v2/lootcheck; ls -l packages/game-rules/src/v2/forge packages/game-rules/src/v2/lootcheck; cat packages/game-rules/src/v2/index.ts; cat packages/game-rules/src/v2/forge/craft.ts
```

```text
diff --git a/packages/game-rules/src/v2/index.ts b/packages/game-rules/src/v2/index.ts
index 67937ed..af9d188 100644
--- a/packages/game-rules/src/v2/index.ts
+++ b/packages/game-rules/src/v2/index.ts
@@ -1,2 +1,4 @@
 /** Cat RPG v2 rules, built beside v1 until cut-over (V29). Import as `v2` from the package root. */
 export * from './content';
+export * from './lootcheck';
+export * from './forge';
diff --git a/supabase/functions/game-state/deno.json b/supabase/functions/game-state/deno.json
index c7d444a..4c6e0e5 100644
--- a/supabase/functions/game-state/deno.json
+++ b/supabase/functions/game-state/deno.json
@@ -32,6 +32,11 @@
     "../../../packages/game-rules/src/v2/content/recipes": "../../../packages/game-rules/src/v2/content/recipes.ts",
     "../../../packages/game-rules/src/v2/content/slots": "../../../packages/game-rules/src/v2/content/slots.ts",
     "../../../packages/game-rules/src/v2/content/stats": "../../../packages/game-rules/src/v2/content/stats.ts",
-    "../../../packages/game-rules/src/v2/content/validate": "../../../packages/game-rules/src/v2/content/validate.ts"
+    "../../../packages/game-rules/src/v2/content/validate": "../../../packages/game-rules/src/v2/content/validate.ts",
+    "../../../packages/game-rules/src/v2/forge": "../../../packages/game-rules/src/v2/forge/index.ts",
+    "../../../packages/game-rules/src/v2/forge/craft": "../../../packages/game-rules/src/v2/forge/craft.ts",
+    "../../../packages/game-rules/src/v2/forge/relic": "../../../packages/game-rules/src/v2/forge/relic.ts",
+    "../../../packages/game-rules/src/v2/forge/salvage": "../../../packages/game-rules/src/v2/forge/salvage.ts",
+    "../../../packages/game-rules/src/v2/lootcheck": "../../../packages/game-rules/src/v2/lootcheck/index.ts"
   }
 }
packages/game-rules/src/v2/lootcheck/index.ts
packages/game-rules/src/v2/forge/craft.ts
packages/game-rules/src/v2/forge/forge.test.ts
packages/game-rules/src/v2/forge/relic.ts
packages/game-rules/src/v2/forge/salvage.ts
packages/game-rules/src/v2/forge/index.ts
packages/game-rules/src/v2/forge:
total 56
-rw-r--r--@ 1 bao  staff   3554 Oct 24 19:29 craft.ts
-rw-r--r--@ 1 bao  staff  10125 Oct 24 19:30 forge.test.ts
-rw-r--r--@ 1 bao  staff    464 Oct 24 19:29 index.ts
-rw-r--r--@ 1 bao  staff    740 Oct 24 19:29 relic.ts
-rw-r--r--@ 1 bao  staff    468 Oct 24 19:29 salvage.ts

packages/game-rules/src/v2/lootcheck:
total 16
-rw-r--r--@ 1 bao  staff  4699 Oct 24 19:30 index.ts
/** Cat RPG v2 rules, built beside v1 until cut-over (V29). Import as `v2` from the package root. */
export * from './content';
export * from './lootcheck';
export * from './forge';
import { Rng, type Seed } from '../../rng';
import type { WeaponType } from '../content/classes';
import { ITEMS } from '../content/items';
import { RECIPES, type MaterialCost } from '../content/recipes';
import { GEAR_RARITIES, type GearRarityId } from '../content/rarities';
import { GEAR_SLOT_IDS, type GearSlotId } from '../content/slots';
import { BONUS_LINE_RANGES, STATS, type StatId } from '../content/stats';
import type { ForgeState } from './index';

const COST_ORDER = ['yarn', 'fluffTuft', 'shinyButton', 'catnipCrystal', 'starlightScale', 'moonPearl'] as const;

export type CraftBlock = 'unknown_recipe' | 'unknown_slot' |
  `not_enough_${(typeof COST_ORDER)[number] | 'fish'}`;

export interface BonusLine {
  stat: StatId;
  value: number;
}

export interface CraftedItem {
  /** Stable content catalog id; owned-instance ids belong to the caller. */
  itemKey: string;
  slot: GearSlotId;
  weaponType?: WeaponType;
  rarity: GearRarityId;
  itemLevel: number;
  bonusLines: BonusLine[];
}

export interface CraftResult {
  item: CraftedItem;
  spent: { materials: MaterialCost; fish: number };
}

/** Missing stacks count as zero. Recipe/slot validation precedes the ordered cost checks. */
export function craftBlock(state: ForgeState, recipeId: string, slot: string): CraftBlock | null {
  const recipe = RECIPES.find((entry) => entry.id === recipeId);
  if (!recipe) return 'unknown_recipe';
  if (!GEAR_SLOT_IDS.some((id) => id === slot)) return 'unknown_slot';
  for (const id of COST_ORDER) {
    if ((state.stacks[id] ?? 0) < (recipe.materials[id] ?? 0)) return `not_enough_${id}`;
  }
  if ((state.stacks.fish ?? 0) < recipe.fish) return 'not_enough_fish';
  return null;
}

/**
 * Pure roll, with no spending applied. Throws Error(block reason) for a blocked craft.
 * Level = floor(bestStage), clamped to 1..rarity.maxLevel. Bonus stats are distinct;
 * each value is uniform over its content range. RNG order: catalog item, then stat/value pairs.
 */
export function craft(
  state: ForgeState,
  recipeId: string,
  slot: string,
  classWeaponType: WeaponType,
  bestStage: number,
  seed: Seed,
): CraftResult {
  const block = craftBlock(state, recipeId, slot);
  if (block) throw new Error(block);
  if (!Number.isFinite(bestStage)) throw new RangeError('bestStage must be finite');
  const recipe = RECIPES.find((entry) => entry.id === recipeId)!;
  const rarity = GEAR_RARITIES.find((entry) => entry.id === recipe.rarity)!;
  const candidates = ITEMS.filter((item) => item.slot === slot && item.rarity === recipe.rarity &&
    (slot !== 'weapon' || item.weaponType === classWeaponType));
  if (candidates.length === 0) throw new Error('No matching catalog item');
  const rng = new Rng(seed);
  const definition = candidates[rng.int(0, candidates.length - 1)]!;
  const available = STATS.filter((stat) => stat.bonusLine).map((stat) => stat.id);
  const bonusLines: BonusLine[] = [];
  for (let line = 0; line < rarity.bonusLines; line++) {
    const [stat] = available.splice(rng.int(0, available.length - 1), 1);
    const [min, max] = BONUS_LINE_RANGES[stat!]![rarity.id];
    bonusLines.push({ stat: stat!, value: min + rng.next() * (max - min) });
  }
  return {
    item: {
      itemKey: definition.id,
      slot: definition.slot,
      ...(slot === 'weapon' ? { weaponType: classWeaponType } : {}),
      rarity: recipe.rarity,
      itemLevel: Math.min(rarity.maxLevel, Math.max(1, Math.floor(bestStage))),
      bonusLines,
    },
    spent: { materials: { ...recipe.materials }, fish: recipe.fish },
  };
}
```

Exit code: 0.

### 19. Output continuation (session 44703)

```text
packages/auth test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/packages/auth
supabase/tests test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/supabase/tests
packages/chain test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/packages/chain
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  19:31:08
packages/chain test:    Duration  663ms (import 51%, worker 20%, tests 15%, transform 13%)
packages/chain test: Done
packages/game-rules test:  Test Files  7 passed (7)
packages/game-rules test:       Tests  140 passed (140)
packages/game-rules test:    Start at  19:31:08
packages/game-rules test:    Duration  1.10s (tests 68%, import 19%, transform 12%, worker 1%)
packages/game-rules test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  19:31:08
packages/auth test:    Duration  1.32s (import 78%, tests 19%, transform 3%, worker 1%)
packages/auth test: Done
supabase/tests test:  Test Files  12 passed (12)
supabase/tests test:       Tests  301 passed (301)
supabase/tests test:    Start at  19:31:08
supabase/tests test:    Duration  7.08s (tests 72%, import 19%, transform 9%)
supabase/tests test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  19:31:16
packages/api-contract test:    Duration  284ms (transform 75%, import 18%, tests 6%, worker 1%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /Users/bao/Documents/ChatGPT/taskbar hero/apps/web
apps/web test:  Test Files  25 passed (25)
apps/web test:       Tests  199 passed (199)
apps/web test:    Start at  19:31:17
apps/web test:    Duration  4.67s (environment 53%, tests 24%, import 18%, transform 5%)
apps/web test: Environment  jsdom was created 25 times · 21.75s total, 53% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done
```

Exit code: 0.

### 20. Output continuation (session 40875)

```text
packages/chain build: Done
packages/game-rules build: Done
packages/auth build: Done
supabase/tests build: Done
packages/api-contract build$ tsc --noEmit
packages/api-contract build: Done
apps/web build$ tsc --noEmit && vite build
apps/web build: vite v8.3.5 building client environment for production...
apps/web build: transforming...
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/Users/bao/Documents/ChatGPT/taskbar hero/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1684 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-djZZZ0we.css               34.77 kB │ gzip:   7.28 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-BID6FgKF.js                95.06 kB │ gzip:  27.88 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 370ms
apps/web build: Done
```

Exit code: 0.

### 21. Command

```sh
git clone --shared --no-checkout '/Users/bao/Documents/ChatGPT/taskbar hero' /tmp/taskbar-hero-v5-forge
```

```text
Cloning into '/tmp/taskbar-hero-v5-forge'...
done.
```

Exit code: 0.

### 22. Command

Working directory: /tmp/taskbar-hero-v5-forge

```sh
git remote set-url origin https://github.com/ntbaoheyhey/taskbar-hero.git; git config user.email 108352255+ntbaoheyhey@users.noreply.github.com; git config user.name ntbaoheyhey; git switch -c ai/codex-v5-forge 6744e9b15977186b411d68174ddd779e6b11b13e; git config user.email; git config user.name; mkdir -p packages/game-rules/src/v2/forge; cp '/Users/bao/Documents/ChatGPT/taskbar hero/packages/game-rules/src/v2/forge/'*.ts packages/game-rules/src/v2/forge/; printf "export * from './forge';\n" >> packages/game-rules/src/v2/index.ts; git diff -- packages/game-rules/src/v2/index.ts
```

```text
Switched to a new branch 'ai/codex-v5-forge'
108352255+ntbaoheyhey@users.noreply.github.com
ntbaoheyhey
diff --git a/packages/game-rules/src/v2/index.ts b/packages/game-rules/src/v2/index.ts
index 67937ed..38d2b7b 100644
--- a/packages/game-rules/src/v2/index.ts
+++ b/packages/game-rules/src/v2/index.ts
@@ -1,2 +1,3 @@
 /** Cat RPG v2 rules, built beside v1 until cut-over (V29). Import as `v2` from the package root. */
 export * from './content';
+export * from './forge';
```

Exit code: 0.

### 23. Command

Working directory: /tmp/taskbar-hero-v5-forge

```sh
pnpm install --frozen-lockfile
```

```text
Progress: resolved 505, reused 496, downloaded 0, added 93
Progress: resolved 505, reused 496, downloaded 0, added 276
Progress: resolved 505, reused 496, downloaded 0, added 337
Progress: resolved 505, reused 496, downloaded 0, added 414
Progress: resolved 505, reused 496, downloaded 0, added 502
Progress: resolved 505, reused 496, downloaded 0, added 504
Progress: resolved 505, reused 496, downloaded 0, added 505, done

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: bufferutil@4.1.0, keccak@3.0.4,                     │
│   utf-8-validate@5.0.10.                                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 6.5s using pnpm v10.28.0
```

Exit code: 0.

### 24. Command

Working directory: /tmp/taskbar-hero-v5-forge

```sh
pnpm gen:deno
```

```text

> taskbar-hero@0.0.0 gen:deno /private/tmp/taskbar-hero-v5-forge
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
```

Exit code: 0.

### 25. Command

Working directory: /tmp/taskbar-hero-v5-forge

```sh
pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/forge/forge.test.ts
```

Process session: 2401.

```text
(no output)
```

### 26. Output continuation (session 2401)

```text

 RUN  v5.0.5 /private/tmp/taskbar-hero-v5-forge/packages/game-rules


 Test Files  1 passed (1)
      Tests  31 passed (31)
   Start at  19:32:04
   Duration  300ms (tests 48%, transform 41%, import 10%, worker 1%)

```

Exit code: 0.

### 27. Command

Working directory: /tmp/taskbar-hero-v5-forge

```sh
pnpm lint
```

Process session: 78890.

```text

> taskbar-hero@0.0.0 lint /private/tmp/taskbar-hero-v5-forge
> pnpm -r lint

Scope: 6 of 7 workspace projects
packages/auth lint$ tsc --noEmit
packages/chain lint$ tsc --noEmit
packages/game-rules lint$ tsc --noEmit
supabase/tests lint$ tsc --noEmit
```

### 28. Command

Working directory: /tmp/taskbar-hero-v5-forge

```sh
pnpm typecheck
```

Process session: 75802.

```text

> taskbar-hero@0.0.0 typecheck /private/tmp/taskbar-hero-v5-forge
> pnpm -r typecheck

Scope: 6 of 7 workspace projects
packages/auth typecheck$ tsc --noEmit
packages/game-rules typecheck$ tsc --noEmit
packages/chain typecheck$ tsc --noEmit
supabase/tests typecheck$ tsc --noEmit
```

### 29. Command

Working directory: /tmp/taskbar-hero-v5-forge

```sh
pnpm build
```

Process session: 33931.

```text

> taskbar-hero@0.0.0 build /private/tmp/taskbar-hero-v5-forge
> pnpm -r build

Scope: 6 of 7 workspace projects
packages/auth build$ tsc --noEmit
packages/chain build$ tsc --noEmit
packages/game-rules build$ tsc --noEmit
supabase/tests build$ tsc --noEmit
```

### 30. Command

Working directory: /tmp/taskbar-hero-v5-forge

```sh
pnpm test
```

Process session: 7454.

```text

> taskbar-hero@0.0.0 test /private/tmp/taskbar-hero-v5-forge
> pnpm -r test

Scope: 6 of 7 workspace projects
packages/auth test$ vitest run
packages/chain test$ vitest run
supabase/tests test$ vitest run
packages/game-rules test$ vitest run
```

### 31. Output continuation (session 75802)

```text
packages/chain typecheck: Done
packages/game-rules typecheck: Done
packages/auth typecheck: Done
supabase/tests typecheck: Done
packages/api-contract typecheck$ tsc --noEmit
packages/api-contract typecheck: Done
apps/web typecheck$ tsc --noEmit
apps/web typecheck: Done
```

Exit code: 0.

### 32. Output continuation (session 78890)

```text
packages/chain lint: Done
packages/game-rules lint: Done
packages/auth lint: Done
supabase/tests lint: Done
packages/api-contract lint$ tsc --noEmit
packages/api-contract lint: Done
apps/web lint$ tsc --noEmit
apps/web lint: Done
```

Exit code: 0.

### 33. Command

Working directory: /tmp/taskbar-hero-v5-forge

```sh
git diff --check; git diff -- packages/game-rules/src/v2/index.ts supabase/functions/game-state/deno.json; git status --short; git ls-remote origin refs/heads/main refs/heads/ai/codex-v5-forge; git config user.email; git config user.name
```

Process session: 97080.

```text
diff --git a/packages/game-rules/src/v2/index.ts b/packages/game-rules/src/v2/index.ts
index 67937ed..38d2b7b 100644
--- a/packages/game-rules/src/v2/index.ts
+++ b/packages/game-rules/src/v2/index.ts
@@ -1,2 +1,3 @@
 /** Cat RPG v2 rules, built beside v1 until cut-over (V29). Import as `v2` from the package root. */
 export * from './content';
+export * from './forge';
diff --git a/supabase/functions/game-state/deno.json b/supabase/functions/game-state/deno.json
index c7d444a..43fc55c 100644
--- a/supabase/functions/game-state/deno.json
+++ b/supabase/functions/game-state/deno.json
@@ -32,6 +32,10 @@
     "../../../packages/game-rules/src/v2/content/recipes": "../../../packages/game-rules/src/v2/content/recipes.ts",
     "../../../packages/game-rules/src/v2/content/slots": "../../../packages/game-rules/src/v2/content/slots.ts",
     "../../../packages/game-rules/src/v2/content/stats": "../../../packages/game-rules/src/v2/content/stats.ts",
-    "../../../packages/game-rules/src/v2/content/validate": "../../../packages/game-rules/src/v2/content/validate.ts"
+    "../../../packages/game-rules/src/v2/content/validate": "../../../packages/game-rules/src/v2/content/validate.ts",
+    "../../../packages/game-rules/src/v2/forge": "../../../packages/game-rules/src/v2/forge/index.ts",
+    "../../../packages/game-rules/src/v2/forge/craft": "../../../packages/game-rules/src/v2/forge/craft.ts",
+    "../../../packages/game-rules/src/v2/forge/relic": "../../../packages/game-rules/src/v2/forge/relic.ts",
+    "../../../packages/game-rules/src/v2/forge/salvage": "../../../packages/game-rules/src/v2/forge/salvage.ts"
   }
 }
 M packages/game-rules/src/v2/index.ts
 M supabase/functions/boss-fight/deno.json
 M supabase/functions/equip/deno.json
 M supabase/functions/game-state/deno.json
 M supabase/functions/idle-claim/deno.json
 M supabase/functions/relic-forge/deno.json
 M supabase/functions/relic-mint-report/deno.json
 M supabase/functions/upgrade/deno.json
?? packages/game-rules/src/v2/forge/
```

### 34. Output continuation (session 7454)

```text
packages/game-rules test:  RUN  v5.0.5 /private/tmp/taskbar-hero-v5-forge/packages/game-rules
packages/auth test:  RUN  v5.0.5 /private/tmp/taskbar-hero-v5-forge/packages/auth
supabase/tests test:  RUN  v5.0.5 /private/tmp/taskbar-hero-v5-forge/supabase/tests
packages/chain test:  RUN  v5.0.5 /private/tmp/taskbar-hero-v5-forge/packages/chain
packages/game-rules test:  Test Files  7 passed (7)
packages/game-rules test:       Tests  140 passed (140)
packages/game-rules test:    Start at  19:32:34
packages/game-rules test:    Duration  831ms (tests 59%, transform 22%, import 16%, worker 2%)
packages/game-rules test: Done
packages/chain test:  Test Files  2 passed (2)
packages/chain test:       Tests  7 passed (7)
packages/chain test:    Start at  19:32:34
packages/chain test:    Duration  491ms (transform 55%, import 33%, tests 7%, worker 4%)
packages/chain test: Done
packages/auth test:  Test Files  1 passed (1)
packages/auth test:       Tests  24 passed (24)
packages/auth test:    Start at  19:32:34
packages/auth test:    Duration  1.07s (import 72%, tests 18%, transform 10%)
packages/auth test: Done
supabase/tests test:  Test Files  12 passed (12)
supabase/tests test:       Tests  301 passed (301)
supabase/tests test:    Start at  19:32:34
supabase/tests test:    Duration  7.27s (tests 83%, import 12%, transform 5%)
supabase/tests test: Done
packages/api-contract test$ pnpm --filter @taskbar-hero/game-rules exec vitest run --root ../api-contract
packages/api-contract test:  RUN  v5.0.5 /private/tmp/taskbar-hero-v5-forge/packages/api-contract
packages/api-contract test:  Test Files  1 passed (1)
packages/api-contract test:       Tests  16 passed (16)
packages/api-contract test:    Start at  19:32:42
packages/api-contract test:    Duration  317ms (transform 78%, import 18%, tests 3%, worker 2%)
packages/api-contract test: Done
apps/web test$ vitest run
apps/web test:  RUN  v5.0.5 /private/tmp/taskbar-hero-v5-forge/apps/web
apps/web test:  Test Files  25 passed (25)
apps/web test:       Tests  199 passed (199)
apps/web test:    Start at  19:32:43
apps/web test:    Duration  4.86s (environment 55%, tests 22%, import 14%, transform 8%)
apps/web test: Environment  jsdom was created 25 times · 22.52s total, 55% of tracked time
apps/web test:              create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
apps/web test:              learn more: https://vitest.dev/guide/improving-performance#test-environments
apps/web test: Done
```

Exit code: 0.

### 35. Output continuation (session 33931)

```text
packages/chain build: Done
packages/game-rules build: Done
packages/auth build: Done
supabase/tests build: Done
packages/api-contract build$ tsc --noEmit
packages/api-contract build: Done
apps/web build$ tsc --noEmit && vite build
apps/web build: vite v8.3.5 building client environment for production...
apps/web build: transforming...
apps/web build: [plugin rolldown:vite-resolve] Module "node:worker_threads" has been externalized for browser compatibility, imported by "/private/tmp/taskbar-hero-v5-forge/node_modules/.pnpm/ox@0.14.57_typescript@5.9.3_zod@4.6.7/node_modules/ox/_esm/tempo/internal/virtualMasterPool.js". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.
apps/web build: ✓ 1683 modules transformed.
apps/web build: rendering chunks...
apps/web build: computing gzip size...
apps/web build: dist/index.html                               2.05 kB │ gzip:   0.75 kB
apps/web build: dist/assets/index-djZZZ0we.css               34.77 kB │ gzip:   7.28 kB
apps/web build: dist/assets/rolldown-runtime-XKyaHtl9.js      0.72 kB │ gzip:   0.42 kB
apps/web build: dist/assets/createGame-CYG5tCgZ.js            8.45 kB │ gzip:   3.48 kB
apps/web build: dist/assets/index-BID6FgKF.js                95.06 kB │ gzip:  27.88 kB
apps/web build: dist/assets/react-KPuNr9iS.js               218.74 kB │ gzip:  68.27 kB
apps/web build: dist/assets/web3-BKxr0A5j.js                363.83 kB │ gzip: 108.14 kB
apps/web build: dist/assets/phaser-CS_hOpYn.js            1,194.43 kB │ gzip: 318.49 kB
apps/web build: ✓ built in 556ms
apps/web build: Done
```

Exit code: 0.

### 36. Output continuation (session 97080)

```text
6744e9b15977186b411d68174ddd779e6b11b13e	refs/heads/main
108352255+ntbaoheyhey@users.noreply.github.com
ntbaoheyhey
```

Exit code: 0.

### 37. Command

Working directory: /tmp/taskbar-hero-v5-forge

```sh
git add packages/game-rules/src/v2/forge/index.ts packages/game-rules/src/v2/forge/craft.ts packages/game-rules/src/v2/forge/salvage.ts packages/game-rules/src/v2/forge/relic.ts packages/game-rules/src/v2/forge/forge.test.ts packages/game-rules/src/v2/index.ts supabase/functions/boss-fight/deno.json supabase/functions/equip/deno.json supabase/functions/game-state/deno.json supabase/functions/idle-claim/deno.json supabase/functions/relic-forge/deno.json supabase/functions/relic-mint-report/deno.json supabase/functions/upgrade/deno.json
```

```text
(no output)
```

Exit code: 0.

### 38. Command

Working directory: /tmp/taskbar-hero-v5-forge

```sh
pnpm gen:deno && git diff --exit-code -- supabase/functions && git diff --cached --check && git diff --cached --stat
```

```text

> taskbar-hero@0.0.0 gen:deno /private/tmp/taskbar-hero-v5-forge
> node scripts/gen-deno-json.mjs

wrote 9 Edge Function import maps
 packages/game-rules/src/v2/forge/craft.ts      |  88 +++++++++++
 packages/game-rules/src/v2/forge/forge.test.ts | 200 +++++++++++++++++++++++++
 packages/game-rules/src/v2/forge/index.ts      |  14 ++
 packages/game-rules/src/v2/forge/relic.ts      |  15 ++
 packages/game-rules/src/v2/forge/salvage.ts    |   9 ++
 packages/game-rules/src/v2/index.ts            |   1 +
 supabase/functions/boss-fight/deno.json        |   6 +-
 supabase/functions/equip/deno.json             |   6 +-
 supabase/functions/game-state/deno.json        |   6 +-
 supabase/functions/idle-claim/deno.json        |   6 +-
 supabase/functions/relic-forge/deno.json       |   6 +-
 supabase/functions/relic-mint-report/deno.json |   6 +-
 supabase/functions/upgrade/deno.json           |   6 +-
 13 files changed, 362 insertions(+), 7 deletions(-)
```

Exit code: 0.

### 39. Command

Working directory: /tmp/taskbar-hero-v5-forge

```sh
git commit -m 'feat(game-rules): add v2 forge and salvage rules [skip ci]' && git log origin/main..HEAD --format='%H %an <%ae> | %cn <%ce>' && git diff --exit-code && git push -u origin ai/codex-v5-forge
```

```text
[ai/codex-v5-forge 0356567] feat(game-rules): add v2 forge and salvage rules [skip ci]
 13 files changed, 362 insertions(+), 7 deletions(-)
 create mode 100644 packages/game-rules/src/v2/forge/craft.ts
 create mode 100644 packages/game-rules/src/v2/forge/forge.test.ts
 create mode 100644 packages/game-rules/src/v2/forge/index.ts
 create mode 100644 packages/game-rules/src/v2/forge/relic.ts
 create mode 100644 packages/game-rules/src/v2/forge/salvage.ts
fatal: ambiguous argument 'origin/main..HEAD': unknown revision or path not in the working tree.
Use '--' to separate paths from revisions, like this:
'git <command> [<revision>...] -- [<file>...]'
```

Exit code: 128.

### 40. Command

Working directory: /tmp/taskbar-hero-v5-forge

```sh
git fetch origin && git log origin/main..HEAD --format='%H %an <%ae> | %cn <%ce>' && git diff --exit-code && git push -u origin ai/codex-v5-forge
```

Process session: 22509.

```text
(no output)
```

### 41. Output continuation (session 22509)

```text
From https://github.com/ntbaoheyhey/taskbar-hero
 * [new branch]      ai/antigravity-b3-ag2   -> origin/ai/antigravity-b3-ag2
 * [new branch]      ai/antigravity-b3-ag3   -> origin/ai/antigravity-b3-ag3
 * [new branch]      ai/antigravity-b5-ag6   -> origin/ai/antigravity-b5-ag6
 * [new branch]      ai/antigravity-v25-icons -> origin/ai/antigravity-v25-icons
 * [new branch]      antigravity/cafe-board  -> origin/antigravity/cafe-board
 * [new branch]      antigravity/fresh-clone-test -> origin/antigravity/fresh-clone-test
 * [new branch]      antigravity/game-rules-tests -> origin/antigravity/game-rules-tests
 * [new branch]      antigravity/howto-focus-help -> origin/antigravity/howto-focus-help
 * [new branch]      antigravity/howto-polish -> origin/antigravity/howto-polish
 * [new branch]      antigravity/live-qa-report -> origin/antigravity/live-qa-report
 * [new branch]      antigravity/motion-foundation -> origin/antigravity/motion-foundation
 * [new branch]      antigravity/pitch-outline -> origin/antigravity/pitch-outline
 * [new branch]      antigravity/qa-round-2  -> origin/antigravity/qa-round-2
 * [new branch]      antigravity/qa-round-3  -> origin/antigravity/qa-round-3
 * [new branch]      antigravity/refactor-r1-consistency -> origin/antigravity/refactor-r1-consistency
 * [new branch]      antigravity/ui-page-cat -> origin/antigravity/ui-page-cat
 * [new branch]      ci/vercel-main-only     -> origin/ci/vercel-main-only
 * [new branch]      claude/auth-wrapper-tests -> origin/claude/auth-wrapper-tests
 * [new branch]      claude/bundle-audit     -> origin/claude/bundle-audit
 * [new branch]      claude/concurrency-tests -> origin/claude/concurrency-tests
 * [new branch]      claude/contract-coverage -> origin/claude/contract-coverage
 * [new branch]      claude/contract-security-review -> origin/claude/contract-security-review
 * [new branch]      claude/docs-accuracy    -> origin/claude/docs-accuracy
 * [new branch]      claude/error-states     -> origin/claude/error-states
 * [new branch]      claude/live-check-runbook -> origin/claude/live-check-runbook
 * [new branch]      claude/malformed-requests -> origin/claude/malformed-requests
 * [new branch]      claude/pixel-texture-warning -> origin/claude/pixel-texture-warning
 * [new branch]      claude/project-thread-705fac -> origin/claude/project-thread-705fac
 * [new branch]      claude/project-thread-c979x8 -> origin/claude/project-thread-c979x8
 * [new branch]      claude/project-thread-k1v0f2 -> origin/claude/project-thread-k1v0f2
 * [new branch]      claude/project-thread-opsp9t -> origin/claude/project-thread-opsp9t
 * [new branch]      claude/project-thread-r0shfx -> origin/claude/project-thread-r0shfx
 * [new branch]      claude/real-verifier    -> origin/claude/real-verifier
 * [new branch]      claude/relic-recovery-proposal -> origin/claude/relic-recovery-proposal
 * [new branch]      claude/rls-tests        -> origin/claude/rls-tests
 * [new branch]      claude/security-headers -> origin/claude/security-headers
 * [new branch]      claude/submission-doc   -> origin/claude/submission-doc
 * [new branch]      claude/test-stability   -> origin/claude/test-stability
 * [new branch]      claude/wallet-copy-reset-time -> origin/claude/wallet-copy-reset-time
 * [new branch]      claude/web-security-check -> origin/claude/web-security-check
 * [new branch]      docs/r8-extending       -> origin/docs/r8-extending
 * [new branch]      docs/ui-a5-readme       -> origin/docs/ui-a5-readme
 * [new branch]      fix/qa-copy-typo        -> origin/fix/qa-copy-typo
 * [new branch]      main                    -> origin/main
 * [new branch]      refactor/r3-api-contract -> origin/refactor/r3-api-contract
 * [new branch]      refactor/r4-chain-constants -> origin/refactor/r4-chain-constants
 * [new branch]      refactor/r6-state-builder -> origin/refactor/r6-state-builder
 * [new branch]      task/A1-app-shell       -> origin/task/A1-app-shell
 * [new branch]      task/A2-idle-loop       -> origin/task/A2-idle-loop
 * [new branch]      task/A3-wallet-connect  -> origin/task/A3-wallet-connect
 * [new branch]      task/A4-inventory       -> origin/task/A4-inventory
 * [new branch]      task/A5-boss-screen     -> origin/task/A5-boss-screen
 * [new branch]      task/A6-forge           -> origin/task/A6-forge
 * [new branch]      task/A8-upgrade         -> origin/task/A8-upgrade
 * [new branch]      task/A9-forge-today     -> origin/task/A9-forge-today
 * [new branch]      task/B1-db-schema       -> origin/task/B1-db-schema
 * [new branch]      task/B2-wallet-signin   -> origin/task/B2-wallet-signin
 * [new branch]      task/C1-relic-nft       -> origin/task/C1-relic-nft
 * [new branch]      task/C2-relic-market    -> origin/task/C2-relic-market
 * [new branch]      task/O1-onboarding      -> origin/task/O1-onboarding
 * [new branch]      task/T0-skeleton        -> origin/task/T0-skeleton
 * [new branch]      task/T1-game-rules      -> origin/task/T1-game-rules
 * [new branch]      task/V1-content-registry -> origin/task/V1-content-registry
 * [new branch]      task/V13-stage-layout   -> origin/task/V13-stage-layout
 * [new branch]      task/V2-combat-core     -> origin/task/V2-combat-core
 * [new branch]      task/V8a-schema-proposal -> origin/task/V8a-schema-proposal
 * [new branch]      task/W1-real-server     -> origin/task/W1-real-server
 * [new branch]      task/X0-api-contract    -> origin/task/X0-api-contract
 * [new branch]      task/X1-forge-contract  -> origin/task/X1-forge-contract
 * [new branch]      task/X2-upgrade-contract -> origin/task/X2-upgrade-contract
 * [new branch]      task/X3-T2-forge-today-tuning -> origin/task/X3-T2-forge-today-tuning
 * [new branch]      ui/cat-tokens           -> origin/ui/cat-tokens
 * [new branch]      ui/forge-market         -> origin/ui/forge-market
 * [new branch]      ui/forge-reveal         -> origin/ui/forge-reveal
 * [new branch]      ui/pixel-icons          -> origin/ui/pixel-icons
 * [new branch]      ui/strip-cat            -> origin/ui/strip-cat
 * [new branch]      ui/strip-effects        -> origin/ui/strip-effects
 * [new branch]      ui/strip-scene          -> origin/ui/strip-scene
0356567cc1f4728cf7f1a6d520bf6ffe42c0aed4 ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com> | ntbaoheyhey <108352255+ntbaoheyhey@users.noreply.github.com>
remote:
remote: Create a pull request for 'ai/codex-v5-forge' on GitHub by visiting:
remote:      https://github.com/ntbaoheyhey/taskbar-hero/pull/new/ai/codex-v5-forge
remote:
To https://github.com/ntbaoheyhey/taskbar-hero.git
 * [new branch]      ai/codex-v5-forge -> ai/codex-v5-forge
branch 'ai/codex-v5-forge' set up to track 'origin/ai/codex-v5-forge'.
```

Exit code: 0.


The isolated install's first output chunk (before the continuation logged above):

```text
Scope: all 7 workspace projects
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +505
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
```

## Report formatting correction

The first report staging succeeded with no output. The command `git diff --cached --check` then returned exit 2:

```text
reports/v5-forge.md:3046: trailing whitespace.
+remote:
reports/v5-forge.md:3047: trailing whitespace.
+remote: Create a pull request for 'ai/codex-v5-forge' on GitHub by visiting:
reports/v5-forge.md:3048: trailing whitespace.
+remote:      https://github.com/ntbaoheyhey/taskbar-hero/pull/new/ai/codex-v5-forge
reports/v5-forge.md:3049: trailing whitespace.
+remote:
reports/v5-forge.md:3083: new blank line at EOF.
```

Trailing spaces in pasted output and the extra blank line were removed with apply_patch before retrying publication. Command text and substantive output are unchanged.

## Report publication

After writing this report, execute in /private/tmp/taskbar-hero-v5-forge:

```sh
git add reports/v5-forge.md
git diff --cached --check
git commit -m 'docs: record V5 forge verification [skip ci]'
git log origin/main..HEAD --format='%H %an <%ae> | %cn <%ce>'
git push origin ai/codex-v5-forge
git status --short --branch
git diff --exit-code HEAD -- supabase/functions
git diff --name-only origin/main..HEAD
git ls-remote origin refs/heads/ai/codex-v5-forge
```
