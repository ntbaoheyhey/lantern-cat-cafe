import { CONFIG } from './config';
import { CHAPTERS } from './v2/content/chapters';
import { BONUS_LINE_RANGES, type StatId } from './v2/content/stats';
import type { GearRarityId } from './v2/content/rarities';

/** Derived progress only: a power wall is never a boss unlock. */
export function chapterJourney(chapter: number, round: number, kills: number) {
  const def = CHAPTERS.find(c => c.index === chapter);
  if (!def) return { done: 0, total: 0, remaining: 0, bossReached: false };
  const total = def.roundsPerChapter * def.killsPerRound;
  const done = Math.max(0, Math.min(total, (Math.min(def.roundsPerChapter, Math.max(1, round)) - 1) * def.killsPerRound + Math.min(def.killsPerRound, Math.max(0, kills))));
  return { done, total, remaining: total - done, bossReached: done === total };
}

/** Normalized quality of the actual bonus values; NOT an extra rarity/success roll. */
export function bonusRollQuality(rarity: GearRarityId, lines: readonly { stat: StatId; value: number }[]) {
  const scores = lines.flatMap(line => {
    const range = BONUS_LINE_RANGES[line.stat]?.[rarity];
    if (!range || !Number.isFinite(line.value) || range[1] <= range[0]) return [];
    return [Math.max(0, Math.min(1, (line.value - range[0]) / (range[1] - range[0])))];
  });
  const quality = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  return { quality, great: quality !== null && quality >= CONFIG.gameplay.greatRollThreshold };
}

export type ReplayOutcome = 'perfect' | 'close-call' | 'victory' | 'retry';
/** Badges summarize accepted replay HP. They never change rewards or the replay. */
export function replayOutcome(won: boolean, maxHp: number, timeline: readonly { catHp?: number }[]): ReplayOutcome {
  if (!won) return 'retry';
  const health = timeline.flatMap(e => e.catHp !== undefined && Number.isFinite(e.catHp) ? [Math.max(0, e.catHp)] : []);
  if (maxHp <= 0 || !Number.isFinite(maxHp) || !health.length) return 'victory';
  if (health.every(hp => hp >= maxHp)) return 'perfect';
  return health[health.length - 1]! / maxHp <= CONFIG.gameplay.closeCallHpFraction ? 'close-call' : 'victory';
}
