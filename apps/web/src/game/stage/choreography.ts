import { v2 } from '@taskbar-hero/game-rules';
import type { ServerStateV2 } from '../../api/GameApiV2';
import { claimedKills } from './progress';

export const APPROACH_MS = 600;
export const DEFEAT_MS = 600;
export const MONTAGE_CAP = 8;
export const HIDDEN_RESULT_MS = 30_000;

export function stageStats(state: ServerStateV2) {
  return v2.deriveStats({ classId: state.cat.classId!, level: state.cat.level }, state.inventory.filter(i => i.equipped)
    .map(i => ({ itemId: i.itemKey, level: i.level, bonusLines: i.bonus })));
}

/** The claim gates the whole profile, not just the next regular. */
export function frontierMonster(state: ServerStateV2, stats = stageStats(state)): string {
  const p = state.progress, chapter = v2.CHAPTERS.find(c => c.index === p.chapter)!;
  if (p.gated) {
    const stage = v2.stageOf(p.chapter, p.round);
    const blocker = [...chapter.regulars, chapter.elite].find(id => !v2.monsterFight(stats, v2.monsterAt(id, stage)).canWin);
    if (blocker) return blocker;
  }
  return p.kills >= p.killsPerRound - 1 ? chapter.elite : chapter.regulars[p.kills % chapter.regulars.length]!;
}

/** Only acknowledged frontier kills enter the montage; keep the latest eight, including the elite. */
export function claimMontage(before: ServerStateV2 | null, after: ServerStateV2): { id: string; round: number }[] {
  const count = claimedKills(before, after);
  if (!before || count === 0) return [];
  const chapter = v2.CHAPTERS.find(c => c.index === before.progress.chapter)!;
  const result: { id: string; round: number }[] = [];
  const start = (before.progress.round - 1) * chapter.killsPerRound + before.progress.kills;
  for (let i = Math.max(0, count - MONTAGE_CAP); i < count; i++) {
    const at = start + i, kill = at % chapter.killsPerRound;
    result.push({ id: kill === chapter.killsPerRound - 1 ? chapter.elite : chapter.regulars[kill % chapter.regulars.length]!, round: Math.floor(at / chapter.killsPerRound) + 1 });
  }
  return result;
}

/** Bounds are offsets from each sprite origin, already scaled into logical pixels. */
export function contactX(catX: number, catRight: number, monsterLeft: number, gap = 2) {
  return catX + catRight - monsterLeft + gap;
}

/** hitAtMs is absolute from attack start; do not add windup a second time. */
export function impactTime(weapon: v2.WeaponProfile, hitIndex = 0) {
  const strikeMs = weapon.hitAtMs[hitIndex]! - weapon.windupMs;
  return weapon.windupMs + strikeMs + (weapon.projectile?.travelMs ?? 0);
}

/** Expected net loss includes regeneration; each new monster starts at full HP in idle rules. */
export function expectedCatHp(max: number, damageTaken: number, elapsed: number, fightMs: number) {
  return Math.max(0, max - damageTaken * Math.min(1, Math.max(0, elapsed / Math.max(1, fightMs))));
}

export function bossReady(state: ServerStateV2) {
  const chapter = v2.CHAPTERS.find(c => c.index === state.progress.chapter)!;
  return state.progress.round === chapter.roundsPerChapter && state.progress.kills === state.progress.killsPerRound;
}
