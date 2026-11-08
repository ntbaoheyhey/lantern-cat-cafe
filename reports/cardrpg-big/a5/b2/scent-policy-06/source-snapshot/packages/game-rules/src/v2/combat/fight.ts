import { V2_CONFIG } from '../config';
import { classOf, damage, passiveDamageMultiplier, sane, weaponProfileOf } from './stats';
import type { CatStats, MonsterFight, MonsterStats } from './types';

/**
 * Analytic fight against one monster, no per-hit loop (idle claims call this per round).
 *
 * Damage per attack = hits x damage(atk, monster DEF) x average crit x passive multiplier.
 * Attacks needed = ceil(hp / that); the kill lands on the last hit of the last attack. The monster
 * hits every attackIntervalMs; a dodged hit does nothing, regen heals meanwhile. The Guardian's
 * bonk pushes each monster attack back by delayMs per cat attack that lands in between (an
 * approximation of the exact boss simulation).
 */
export function monsterFight(rawStats: CatStats, rawMonster: MonsterStats): MonsterFight {
  const stats: CatStats = {
    ...rawStats,
    hp: sane(rawStats.hp),
    atk: sane(rawStats.atk),
    def: sane(rawStats.def),
    hpRegen: sane(rawStats.hpRegen),
    critChance: Math.min(1, sane(rawStats.critChance)),
    critDamage: sane(rawStats.critDamage),
    dodge: Math.min(1, sane(rawStats.dodge)),
    attackIntervalMs: Math.max(V2_CONFIG.caps.minAttackIntervalMs, sane(rawStats.attackIntervalMs)),
  };
  const monster: MonsterStats = {
    ...rawMonster,
    hp: sane(rawMonster.hp),
    atk: sane(rawMonster.atk),
    def: sane(rawMonster.def),
    attackIntervalMs: Math.max(V2_CONFIG.caps.minAttackIntervalMs, sane(rawMonster.attackIntervalMs)),
  };
  const cls = classOf(stats.classId);
  const weapon = weaponProfileOf(stats.classId);
  const hits = weapon.hitAtMs.length;
  const crit = 1 + stats.critChance * Math.max(0, stats.critDamage - 1);
  const perHit = damage(stats.atk, monster.def);
  const base = hits * perHit * crit;
  // A one-attack kill gets no passive bonus (the mark needs a first hit, DoT needs time).
  const perAttack = base >= monster.hp ? base : base * passiveDamageMultiplier(cls.id);
  const attacks = Math.max(1, Math.ceil(monster.hp / Math.max(1e-9, perAttack)));

  const lastHit = weapon.hitAtMs[hits - 1] ?? 0;
  const travel = weapon.projectile?.travelMs ?? 0;
  const timeToKillMs = (attacks - 1) * stats.attackIntervalMs + lastHit + travel;

  let monsterInterval = monster.attackIntervalMs;
  if (cls.passive.id === 'bonk') {
    const catAttacksPerMonsterAttack = monsterInterval / stats.attackIntervalMs;
    monsterInterval += cls.passive.params.delayMs * catAttacksPerMonsterAttack;
  }
  const monsterAttacks = Math.floor(timeToKillMs / monsterInterval);
  const perMonsterHit = damage(monster.atk, stats.def) * (1 - stats.dodge);
  const regen = stats.hpRegen * stats.hp * (timeToKillMs / 1000);
  const damageTaken = Math.max(0, monsterAttacks * perMonsterHit - regen);

  return { timeToKillMs, damageTaken, canWin: damageTaken < stats.hp };
}
