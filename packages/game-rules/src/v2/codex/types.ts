import type { RarityId } from '../../content';
import type { ClassDef, GearRarityId, ItemDef, MaterialDef, MaterialCost, MonsterDef } from '../content';

export type ReadonlyData<T> = T extends object ? { readonly [K in keyof T]: ReadonlyData<T[K]> } : T;
export type CompendiumKind = 'class' | 'monster' | 'boss' | 'gear' | 'material' | 'recipe' | 'relic' | 'chapter';

export interface CompendiumSource {
  /** registry/rule/metadata refs are repository paths with an optional exported symbol fragment.
   * chest refs are CHESTS keys; recipe/monster/starter refs are entry IDs. */
  kind: 'registry' | 'rule' | 'metadata' | 'chest' | 'recipe' | 'monster' | 'starter';
  ref: string;
  /** Null means context-dependent or not a probability. Never a guessed zero. */
  chancePct: number | null;
  note: string;
}
export interface CompendiumLink { kind: CompendiumKind; id: string; rel: string }
export type CompendiumUnlock =
  | { kind: 'equip-level'; level: number }
  | { kind: 'chapter'; chapterId: string }
  | { kind: 'previous-boss'; bossId: string }
  | { kind: 'recipe'; recipeId: string }
  | null;

interface Entry<K extends CompendiumKind, S> {
  kind: K;
  /** Existing registry ID; Relic tiers use relic:<pinned token id>. */
  id: string;
  name: string;
  summary: string;
  /** Renderer lookup key, not a URL. Null means there is no registry-backed icon key. */
  iconKey: string | null;
  rarity: GearRarityId | RarityId | null;
  stats: S;
  tags: string[];
  sources: CompendiumSource[];
  unlock: CompendiumUnlock;
  links: CompendiumLink[];
  missingFacts: string[];
}
export type ClassEntry = Entry<'class', {
  multipliers: ClassDef['stats']; attackIntervalMs: number; critChance: number;
  critMultiplier: number; dodge: number; passive: ClassDef['passive'];
}>;
export type MonsterEntry = Entry<'monster', Pick<MonsterDef, 'hpMul' | 'atkMul' | 'xpMul' | 'lootMul'>>;
export type BossEntry = Entry<'boss', { hp: number; atk: number; def: number; attackIntervalMs: number; stage: number }>;
export type GearEntry = Entry<'gear', {
  baseStats: ItemDef['baseStats']; statMultiplier: number; bonusLines: number; maxLevel: number;
}>;
export type MaterialEntry = Entry<'material', Pick<MaterialDef, 'tier' | 'maxStack'>>;
export type RecipeEntry = Entry<'recipe', { materials: MaterialCost; fish: number | null; perDay: number | null }>;
export type RelicEntry = Entry<'relic', { tokenId: number; rarityOddsBp: number }>;
export type ChapterEntry = Entry<'chapter', { index: number; killsPerRound: number; roundsPerChapter: number; firstStage: number; lastStage: number }>;
export type CompendiumEntry = ReadonlyData<ClassEntry | MonsterEntry | BossEntry | GearEntry | MaterialEntry | RecipeEntry | RelicEntry | ChapterEntry>;

/** Analytic probabilities as IEEE-754 numbers, without display rounding. */
export interface ExactOdds {
  probability: number;
  chancePct: number;
  /** Null at p=0 (impossible), so JSON never silently converts Infinity. */
  oneIn: number | null;
}
export interface ChestRarityOdds {
  rarity: GearRarityId;
  weight: number;
  /** Distribution within this gear roll; all five rarity rows sum to 100%. */
  conditional: ExactOdds;
  /** Includes the chest line's chance gate. Rows plus noDrop sum to 100%. */
  perChest: ExactOdds;
}
export interface ChestGearOdds {
  group: 'main' | 'accessory';
  tableId: string;
  lineIndex: number;
  totalWeight: number;
  drop: ExactOdds;
  noDrop: ExactOdds;
  rarities: ChestRarityOdds[];
}
export interface ChestOdds {
  chestId: string;
  chapterId: string;
  variant: 'firstClear' | 'repeat';
  rolls: ChestGearOdds[];
  /** Independent main/accessory rolls can both hit: these rows do NOT sum to 100%. */
  atLeastOne: { rarity: GearRarityId; odds: ExactOdds }[];
}

/** Detach before freezing: never freeze or retain mutable references into gameplay registries. */
export function readonlyCopy<T>(value: T): ReadonlyData<T> {
  const copy: T = JSON.parse(JSON.stringify(value));
  const freeze = (part: unknown): void => {
    if (part !== null && typeof part === 'object') {
      Object.values(part).forEach(freeze);
      Object.freeze(part);
    }
  };
  freeze(copy);
  return copy as ReadonlyData<T>;
}
