import { deriveSeed } from '../../rng';
import { deriveBagStats, salvageCandidates } from '../bag';
import { powerRating, simulateBossV2, bossOfChapter } from '../combat';
import { CHAPTERS, type ClassId } from '../content';
import { V2_CONFIG } from '../config';
import { computeClaimV2 } from '../idle';
import { applyClaim, applyBossResult, applySalvage } from '../state';
import type { PlayerStateV2 } from '../state/types';
import { withConfigV2, type ConfigOverridesV2 } from './config';
import { accepted, newPlayerV2, equipBestV2, craftBestV2, rollSimChestV2 } from './player';
export interface SimOptionsV2 { classId: ClassId; seed: number; overrides?: ConfigOverridesV2; maxActiveMinutes?: number; stepMinutes?: number }
export interface SimResultV2 {
  classId: ClassId; seed: number;
  minutesToFirstBossWin: number | null;
  minutesToChapterBossWin: Record<number, number | null>;
  minutesPerChapter: Record<number, number | null>;
  minutesToLevel: { 20: number | null; 40: number | null };
  keysUsed: number; bossFights: number; bossLosses: number; crafted: number; salvaged: number;
  stuck: { at: number; chapter: number; round: number } | null;
  finalLevel: number; finalPower: number;
}
export function simulateV2(opts: SimOptionsV2): SimResultV2 { return simulateWithStateForTest(opts).result; }
export function simulateWithStateForTest(opts: SimOptionsV2): { result: SimResultV2; finalState: PlayerStateV2 } {
  return withConfigV2(opts.overrides ?? {}, () => run(opts));
}
function run(opts: SimOptionsV2): { result: SimResultV2; finalState: PlayerStateV2 } {
  const max = opts.maxActiveMinutes ?? 5 * 6 * 60;
  const step = opts.stepMinutes ?? 10;
  if (!Number.isFinite(max) || max < 0 || !Number.isFinite(step) || step <= 0 || !Number.isSafeInteger(opts.seed)) throw new Error('invalid simulation options');
  let state = newPlayerV2(opts.classId);
  const result: SimResultV2 = { classId: opts.classId, seed: opts.seed, minutesToFirstBossWin: null,
    minutesToChapterBossWin: Object.fromEntries(CHAPTERS.map((ch) => [ch.index, null])),
    minutesPerChapter: Object.fromEntries(CHAPTERS.map((ch) => [ch.index, null])), minutesToLevel: { 20: null, 40: null },
    keysUsed: 0, bossFights: 0, bossLosses: 0, crafted: 0, salvaged: 0, stuck: null, finalLevel: 1, finalPower: 0 };
  let lastProgress = 0;
  let minutes = 0;
  let index = 0;
  const power = () => powerRating(deriveBagStats({ classId: opts.classId, level: state.level }, state.items.filter((item) => item.equipped)));
  while (minutes < max) {
    const before = { level: state.level, stage: (state.chapter - 1) * 10 + state.round, wins: Object.keys(state.bossClears).length, power: power() };
    const duration = Math.min(step, max - minutes);
    const today = new Date(Date.UTC(2026, 0, 1) + Math.floor(minutes / 1440) * 86_400_000).toISOString().slice(0, 10);
    const delta = computeClaimV2({ ...state, classId: opts.classId, equipped: state.items.filter((item) => item.equipped),
      keysHeld: state.stacks.catKey ?? 0, today, offline: false }, duration * 60, deriveSeed(opts.seed, index));
    state = accepted(applyClaim(state, delta)).state;
    minutes += duration;
    state = equipBestV2(state);
    for (let craft = 0; craft < 3; craft++) {
      const next = craftBestV2(state, deriveSeed(opts.seed, 2_000_000 + index * 3 + craft), minutes * 60);
      state = next.state;
      if (!next.crafted) break;
      result.crafted++;
    }
    if (state.items.length >= V2_CONFIG.bag.limit * 0.9) {
      const ids = salvageCandidates(state.items, { keepBest: true, maxRarity: 'rare' }).map((item) => item.id);
      if (ids.length) { state = accepted(applySalvage(state, ids)).state; result.salvaged += ids.length; }
    }
    const chapter = CHAPTERS.find((ch) => ch.index === state.chapter)!;
    if ((state.bossClears[state.chapter] || (state.round === chapter.roundsPerChapter && state.kills === chapter.killsPerRound)) &&
      (state.stacks.catKey ?? 0) >= V2_CONFIG.boss.keyCost && (state.bossCooldownUntil ?? 0) <= minutes * 60) {
      const fightSeed = deriveSeed(opts.seed, 1_000_000 + state.fights);
      const fight = simulateBossV2(deriveBagStats({ classId: opts.classId, level: state.level }, state.items.filter((item) => item.equipped)), opts.classId, bossOfChapter(state.chapter), fightSeed);
      state = accepted(applyBossResult(state, { won: fight.won, chapter: chapter.index,
        chest: fight.won ? rollSimChestV2(state, fightSeed) : { stackDeltas: {}, items: [] },
        keyCost: V2_CONFIG.boss.keyCost, cooldownS: V2_CONFIG.boss.lossCooldownSeconds, now: minutes * 60 })).state;
      result.bossFights++;
      if (fight.won) {
        result.keysUsed += V2_CONFIG.boss.keyCost;
        result.minutesToChapterBossWin[chapter.index] = minutes;
        result.minutesPerChapter[chapter.index] = minutes - (chapter.index === 1 ? 0 : result.minutesToChapterBossWin[chapter.index - 1]!);
        result.minutesToFirstBossWin ??= minutes;
      } else result.bossLosses++;
    }
    for (const level of [20, 40] as const) if (state.level >= level) result.minutesToLevel[level] ??= minutes;
    if (state.level > before.level || (state.chapter - 1) * 10 + state.round > before.stage || Object.keys(state.bossClears).length > before.wins || power() > before.power) lastProgress = minutes;
    if (!result.stuck && minutes - lastProgress >= 360) result.stuck = { at: minutes, chapter: state.chapter, round: state.round };
    index++;
    if (state.bossClears[CHAPTERS.length]) break;
  }
  result.finalLevel = state.level;
  result.finalPower = power();
  return { result, finalState: state };
}
