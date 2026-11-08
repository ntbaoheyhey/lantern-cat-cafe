import type { ClassId, StatId } from '../content';

/** A gear item a cat owns: which catalog item, its level and its rolled bonus lines. */
export interface ItemInstance {
  itemId: string;
  level: number;
  bonusLines?: readonly { stat: StatId; value: number }[];
}

export interface CatState {
  classId: ClassId;
  level: number;
}

/** Final stats of a cat. Fractions are 0.05 = 5%. */
export interface CatStats {
  classId: ClassId;
  level: number;
  hp: number;
  /** Damage of one hit, before DEF and crits. */
  atk: number;
  def: number;
  /** Time between attack starts, after attack speed. */
  attackIntervalMs: number;
  critChance: number;
  /** Damage multiplier of a crit (e.g. 1.5). */
  critDamage: number;
  dodge: number;
  /** Share of max HP healed per second. */
  hpRegen: number;
  fishBonus: number;
  xpBonus: number;
  materialFind: number;
  bossDamage: number;
}

/** A monster or boss at a given stage, ready to fight. */
export interface MonsterStats {
  id: string;
  hp: number;
  atk: number;
  def: number;
  attackIntervalMs: number;
  xp: number;
  fish: number;
}

export interface BossDef {
  id: string;
  hp: number;
  atk: number;
  def: number;
  attackIntervalMs: number;
}

/** Timeline of a boss fight, times in ms from the start. */
export type BossEventV2 =
  | { t: number; type: 'attack_start'; attack: number }
  | {
      t: number;
      type: 'impact';
      /** 'hit' = normal hit, 'arrow' = extra volley arrow. */
      source: 'hit' | 'arrow';
      damage: number;
      crit: boolean;
      bossHp: number;
    }
  | { t: number; type: 'boss_windup'; big: boolean }
  | { t: number; type: 'boss_impact'; big: boolean; damage: number; dodged: boolean; catHp: number }
  | { t: number; type: 'dot'; source: 'burn' | 'poison'; damage: number; bossHp: number }
  | { t: number; type: 'end'; won: boolean };

export interface BossResultV2 {
  won: boolean;
  log: BossEventV2[];
  bossMaxHp: number;
  catMaxHp: number;
  /** Time of the end event. */
  durationMs: number;
}

export interface MonsterFight {
  /** Time until the monster dies. */
  timeToKillMs: number;
  /** Expected damage the cat takes meanwhile (after regen). */
  damageTaken: number;
  /** The cat survives the fight with HP left. */
  canWin: boolean;
}
