import type { Actor, CatRole, CombatClass } from './contract';

export const COMBAT_CLASSES: readonly CombatClass[] = ['melee', 'ranged', 'healer'];
export const COMBAT_CLASS_LABELS: Record<CombatClass, string> = { melee: 'Melee', ranged: 'Ranged', healer: 'Healer' };
export const COMBAT_CLASS_DESCRIPTIONS: Record<CombatClass, string> = {
  melee: 'Approaches enemies to strike.',
  ranged: 'Attacks from a distance.',
  healer: 'Restores health, removes harmful effects and protects allies. Never deals damage.',
};
export const ROLE_COMBAT_CLASS: Record<CatRole, CombatClass> = {
  guardian: 'melee', striker: 'melee', witch: 'ranged', hexer: 'ranged', controller: 'ranged', healer: 'healer',
};
/** Wounded front allies first, then lowest HP fraction; stable ties, no defeated patients.
 * LEARN/S2b.md: independent 100-seed holdout; selection does not change action clocks.
 */
export function healerPatient(actors: Actor[]): Actor | undefined {
  const living = actors.filter(a => a.hp > 0);
  const wounded = living.filter(a => a.hp < a.maxHp);
  return [...(wounded.length ? wounded : living)].sort((a, b) =>
    Number(b.row === 'front') - Number(a.row === 'front') || a.hp / a.maxHp - b.hp / b.maxHp || a.id.localeCompare(b.id)
  )[0];
}
