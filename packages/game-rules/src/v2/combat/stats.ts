import { CLASSES, GEAR_RARITIES, GEAR_SLOTS, ITEMS, WEAPON_TYPES, type ClassDef, type ItemDef, type StatId } from '../content';
import { V2_CONFIG } from '../config';
import type { CatState, CatStats, ItemInstance } from './types';

const CLASS_BY_ID = new Map<string, ClassDef>(CLASSES.map((c) => [c.id, c]));
const ITEM_BY_ID = new Map<string, ItemDef>(ITEMS.map((i) => [i.id, i]));
const RARITY_BY_ID = new Map(GEAR_RARITIES.map((r) => [r.id, r]));
const SLOT_BY_ID = new Map(GEAR_SLOTS.map((s) => [s.id, s]));

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
/** Upper bound of one hit, so absurd stats stay finite in logs and sums. */
const MAX_DAMAGE = 1e15;
/** NaN and non-finite numbers become 0, so one bad input cannot poison every stat. */
const finite = (v: number) => (Number.isFinite(v) ? v : 0);

/** Clamp a number into [0, MAX_STAT]: NaN and negatives become 0, Infinity becomes the maximum. */
export function sane(v: number): number {
  if (Number.isNaN(v) || v <= 0) return 0;
  return Math.min(MAX_STAT, v);
}
const MAX_STAT = 1e15;

export function classOf(id: string): ClassDef {
  const c = CLASS_BY_ID.get(id);
  if (!c) throw new Error(`Unknown class: ${id}`);
  return c;
}

export function weaponProfileOf(classId: string) {
  const w = WEAPON_TYPES.find((x) => x.id === classOf(classId).weaponType);
  if (!w) throw new Error(`No weapon profile for class ${classId}`);
  return w;
}

/**
 * Stats of a cat.
 *
 *   flat   = (base x 1.06^(L-1) + sum of item stats) x class multiplier   (hp, atk, def)
 *   item   = baseStat x rarity multiplier x (1 + 0.07 x (itemLevel - 1)) + bonus lines
 *   others = class base value + sum of item stats, capped (V2_CONFIG.caps)
 *
 * The class multiplier applies to the sum, so an equal gear set gives every class a comparable
 * result and the class flavour comes from the multiplier and the passive. Ignored items: unknown
 * ids, a weapon of another class's type, a second item in an already filled slot, and an
 * accessory whose slot is still locked at this cat level.
 */
export function deriveStats(
  cat: CatState,
  equipped: readonly ItemInstance[] = [],
  items: ReadonlyMap<string, ItemDef> = ITEM_BY_ID,
): CatStats {
  const cls = classOf(cat.classId);
  const cfg = V2_CONFIG;
  const level = clamp(Math.floor(finite(cat.level)), 1, cfg.cat.maxLevel);
  const growth = (1 + cfg.cat.levelGrowth) ** (level - 1);

  const sum: Partial<Record<StatId, number>> = {};
  const add = (stat: StatId, v: number) => {
    sum[stat] = (sum[stat] ?? 0) + finite(v);
  };

  const filled = new Set<string>();
  for (const inst of equipped) {
    const def = items.get(inst.itemId);
    if (!def || filled.has(def.slot)) continue;
    const slot = SLOT_BY_ID.get(def.slot);
    if (!slot || slot.unlockLevel > level) continue;
    if (def.slot === 'weapon' && def.weaponType !== cls.weaponType) continue;
    const rarity = RARITY_BY_ID.get(def.rarity);
    if (!rarity) continue;
    filled.add(def.slot);

    const itemLevel = clamp(Math.floor(finite(inst.level)), 1, rarity.maxLevel);
    const scale = rarity.statMultiplier * (1 + cfg.cat.itemLevelGrowth * (itemLevel - 1));
    for (const [stat, v] of Object.entries(def.baseStats) as [StatId, number][]) add(stat, v * scale);
    for (const line of inst.bonusLines ?? []) add(line.stat, Math.max(0, line.value));
  }

  const s = (stat: StatId) => sum[stat] ?? 0;
  const passiveFind = cls.passive.id === 'markPrey' ? cls.passive.params.materialFind : 0;
  const attackSpeed = clamp(s('attackSpeed'), 0, cfg.caps.attackSpeed);

  return {
    classId: cls.id,
    level,
    hp: (cfg.cat.baseHp * growth + s('hp')) * cls.stats.hp,
    atk: (cfg.cat.baseAtk * growth + s('atk')) * cls.stats.atk,
    def: (cfg.cat.baseDef * growth + s('def')) * cls.stats.def,
    attackIntervalMs: Math.max(cfg.caps.minAttackIntervalMs, cls.attackIntervalMs / (1 + attackSpeed)),
    critChance: clamp(cls.critChance + s('critChance'), 0, cfg.caps.critChance),
    critDamage: cls.critMultiplier + s('critDamage'),
    dodge: clamp(cls.dodge + s('dodge'), 0, cfg.caps.dodge),
    hpRegen: clamp(s('hpRegen'), 0, cfg.caps.hpRegen),
    fishBonus: s('fishBonus'),
    xpBonus: s('xpBonus'),
    materialFind: s('materialFind') + passiveFind,
    bossDamage: s('bossDamage'),
  };
}

/**
 * Damage of one hit: atk x defScale / (defScale + def), rounded, at least minDamage.
 * DEF 100 halves damage, DEF 300 cuts it to a quarter; it never reaches zero.
 */
export function damage(atk: number, def: number): number {
  const a = Math.max(0, finite(atk));
  const d = Math.max(0, finite(def));
  const raw = (a * V2_CONFIG.damage.defScale) / (V2_CONFIG.damage.defScale + d);
  return Math.min(MAX_DAMAGE, Math.max(V2_CONFIG.damage.minDamage, Math.round(raw)));
}

/**
 * Average damage multiplier of a class's passive on one attack against one target, used by the
 * analytic fight (the boss simulation plays the passives out hit by hit). Cleave is a splash on a
 * second monster, so it adds nothing against one target.
 */
export function passiveDamageMultiplier(classId: string): number {
  const p = classOf(classId).passive;
  switch (p.id) {
    case 'markPrey':
      return 1 + p.params.damageTaken;
    case 'volley':
      return 1 + ((p.params.arrows - 1) * p.params.extraArrowDamage) / p.params.every;
    case 'burn':
      return 1 + p.params.burnFraction;
    case 'poison':
      return 1 + p.params.poisonFraction;
    default:
      return 1;
  }
}

/**
 * One number for the UI: sqrt(damage per second x effective HP).
 * Effective HP grows with DEF and dodge the same way the damage formula does.
 */
export function powerRating(stats: CatStats): number {
  const cls = classOf(stats.classId);
  const hits = weaponProfileOf(stats.classId).hitAtMs.length;
  const crit = 1 + stats.critChance * Math.max(0, stats.critDamage - 1);
  const dps = (stats.atk * hits * crit * passiveDamageMultiplier(cls.id) * 1000) / stats.attackIntervalMs;
  const ehp = (stats.hp * (V2_CONFIG.damage.defScale + stats.def)) / V2_CONFIG.damage.defScale / (1 - stats.dodge);
  const power = Math.sqrt(Math.max(0, dps) * Math.max(0, ehp));
  return Number.isFinite(power) ? Math.round(power) : 0;
}
