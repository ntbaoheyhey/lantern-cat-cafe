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
