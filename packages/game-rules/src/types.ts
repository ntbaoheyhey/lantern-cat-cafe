import type { CONFIG } from './config';

export type Slot = (typeof CONFIG.slots)[number];
export type Rarity = (typeof CONFIG.rarities)[number];

export interface Gear {
  slot: Slot;
  rarity: Rarity;
  /** Item level, 1..gear.maxLevel. */
  level: number;
}

export interface PlayerState {
  /** Equipped gear (at most one per slot used by heroPower). */
  gear: Gear[];
  gold: number;
  shards: number;
  bossKeys: number;
  /** Boss the player is currently facing (also drop item level). */
  bossLevel: number;
  /** UTC day index of the last Boss Key earned, or -1. */
  lastBossKeyDay: number;
  /** UTC day index of the last Relic forged, or -1. */
  lastForgeDay: number;
}

export interface IdleGains {
  gold: number;
  shards: number;
  drops: Gear[];
  /** Seconds actually counted after the offline cap. */
  countedSeconds: number;
}

export type BossEvent =
  | { t: number; type: 'hero_hit'; damage: number; crit: boolean; bossHp: number }
  | { t: number; type: 'boss_hit'; damage: number; heroHp: number }
  | { t: number; type: 'end'; won: boolean };

export interface BossResult {
  won: boolean;
  log: BossEvent[];
  bossMaxHp: number;
  heroMaxHp: number;
}

export type ForgeBlock = 'no_boss_key' | 'not_enough_shards' | 'daily_limit';
