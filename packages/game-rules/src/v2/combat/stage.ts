import { CHAPTERS, MONSTERS, type MonsterDef } from '../content';
import { V2_CONFIG } from '../config';
import type { BossDef, MonsterStats } from './types';

const MONSTER_BY_ID = new Map(MONSTERS.map((m) => [m.id, m]));

/** Stage number 1..50 for a chapter (1-based) and a round (1-based). */
export function stageOf(chapter: number, round: number): number {
  const ch = CHAPTERS.find((c) => c.index === chapter);
  if (!ch) throw new Error(`Unknown chapter: ${chapter}`);
  return (chapter - 1) * ch.roundsPerChapter + Math.min(Math.max(1, round), ch.roundsPerChapter);
}

/** Stats of a monster kind at a stage: stage formula x the monster's archetype multipliers. */
export function monsterAt(monster: MonsterDef | string, stage: number): MonsterStats {
  const def = typeof monster === 'string' ? MONSTER_BY_ID.get(monster) : monster;
  if (!def) throw new Error(`Unknown monster: ${String(monster)}`);
  const m = V2_CONFIG.monster;
  const k = Math.max(1, stage) - 1;
  return {
    id: def.id,
    hp: Math.round(m.hpBase * m.hpGrowth ** k * def.hpMul),
    atk: m.atkBase * m.atkGrowth ** k * def.atkMul,
    def: m.defBase + m.defStep * k,
    attackIntervalMs: m.attackIntervalMs,
    xp: m.xpBase * m.xpGrowth ** k * def.xpMul,
    fish: m.fishBase * m.fishGrowth ** k * def.lootMul,
  };
}

/** The boss of a chapter, fought at the chapter's last stage. */
export function bossOfChapter(chapter: number): BossDef {
  const ch = CHAPTERS.find((c) => c.index === chapter);
  if (!ch) throw new Error(`Unknown chapter: ${chapter}`);
  const s = monsterAt(ch.boss, stageOf(chapter, ch.roundsPerChapter));
  return { id: ch.boss, hp: s.hp, atk: s.atk, def: s.def, attackIntervalMs: V2_CONFIG.boss.attackIntervalMs };
}
