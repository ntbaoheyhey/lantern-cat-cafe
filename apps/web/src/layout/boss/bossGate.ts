import { v2 } from '@taskbar-hero/game-rules';
import type { ServerStateV2 } from '../../api/GameApiV2';
import { getBossName } from '../../map/ChapterMap';

export type BossGateStatusV2 =
  | { kind: 'no_class' }
  | { kind: 'cooldown'; secondsLeft: number; until: number }
  | { kind: 'not_reached'; chapter: number; roundsLeft: number; killsLeft: number }
  | { kind: 'no_key' }
  | { kind: 'ready'; rematch: boolean }
  | { kind: 'gated'; chapter: number; neededPower: number; roundsLeft: number; killsLeft: number };

/**
 * Calculates the boss gate status for a given chapter and current server time.
 * Mirrors the server's refusal check order exactly:
 * 1. no_class (cat.classId null)
 * 2. cooldown (bosses.cooldownUntil !== null && cooldownUntil > nowS)
 * 3. not_reached / gated (not cleared before and not at the boss of the current chapter; gated when state.progress.gated)
 * 4. no_key (currencies.keys < 1)
 * 5. ready
 */
export function bossGateStatus(
  state: ServerStateV2,
  chapter: number,
  nowS: number,
): BossGateStatusV2 {
  // 1. no_class check
  if (state.cat.classId === null) {
    return { kind: 'no_class' };
  }

  // 2. cooldown check
  if (state.bosses.cooldownUntil !== null && state.bosses.cooldownUntil > nowS) {
    const secondsLeft = Math.ceil(state.bosses.cooldownUntil - nowS);
    return { kind: 'cooldown', secondsLeft, until: state.bosses.cooldownUntil };
  }

  // 3. not_reached check
  const chapterClear = Array.isArray(state.bosses?.chapters)
    ? state.bosses.chapters.find((c) => c?.chapter === chapter)
    : undefined;
  const isCleared = Boolean(chapterClear?.cleared);

  if (!isCleared) {
    if (state.progress.chapter === chapter) {
      const chDef = v2.CHAPTERS.find((c) => c.index === chapter);
      const roundsPerChapter = chDef?.roundsPerChapter ?? 10;
      const killsPerRound = chDef?.killsPerRound ?? 10;

      const reached =
        state.progress.round === roundsPerChapter &&
        state.progress.kills >= killsPerRound;

      if (!reached) {
        const roundsLeft = roundsPerChapter - state.progress.round;
        const killsLeft = killsPerRound - state.progress.kills;
        if (state.progress.gated) {
          return {
            kind: 'gated',
            chapter,
            neededPower: state.progress.neededPower ?? 0,
            roundsLeft,
            killsLeft,
          };
        }
        return {
          kind: 'not_reached',
          chapter,
          roundsLeft,
          killsLeft,
        };
      }
    } else {
      return {
        kind: 'not_reached',
        chapter,
        roundsLeft: -1,
        killsLeft: -1,
      };
    }
  }

  // 4. no_key check
  if ((state.currencies?.keys ?? 0) < 1) {
    return { kind: 'no_key' };
  }

  // 5. ready
  return { kind: 'ready', rematch: isCleared };
}

/**
 * Returns cleared chapters plus the current chapter, ascending, no duplicates,
 * each within 1..CHAPTERS.length.
 */
export function fightableChapters(state: ServerStateV2): number[] {
  const maxChapter = v2.CHAPTERS.length;
  const chapters = new Set<number>();

  for (const c of state.bosses?.chapters ?? []) {
    if (c?.cleared && c.chapter >= 1 && c.chapter <= maxChapter) {
      chapters.add(c.chapter);
    }
  }

  if (state.progress?.chapter >= 1 && state.progress.chapter <= maxChapter) {
    chapters.add(state.progress.chapter);
  }

  return Array.from(chapters).sort((a, b) => a - b);
}

/**
 * Formats a duration in seconds as m:ss.
 * Examples: 59 -> '0:59', 61 -> '1:01', 3600 -> '60:00'.
 */
export function formatCountdown(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Looks up boss id, boss display name and chapter name from v2 content definitions.
 */
export function bossLabel(chapter: number): { id: string; name: string; chapterName: string } {
  const chDef = v2.CHAPTERS.find((c) => c.index === chapter);
  const chapterName = chDef?.name ?? `Chapter ${chapter}`;
  const bossId = chDef?.boss ?? '';
  const name = chDef ? getBossName(chDef) : 'Unknown Boss';
  return { id: bossId, name, chapterName };
}
