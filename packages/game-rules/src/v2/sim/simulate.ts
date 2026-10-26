import { deriveSeed } from '../../rng';
import { deriveBagStats, salvageCandidates } from '../bag';
import { powerRating, simulateBossV2, bossOfChapter, monsterAt, monsterFight, stageOf } from '../combat';
import { CHAPTERS, type ClassId } from '../content';
import { V2_CONFIG } from '../config';
import { computeClaimV2 } from '../idle';
import { applyClaim, applyBossResult, applySalvage } from '../state';
import type { PlayerStateV2 } from '../state/types';
import { withConfigV2, type ConfigOverridesV2 } from './config';
import { accepted, newPlayerV2, equipBestV2, craftBestV2, rollSimChestV2 } from './player';
export interface SimOptionsV2 { classId: ClassId; seed: number; overrides?: ConfigOverridesV2; maxActiveMinutes?: number; stepMinutes?: number; activeMinutesPerDay?: number; scenario?: 'S-A' | 'S-B' }
export interface RoundSampleV2 { level: number; timeToKillMs: number; walkTimeMs: number; walkShare: number; timeToKillByLevelMs: number[] }
export interface BossSampleV2 { fights: number; losses: number; firstAttemptWon: boolean | null; durationsMs: number[]; levels: number[] }
export interface SimResultV2 {
  classId: ClassId; seed: number;
  keyWaitMinutes: Record<number, number>; maxLevelBeforeChapter5Win: boolean;
  calendarDaysToChapterBossWin: Record<number, number | null>;
  minutesToFirstBossWin: number | null;
  minutesToChapterBossWin: Record<number, number | null>;
  minutesPerChapter: Record<number, number | null>;
  minutesToLevel: { 20: number | null; 40: number | null };
  keysUsed: number; bossFights: number; bossLosses: number; crafted: number; salvaged: number;
  stuck: { at: number; chapter: number; round: number } | null;
  finalLevel: number; finalPower: number;
  roundSamples: Record<string, RoundSampleV2>;
  bosses: Record<number, BossSampleV2>;
}
export function simulateV2(opts: SimOptionsV2): SimResultV2 { return simulateWithStateForTest(opts).result; }
export function simulateWithStateForTest(opts: SimOptionsV2, initialState?: PlayerStateV2): { result: SimResultV2; finalState: PlayerStateV2 } {
  const overrides = opts.scenario === 'S-A' ? { ...opts.overrides, idle: { ...opts.overrides?.idle, dailyKeys: 5 } } : opts.scenario === 'S-B' ? { ...opts.overrides, boss: { ...opts.overrides?.boss, firstClearKeys: 1 } } : opts.overrides ?? {};
  return withConfigV2(overrides, () => run(opts, initialState));
}
function run(opts: SimOptionsV2, initialState?: PlayerStateV2): { result: SimResultV2; finalState: PlayerStateV2 } {
  const max = opts.maxActiveMinutes ?? 5 * 6 * 60;
  const step = opts.stepMinutes ?? 2;
  const dayMinutes = opts.activeMinutesPerDay ?? 1440;
  if (!Number.isFinite(max) || max < 0 || !Number.isFinite(step) || step <= 0 || !Number.isSafeInteger(opts.seed) || !Number.isFinite(dayMinutes) || dayMinutes <= 0) throw new Error('invalid simulation options');
  let state = initialState ?? newPlayerV2(opts.classId);
  const result: SimResultV2 = {
    keyWaitMinutes: Object.fromEntries(CHAPTERS.map((ch) => [ch.index, 0])), maxLevelBeforeChapter5Win: false,
    calendarDaysToChapterBossWin: Object.fromEntries(CHAPTERS.map((ch) => [ch.index, null])), classId: opts.classId, seed: opts.seed, minutesToFirstBossWin: null,
    minutesToChapterBossWin: Object.fromEntries(CHAPTERS.map((ch) => [ch.index, null])),
    minutesPerChapter: Object.fromEntries(CHAPTERS.map((ch) => [ch.index, null])), minutesToLevel: { 20: null, 40: null },
    keysUsed: 0, bossFights: 0, bossLosses: 0, crafted: 0, salvaged: 0, stuck: null, finalLevel: 1, finalPower: 0, roundSamples: {},
    bosses: Object.fromEntries(CHAPTERS.map((ch) => [ch.index, { fights: 0, losses: 0, firstAttemptWon: null, durationsMs: [], levels: [] }])) };
  let lastProgress = 0;
  let minutes = 0;
  let index = 0;
  let equippedSignature = '';
  const signature = () => `${state.level}:${state.items.map((item) => `${item.id}:${Number(item.equipped)}`).join(',')}`;
  const power = () => powerRating(deriveBagStats({ classId: opts.classId, level: state.level }, state.items.filter((item) => item.equipped)));
  while (minutes < max) {
    const before = { level: state.level, stage: (state.chapter - 1) * 10 + state.round, wins: Object.keys(state.bossClears).length, power: power() };
    // Keep the outer claim cadence while splitting at gate, cooldown and day events.
    const frameEnd = Math.min(max, (Math.floor((minutes + 1e-8) / step) + 1) * step);
    const dayEnd = (Math.floor((minutes + 1e-8) / dayMinutes) + 1) * dayMinutes;
    let duration = Math.min(frameEnd, dayEnd) - minutes;
    const chapterBefore = CHAPTERS.find((ch) => ch.index === state.chapter)!;
    const atGate = state.round === chapterBefore.roundsPerChapter && state.kills === chapterBefore.killsPerRound;
    const cooldownMinutes = (state.bossCooldownUntil ?? 0) / 60;
    if (atGate && cooldownMinutes > minutes) duration = Math.min(duration, cooldownMinutes - minutes);
    const today = new Date(Date.UTC(2026, 0, 1) + Math.floor((minutes + 1e-8) / dayMinutes) * 86_400_000).toISOString().slice(0, 10);
    const input = { ...state, classId: opts.classId, equipped: state.items.filter((item) => item.equipped),
      keysHeld: state.stacks.catKey ?? 0, today, offline: false };
    const claimSeed = deriveSeed(opts.seed, index);
    // A daily top-up is available at the start of the first positive claim of the day.
    if (atGate && (state.stacks.catKey ?? 0) === 0 && state.lastDailyKeyDay !== today) duration = Math.min(duration, 1 / 60);
    let delta = computeClaimV2(input, duration * 60, claimSeed);
    if (!atGate && delta.progress.round === chapterBefore.roundsPerChapter && delta.progress.kills === chapterBefore.killsPerRound) {
      const seconds = earliestSecondV2(duration * 60, (elapsed) => {
        const probe = computeClaimV2(input, elapsed, claimSeed).progress;
        return probe.round === chapterBefore.roundsPerChapter && probe.kills === chapterBefore.killsPerRound;
      });
      duration = seconds / 60;
      delta = computeClaimV2(input, seconds, claimSeed);
    }
    if (atGate && (state.stacks.catKey ?? 0) === 0 && state.lastDailyKeyDay === today) result.keyWaitMinutes[state.chapter]! += duration;
    // Replay only a crossed probe to recover its entry level, without applying extra rewards.
    for (const [ch, round] of [[1, 1], [3, 1], [3, 5], [5, 1]] as const) {
      const key = `${ch}:${round}`;
      if (state.chapter !== ch || result.roundSamples[key] || delta.progress.round < round) continue;
      let level = state.level;
      if (state.round < round) {
        let low = 0; let high = duration * 60;
        for (let n = 0; n < 16; n++) {
          const mid = (low + high) / 2;
          if (computeClaimV2(input, mid, claimSeed).progress.round >= round) high = mid; else low = mid;
        }
        level = computeClaimV2(input, high, claimSeed).progress.level;
      }
      result.roundSamples[key] = sampleRoundV2(state, level, ch, round);
    }
    state = accepted(applyClaim(state, delta)).state;
    minutes += duration;
    const nowSeconds = Math.round(minutes * 60 * 1e6) / 1e6;
    // Item attributes are immutable in this policy. Rechecking the same level, ids and
    // equipped flags reaches the same greedy fixed point, so reuse that result.
    if (signature() !== equippedSignature) {
      state = equipBestV2(state);
      equippedSignature = signature();
    }
    for (let craft = 0; craft < 3; craft++) {
      const next = craftBestV2(state, deriveSeed(opts.seed, 2_000_000 + index * 3 + craft), nowSeconds);
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
      (state.stacks.catKey ?? 0) >= V2_CONFIG.boss.keyCost && (state.bossCooldownUntil ?? 0) <= nowSeconds) {
      const fightSeed = deriveSeed(opts.seed, 1_000_000 + state.fights);
      const fight = simulateBossV2(deriveBagStats({ classId: opts.classId, level: state.level }, state.items.filter((item) => item.equipped)), opts.classId, bossOfChapter(state.chapter), fightSeed);
      state = accepted(applyBossResult(state, { won: fight.won, chapter: chapter.index,
        chest: fight.won ? rollSimChestV2(state, fightSeed) : { stackDeltas: {}, items: [] },
        keyCost: V2_CONFIG.boss.keyCost, cooldownS: V2_CONFIG.boss.lossCooldownSeconds, now: nowSeconds })).state;
      const boss = result.bosses[chapter.index]!;
      boss.firstAttemptWon ??= fight.won;
      boss.fights++;
      boss.losses += Number(!fight.won);
      boss.durationsMs.push(fight.durationMs);
      boss.levels.push(state.level);
      result.bossFights++;
      if (fight.won) {
        result.keysUsed += V2_CONFIG.boss.keyCost;
        result.minutesToChapterBossWin[chapter.index] = minutes;
        result.calendarDaysToChapterBossWin[chapter.index] = Math.floor((minutes - 1e-8) / dayMinutes) + (minutes - Math.floor((minutes - 1e-8) / dayMinutes) * dayMinutes) / 1440;
        result.minutesPerChapter[chapter.index] = minutes - (chapter.index === 1 ? 0 : result.minutesToChapterBossWin[chapter.index - 1]!);
        result.minutesToFirstBossWin ??= minutes;
      } else result.bossLosses++;
    }
    for (const level of [20, 40] as const) if (state.level >= level) result.minutesToLevel[level] ??= minutes;
    if (state.level > before.level || (state.chapter - 1) * 10 + state.round > before.stage || Object.keys(state.bossClears).length > before.wins || power() > before.power) lastProgress = minutes;
    if (!result.stuck && minutes - lastProgress >= 360) result.stuck = { at: minutes, chapter: state.chapter, round: state.round };
    index++;
    if (state.level >= V2_CONFIG.cat.maxLevel) result.maxLevelBeforeChapter5Win = true;
    if (state.bossClears[CHAPTERS.length]) break;
  }
  result.finalLevel = state.level;
  result.finalPower = power();
  return { result, finalState: state };
}

/** Equal-weight median of the round's regular archetypes and elite, matching roundProfile's roster. */
export function sampleRoundV2(state: PlayerStateV2, level: number, chapterIndex: number, round: number): RoundSampleV2 {
  const chapter = CHAPTERS.find((ch) => ch.index === chapterIndex)!;
  const atLevel = (sampleLevel: number) => {
    const stats = deriveBagStats({ classId: state.classId!, level: sampleLevel }, state.items.filter((item) => item.equipped));
    const times = [...chapter.regulars, chapter.elite].map((id) => monsterFight(stats, monsterAt(id, stageOf(chapterIndex, round))).timeToKillMs).sort((a, b) => a - b);
    const middle = Math.floor(times.length / 2);
    return times.length % 2 ? times[middle]! : (times[middle - 1]! + times[middle]!) / 2;
  };
  // Retain actual entry equipment, but evaluate every possible level while its config is active.
  // Aggregation can then evaluate exactly at the class median level without mutating config.
  const timeToKillByLevelMs = Array.from({ length: Math.floor(V2_CONFIG.cat.maxLevel) }, (_, index) => atLevel(index + 1));
  const timeToKillMs = atLevel(level);
  return { level, timeToKillMs, walkTimeMs: V2_CONFIG.idle.walkTimeMs, walkShare: V2_CONFIG.idle.walkTimeMs / (V2_CONFIG.idle.walkTimeMs + timeToKillMs), timeToKillByLevelMs };
}

/** Earliest whole second satisfying a monotone pure-claim replay; never overshoots a partial final step. */
export function earliestSecondV2(maxSeconds: number, reached: (seconds: number) => boolean): number {
  let low = 1; let high = Math.ceil(maxSeconds);
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (reached(mid)) high = mid; else low = mid + 1;
  }
  return Math.min(low, maxSeconds);
}
