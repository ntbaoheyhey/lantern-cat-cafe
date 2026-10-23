import type { BossEvent, BossResult } from '@taskbar-hero/game-rules';

/** Whole replay length; the log is spread evenly over it. */
export const REPLAY_MS = 4500;

export interface ReplayFrame {
  heroHp: number;
  bossHp: number;
  /** The event just shown, or null before the first one. */
  last: BossEvent | null;
  done: boolean;
}

/** Health after the first `shown` log events. Replays the server log only; never re-simulates. */
export function frameAt(result: BossResult, shown: number): ReplayFrame {
  let heroHp = result.heroMaxHp;
  let bossHp = result.bossMaxHp;
  let last: BossEvent | null = null;
  const n = Math.min(Math.max(0, shown), result.log.length);
  for (let i = 0; i < n; i++) {
    const e = result.log[i]!;
    if (e.type === 'hero_hit') bossHp = e.bossHp;
    else if (e.type === 'boss_hit') heroHp = e.heroHp;
    last = e;
  }
  return { heroHp, bossHp, last, done: n >= result.log.length };
}

/** Milliseconds between log events so the replay lasts about REPLAY_MS. */
export function stepMs(result: BossResult, total: number = REPLAY_MS): number {
  return total / Math.max(1, result.log.length);
}
