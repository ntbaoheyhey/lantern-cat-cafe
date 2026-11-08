import type { MaterialId } from './materials';
import { GEAR_RARITY_IDS, type GearRarityId } from './rarities';

/**
 * Treasure chests as loot tables (DATA ONLY). The engine that rolls them is V4 (src/loot.ts);
 * these types are the same shape as its LootTable<T>, so a registry here can be passed to it.
 *
 * A line rolls `chance`; on a hit it rolls a count in [min, max] and picks one weighted entry per
 * unit. An entry is a reward or `{ table }`, which rolls that table once (nested).
 */
export interface WeightedEntry<T> {
  weight: number;
  value: T | { table: string };
}
export interface LootLine<T> {
  /** 0..1 */
  chance: number;
  count: [min: number, max: number];
  pick: WeightedEntry<T>[];
}
export interface LootTable<T> {
  id: string;
  lines: LootLine<T>[];
}
export type LootRegistry<T> = Record<string, LootTable<T>>;

/**
 * One unit of a chest reward. Fish come in units of FISH_UNIT so a 300-500 Fish line is 30-50
 * units, not 500. A gear reward names the group and rarity only: the server picks the slot and the
 * item (smart loot: SMART_LOOT.classWeaponShare of weapon drops are the player's class weapon).
 */
export type ChestReward =
  | { kind: 'fish'; amount: number }
  | { kind: 'material'; id: MaterialId; amount: number }
  | { kind: 'gear'; group: 'main' | 'accessory'; rarity: GearRarityId };

export const FISH_UNIT = 10;

/** Smart loot: share of weapon drops that are the player's own class weapon type. */
export const SMART_LOOT = { classWeaponShare: 0.6 } as const;

/**
 * Chapter scaling (invented in V1, tuned in V6): amounts multiply by AMOUNT_GROWTH per chapter
 * after the first, and rarity weights shift toward Epic and Legendary by the per-chapter steps
 * below. Chapter 2+ chests add Catnip Crystals, chapter 3+ Starlight Scales (plan section 5).
 */
export const CHEST_SCALING = {
  amountGrowth: 2,
  firstClearWeights: { base: [0, 60, 30, 9, 1], perChapter: [0, -10, 0, 6, 2], floor: [0, 10, 0, 0, 0] },
  repeatWeights: { base: [40, 35, 18, 6, 1], perChapter: [-8, 0, 3, 4, 1], floor: [8, 0, 0, 0, 0] },
} as const;

const fish = (amount: number): ChestReward => ({ kind: 'fish', amount });
const mat = (id: MaterialId): ChestReward => ({ kind: 'material', id, amount: 1 });

function scaled([min, max]: readonly [number, number], factor: number): [number, number] {
  return [Math.round(min * factor), Math.round(max * factor)];
}

function weightsFor(w: (typeof CHEST_SCALING)['firstClearWeights' | 'repeatWeights'], chapter: number): number[] {
  return w.base.map((b, i) => Math.max(w.floor[i] ?? 0, b + (w.perChapter[i] ?? 0) * (chapter - 1)));
}

function gearTable(id: string, group: 'main' | 'accessory', weights: readonly number[]): LootTable<ChestReward> {
  return {
    id,
    lines: [
      {
        chance: 1,
        count: [1, 1],
        pick: GEAR_RARITY_IDS.map((rarity, i) => ({ weight: weights[i] ?? 0, value: { kind: 'gear' as const, group, rarity } })).filter(
          (e) => e.weight > 0,
        ),
      },
    ],
  };
}

const one = (value: ChestReward | { table: string }): WeightedEntry<ChestReward>[] => [{ weight: 1, value }];

/** First-clear and repeat chest (plus their nested gear tables) for one chapter. */
export function chapterChests(chapter: number): LootTable<ChestReward>[] {
  const f = CHEST_SCALING.amountGrowth ** (chapter - 1);
  const p = `ch${chapter}`;
  const first = weightsFor(CHEST_SCALING.firstClearWeights, chapter);
  const repeat = weightsFor(CHEST_SCALING.repeatWeights, chapter);
  const tables: LootTable<ChestReward>[] = [
    {
      id: `chest.${p}.first`,
      lines: [
        { chance: 1, count: scaled([30, 50], f), pick: one(fish(FISH_UNIT)) },
        { chance: 1, count: scaled([15, 25], f), pick: one(mat('yarn')) },
        { chance: 1, count: scaled([5, 8], f), pick: one(mat('fluffTuft')) },
        { chance: 0.4, count: scaled([1, 2], f), pick: one(mat('shinyButton')) },
        { chance: 1, count: [1, 1], pick: one({ table: `gear.${p}.first.main` }) },
        { chance: 0.5, count: [1, 1], pick: one({ table: `gear.${p}.first.accessory` }) },
        { chance: 1, count: [1, 1], pick: one(mat('moonPearl')) },
      ],
    },
    {
      id: `chest.${p}.repeat`,
      lines: [
        { chance: 1, count: scaled([12, 20], f), pick: one(fish(FISH_UNIT)) },
        { chance: 1, count: scaled([6, 10], f), pick: one(mat('yarn')) },
        { chance: 1, count: scaled([2, 4], f), pick: one(mat('fluffTuft')) },
        { chance: 0.2, count: scaled([1, 1], f), pick: one(mat('shinyButton')) },
        { chance: 0.7, count: [1, 1], pick: one({ table: `gear.${p}.repeat.main` }) },
        { chance: 0.25, count: [1, 1], pick: one({ table: `gear.${p}.repeat.accessory` }) },
        { chance: 0.3, count: [1, 1], pick: one(mat('moonPearl')) },
      ],
    },
    gearTable(`gear.${p}.first.main`, 'main', first),
    gearTable(`gear.${p}.first.accessory`, 'accessory', first),
    gearTable(`gear.${p}.repeat.main`, 'main', repeat),
    gearTable(`gear.${p}.repeat.accessory`, 'accessory', repeat),
  ];
  const [firstChest, repeatChest] = tables;
  if (chapter >= 2) {
    firstChest?.lines.push({ chance: 0.5, count: [1, 2], pick: one(mat('catnipCrystal')) });
    repeatChest?.lines.push({ chance: 0.25, count: [1, 1], pick: one(mat('catnipCrystal')) });
  }
  if (chapter >= 3) {
    firstChest?.lines.push({ chance: 0.4, count: [1, 1], pick: one(mat('starlightScale')) });
    repeatChest?.lines.push({ chance: 0.15, count: [1, 1], pick: one(mat('starlightScale')) });
  }
  return tables;
}

export const CHESTS: LootRegistry<ChestReward> = Object.fromEntries(
  [1, 2, 3, 4, 5].flatMap(chapterChests).map((t) => [t.id, t]),
);
