/**
 * Monsters per chapter. HP, ATK and XP come from the stage formulas (V2 config, e.g. HP
 * 30 x 1.13^(s-1)); a monster only carries archetype multipliers on top of them.
 */
export type MonsterKind = 'regular' | 'elite' | 'boss';

export interface MonsterDef {
  id: string;
  name: string;
  chapter: number;
  kind: MonsterKind;
  hpMul: number;
  atkMul: number;
  xpMul: number;
  /** Fish, Yarn and material drop multiplier. */
  lootMul: number;
}

/** Archetypes: a balanced, a glass-cannon and a sturdy regular, then elite and boss. */
export const ARCHETYPE = {
  balanced: { hpMul: 1, atkMul: 1, xpMul: 1, lootMul: 1 },
  swift: { hpMul: 0.8, atkMul: 1.2, xpMul: 1, lootMul: 1 },
  sturdy: { hpMul: 1.2, atkMul: 0.8, xpMul: 1, lootMul: 1 },
  elite: { hpMul: 3, atkMul: 1.5, xpMul: 3, lootMul: 3 },
  boss: { hpMul: 40, atkMul: 2.5, xpMul: 25, lootMul: 0 },
} as const;

/** [chapter, regulars (balanced, swift, sturdy), elite, boss]; names from plan section 4. */
const ROSTER: readonly (readonly [number, readonly [string, string, string], string, string])[] = [
  [1, ['Dust Bunny', 'Loose Yarn', 'Sock Puppet'], 'Roomba Scout', 'Yarn Giant'],
  [2, ['Pickle Imp', 'Toast Mimic', 'Spoon Bug'], 'Blender Brute', 'Cucumber Scare'],
  [3, ['Soap Slime', 'Rubber Duck', 'Sponge Crab'], 'Hair Dryer Wisp', 'Bathtub Tyrant'],
  [4, ['Mouse Trap', 'Dust Moth', 'Wind-up Robot'], 'Box Fort Knight', 'Vacuum Beast'],
  [5, ['Shadow Crow', 'Moth Swarm', 'Neon Dot'], 'Chimney Ghost', 'Laser Dot Phantom'],
];

/** Stable id from the name: 'Wind-up Robot' -> 'mon.windup.robot'. */
export function monsterId(name: string): string {
  return `mon.${name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/).join('.')}`;
}

export const MONSTERS: readonly MonsterDef[] = ROSTER.flatMap(([chapter, regulars, elite, boss]) => [
  { id: monsterId(regulars[0]), name: regulars[0], chapter, kind: 'regular' as const, ...ARCHETYPE.balanced },
  { id: monsterId(regulars[1]), name: regulars[1], chapter, kind: 'regular' as const, ...ARCHETYPE.swift },
  { id: monsterId(regulars[2]), name: regulars[2], chapter, kind: 'regular' as const, ...ARCHETYPE.sturdy },
  { id: monsterId(elite), name: elite, chapter, kind: 'elite' as const, ...ARCHETYPE.elite },
  { id: monsterId(boss), name: boss, chapter, kind: 'boss' as const, ...ARCHETYPE.boss },
]);
