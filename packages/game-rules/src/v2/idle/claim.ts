import { CONFIG } from '../../config';
import { deriveSeed, Rng, type Seed } from '../../rng';
import { V2_CONFIG } from '../config';
import { CHAPTERS, MONSTERS, type ChapterDef, type MonsterDef } from '../content';
import { deriveStats, monsterAt, monsterFight, powerRating, stageOf, type CatStats } from '../combat';
import { addStack, keyCapacity, rollDrops, type DropBatch } from './drops';
import type { ClaimDeltaV2, ClaimInputV2 } from './types';

const MONSTER_BY_ID = new Map(MONSTERS.map((monster) => [monster.id, monster]));

export function xpToNextV2(level: number): number {
  return Math.ceil(V2_CONFIG.cat.xpBase * V2_CONFIG.cat.xpGrowth ** (level - 1));
}

interface RoundProfile {
  chapter: ChapterDef;
  round: number;
  stage: number;
  monsters: { monster: MonsterDef; timeMs: number }[];
  canWin: boolean;
}

function roundProfile(stats: CatStats, chapter: ChapterDef, round: number): RoundProfile {
  const stage = stageOf(chapter.index, round);
  let canWin = true;
  const monsters = [...chapter.regulars, chapter.elite].map((id) => {
    const monster = MONSTER_BY_ID.get(id)!;
    const fight = monsterFight(stats, monsterAt(monster, stage));
    canWin &&= fight.canWin;
    return { monster, timeMs: fight.timeToKillMs + V2_CONFIG.idle.walkTimeMs };
  });
  return { chapter, round, stage, monsters, canWin };
}

/** Counts in a deterministic regular rotation, followed by one elite; no kill loop. */
function prefixCounts(profile: RoundProfile, kills: number): number[] {
  const regulars = profile.chapter.regulars.length;
  const normal = Math.min(kills, profile.chapter.killsPerRound - 1);
  return profile.monsters.map((_, index) => index === regulars
    ? Number(kills >= profile.chapter.killsPerRound)
    : Math.floor(normal / regulars) + Number(index < normal % regulars));
}

function segment(profile: RoundProfile, start: number, count: number): number[] {
  const before = prefixCounts(profile, start);
  return prefixCounts(profile, start + count).map((n, index) => n - before[index]!);
}

function segmentTime(profile: RoundProfile, start: number, count: number): number {
  return segment(profile, start, count).reduce((sum, n, index) => sum + n * profile.monsters[index]!.timeMs, 0);
}

function neededPower(stats: CatStats, chapter: ChapterDef, round: number): number {
  let low = 1;
  let high: number = V2_CONFIG.idle.powerSearchMaxScale;
  const scaled = (scale: number): CatStats => ({ ...stats, hp: stats.hp * scale, atk: stats.atk * scale, def: stats.def * scale });
  for (let step = 0; step < V2_CONFIG.idle.powerSearchSteps; step++) {
    const mid = (low + high) / 2;
    if (roundProfile(scaled(mid), chapter, round).canWin) high = mid;
    else low = mid;
  }
  return Math.max(powerRating(stats) + 1, powerRating(scaled(high)));
}

/**
 * Pure claim. Frontier kills count only cleared monsters; killsPerRound at round 10 means
 * boss-ready. Gates and boss-ready cats farm behind that frontier, never fighting the boss.
 * A gate stays fixed for this claim; earned levels can unlock it on the next claim.
 */
export function computeClaimV2(input: ClaimInputV2, elapsedSeconds: number, seed: Seed): ClaimDeltaV2 {
  const progress = {
    level: input.level, xp: input.xp, chapter: input.chapter,
    round: input.round, kills: input.kills, bestStage: input.bestStage,
  };
  const delta: ClaimDeltaV2 = { progress, stackDeltas: {}, items: [], gated: false };
  const counted = Math.min(Math.max(0, Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0), CONFIG.idle.offlineCapSeconds);
  if (counted === 0) return delta;
  const online = input.offline ? 0 : Math.min(counted, CONFIG.idle.onlineWindowSeconds);
  let remainingMs = (online + (counted - online) * CONFIG.idle.offlineEfficiency) * 1000;
  const chapter = CHAPTERS.find((entry) => entry.index === input.chapter);
  if (!chapter) throw new Error(`Unknown chapter: ${input.chapter}`);
  if (!Number.isInteger(input.round) || input.round < 1 || input.round > chapter.roundsPerChapter ||
      !Number.isInteger(input.kills) || input.kills < 0 || input.kills > chapter.killsPerRound) {
    throw new RangeError('Invalid idle frontier');
  }
  if (input.lastDailyKeyDay !== input.today) {
    delta.dailyKeyDay = input.today;
    addStack(delta, 'catKey', Math.min(V2_CONFIG.idle.dailyKeys, Math.max(0, keyCapacity() - input.keysHeld)));
  }
  let stats = deriveStats({ classId: input.classId, level: progress.level }, input.equipped);
  const profiles = new Map<string, RoundProfile>();
  const profileAt = (ch: ChapterDef, round: number): RoundProfile => {
    const key = `${stats.level}:${ch.index}:${round}`;
    let profile = profiles.get(key);
    if (!profile) {
      profile = roundProfile(stats, ch, round);
      profiles.set(key, profile);
    }
    return profile;
  };
  let farm: { chapter: ChapterDef; round: number } | undefined;
  let farmKills = 0;
  let yarn = 0;
  const batches = new Map<string, DropBatch>();
  for (let rounds = 0; rounds < V2_CONFIG.idle.maxRoundsPerClaim && remainingMs > 0; rounds++) {
    if (!farm && progress.kills === chapter.killsPerRound) {
      if (progress.round < chapter.roundsPerChapter) {
        progress.round++;
        progress.kills = 0;
      } else farm = { chapter, round: progress.round };
    }
    let profile = profileAt(farm?.chapter ?? chapter, farm?.round ?? progress.round);
    if (!profile.canWin && !farm) {
      delta.gated = true;
      delta.neededPower = neededPower(stats, chapter, progress.round);
      // Search backward through rounds already reached, including earlier cleared chapters.
      for (let ch = chapter.index; ch >= 1 && !farm; ch--) {
        const previous = CHAPTERS.find((entry) => entry.index === ch)!;
        const last = ch === chapter.index ? progress.round - 1 : previous.roundsPerChapter;
        for (let round = last; round >= 1; round--) {
          if (profileAt(previous, round).canWin) {
            farm = { chapter: previous, round };
            break;
          }
        }
      }
      if (!farm) break;
      profile = profileAt(farm.chapter, farm.round);
    }
    if (!profile.canWin) break;
    const start = farm ? farmKills : progress.kills;
    let low = 0;
    let high = profile.chapter.killsPerRound - start;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if (segmentTime(profile, start, mid) <= remainingMs) low = mid;
      else high = mid - 1;
    }
    const count = low;
    if (!count) break;
    remainingMs -= segmentTime(profile, start, count);
    const counts = segment(profile, start, count);
    counts.forEach((n, index) => {
      if (!n) return;
      const monster = profile.monsters[index]!.monster;
      const reward = monsterAt(monster, profile.stage);
      progress.xp += n * Math.floor(reward.xp * (1 + stats.xpBonus));
      addStack(delta, 'fish', n * Math.floor(reward.fish * (1 + stats.fishBonus)));
      yarn += n * V2_CONFIG.idle.yarnBase * V2_CONFIG.idle.yarnGrowth ** (profile.stage - 1) * monster.lootMul;
      const key = `${monster.id}:${profile.stage}:${stats.level}`;
      const batch = batches.get(key) ?? {
        monster, stage: profile.stage, kills: 0, level: stats.level, materialFind: stats.materialFind,
        clearedChapter: profile.chapter.index < input.chapter || input.bestStage > stageOf(profile.chapter.index, profile.chapter.roundsPerChapter),
      };
      batch.kills += n;
      batches.set(key, batch);
    });
    while (progress.level < V2_CONFIG.cat.maxLevel && progress.xp >= xpToNextV2(progress.level)) {
      progress.xp -= xpToNextV2(progress.level);
      progress.level++;
    }
    if (progress.level >= V2_CONFIG.cat.maxLevel) progress.xp = 0;
    stats = deriveStats({ classId: input.classId, level: progress.level }, input.equipped);
    if (farm) farmKills = (farmKills + count) % profile.chapter.killsPerRound;
    else {
      progress.kills += count;
      if (progress.kills === chapter.killsPerRound) progress.bestStage = Math.max(progress.bestStage, profile.stage);
    }
    if (count < profile.chapter.killsPerRound - start) break;
  }
  addStack(delta, 'yarn', Math.floor(yarn));
  rollDrops(delta, batches.values(), input.classId, input.keysHeld, new Rng(deriveSeed(seed, 1)));
  return delta;
}

/** Inspect the next frontier fight without rolling rewards or advancing state. */
export function gateV2(input: ClaimInputV2): { gated: boolean; neededPower: number } {
  const chapter = CHAPTERS.find(entry => entry.index === input.chapter);
  if (!chapter) throw new Error(`Unknown chapter: ${input.chapter}`);
  if (!Number.isInteger(input.round) || input.round < 1 || input.round > chapter.roundsPerChapter ||
    !Number.isInteger(input.kills) || input.kills < 0 || input.kills > chapter.killsPerRound) throw new RangeError('Invalid idle frontier');
  if (input.kills === chapter.killsPerRound && input.round === chapter.roundsPerChapter) return { gated: false, neededPower: 0 };
  const round = input.kills === chapter.killsPerRound ? input.round + 1 : input.round;
  const stats = deriveStats({ classId: input.classId, level: input.level }, input.equipped);
  return roundProfile(stats, chapter, round).canWin ? { gated: false, neededPower: 0 }
    : { gated: true, neededPower: neededPower(stats, chapter, round) };
}
