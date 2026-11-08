import type { ItemInstance } from '../combat';
import type { ClassId, GearRarityId, GearSlotId, MaterialId, StatId, WeaponType } from '../content';

export type StackId = 'fish' | MaterialId;

/** A drop ready for insertion; the persistence layer assigns the owned row id. */
export interface OwnedItem {
  itemKey: string;
  slot: GearSlotId;
  weaponType?: WeaponType;
  rarity: GearRarityId;
  level: number;
  bonus: { stat: StatId; value: number }[];
  locked: boolean;
  equipped: boolean;
  source: 'drop';
}

export interface ClaimInputV2 {
  classId: ClassId;
  level: number;
  xp: number;
  chapter: number;
  round: number;
  kills: number;
  bestStage: number;
  equipped: ItemInstance[];
  keysHeld: number;
  /** ISO game dates (YYYY-MM-DD), already converted to UTC+7 by the caller. */
  lastDailyKeyDay: string | null;
  today: string;
  offline: boolean;
}

export interface ClaimDeltaV2 {
  progress: { level: number; xp: number; chapter: number; round: number; kills: number; bestStage: number };
  stackDeltas: Partial<Record<StackId, number>>;
  items: OwnedItem[];
  gated: boolean;
  neededPower?: number;
  dailyKeyDay?: string | null;
}
