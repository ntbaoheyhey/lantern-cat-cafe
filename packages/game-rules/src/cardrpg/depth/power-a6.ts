import type { Stats } from '../contract';

/** The same full-health scale for roster stats and battle actors; not a win probability. */
export function powerScoreA6(stats: Pick<Stats, 'hp' | 'attack' | 'defense'> & Partial<Stats> & {
  maxHp?: number; bonuses?: Record<string, number>; effectHit?: number; effectResist?: number;
}): number {
  const core = (stats.maxHp ?? stats.hp) / 5 + stats.attack * 2 + stats.defense * 1.5;
  const crit = stats.critBp ?? stats.bonuses?.critBp ?? 0;
  const secondary = crit * .004 + (stats.critDamageBp ?? stats.bonuses?.critDamageBp ?? 0) * crit / 10000 * .001
    + ((stats.effectHitBp ?? stats.effectHit ?? 0) + (stats.effectResistBp ?? stats.effectResist ?? 0)) * .003
    + ((stats.healingBp ?? stats.bonuses?.healingBp ?? 0) + (stats.shieldBp ?? stats.bonuses?.shieldBp ?? 0)) * .002;
  return Math.round((core + secondary) * 10);
}
