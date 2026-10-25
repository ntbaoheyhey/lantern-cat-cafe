import type { ClassId, GearSlotId, WeaponType, GearRarityId, StatId, MaterialId } from '../content';
export type OtherMaterialIdV2 = Exclude<MaterialId, 'yarn' | 'catKey'>;
export interface ItemViewV2 { id: string; itemKey: string; slot: GearSlotId; weaponType?: WeaponType; rarity: GearRarityId; level: number; bonus: { stat: StatId; value: number }[]; locked: boolean; equipped: boolean }
export interface AutoSalvagedViewV2 { itemKey: string; slot: GearSlotId; weaponType?: WeaponType; rarity: GearRarityId; level: number }
export interface LootViewV2 { fish: number; yarn: number; materials: Partial<Record<OtherMaterialIdV2, number>>; keys: number; items: ItemViewV2[]; autoSalvaged: AutoSalvagedViewV2[] }
export interface GainsViewV2 extends LootViewV2 { xp: number; levelsGained: number }
export interface GateV2 { gated: boolean; neededPower: number }
export interface TimelineEventViewV2 {
  t: number; type: 'attack_start' | 'impact' | 'boss_windup' | 'boss_impact' | 'dot' | 'end';
  damage?: number; crit?: boolean; catHp?: number; bossHp?: number;
  /** boss_windup and boss_impact: the telegraphed big attack. */
  big?: boolean;
  /** boss_impact: the cat dodged, taking zero damage. */
  dodged?: boolean;
}
export interface StateViewV2<F> {
  cat: { classId: ClassId | null; level: number; xp: number; xpToNext: number };
  progress: { chapter: number; round: number; kills: number; killsPerRound: number; gated: boolean; neededPower: number };
  currencies: { fish: number; yarn: number; keys: number };
  materials: Partial<Record<OtherMaterialIdV2, number>>;
  inventory: ItemViewV2[];
  bagLimit: number;
  equipped: Record<GearSlotId, string | null>;
  unlockedSlots: GearSlotId[];
  bosses: { chapters: { chapter: number; cleared: boolean; wins: number }[]; cooldownUntil: number | null };
  forge: F;
  founder: boolean;
  serverTime: number;
}
export interface StateViewContextV2<F> { nowS: number; forge: F; founder: boolean; gate: GateV2 }
