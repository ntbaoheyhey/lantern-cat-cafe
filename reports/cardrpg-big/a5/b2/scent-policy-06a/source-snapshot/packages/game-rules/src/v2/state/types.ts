import type { ItemInstance } from '../combat/types';
import type { ClassId, GearRarityId, GearSlotId, MaterialId, StatId, WeaponType } from '../content';

export type StackId = 'fish' | MaterialId;
export type StacksV2 = Partial<Record<StackId, number>>;

/** itemId is the catalog key used by combat; id identifies the owned instance. */
export interface OwnedItem extends ItemInstance {
  id: string;
  itemKey: string;
  slot: GearSlotId;
  weaponType?: WeaponType;
  rarity: GearRarityId;
  bonus: { stat: StatId; value: number }[];
  locked: boolean;
  equipped: boolean;
  source: 'starter' | 'drop' | 'chest' | 'craft' | 'founder';
}

export interface PlayerStateV2 {
  classId: ClassId | null;
  level: number;
  xp: number;
  chapter: number;
  round: number;
  kills: number;
  bestStage: number;
  stacks: StacksV2;
  items: OwnedItem[];
  bossClears: Record<number, { wins: number }>;
  bossCooldownUntil: number | null;
  fights: number;
  lastDailyKeyDay: string | null;
  lastRelicDay: string | null;
  progressRev: number;
}

export interface ClaimDeltaV2 {
  progress: { level: number; xp: number; chapter: number; round: number; kills: number; bestStage: number };
  stackDeltas: Partial<Record<StackId, number>>;
  items: OwnedItem[];
  gated: boolean;
  neededPower?: number;
  dailyKeyDay?: string | null;
}

export type StateRefusalCodeV2 = 'invalid_request' | 'no_class' | 'not_owner' | 'wrong_slot' |
  'slot_locked' | 'wrong_weapon' | 'stale' | 'cooldown' | 'not_reached' | 'no_key' |
  'not_enough' | 'bag_full' | 'equipped' | 'locked' | 'forge_blocked' | `not_enough:${StackId}`;
export interface StateRefusalV2 {
  ok: false;
  code: StateRefusalCodeV2;
  stack?: StackId;
  reason?: 'daily_limit' | 'not_enough_yarn' | 'no_moon_pearl';
  cooldownUntil?: number;
}
export type StateResultV2<T = object> = ({ ok: true; state: PlayerStateV2 } & T) | StateRefusalV2;

export function cloneState(state: PlayerStateV2): PlayerStateV2 {
  return {
    ...state,
    stacks: { ...state.stacks },
    items: state.items.map(cloneItem),
    bossClears: Object.fromEntries(Object.entries(state.bossClears).map(([key, value]) => [key, { ...value }])),
  };
}

export function cloneItem(item: OwnedItem): OwnedItem {
  return { ...item, bonus: item.bonus.map((line) => ({ ...line })),
    ...(item.bonusLines ? { bonusLines: item.bonusLines.map((line) => ({ ...line })) } : {}) };
}
