import { describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import type { ServerStateV2 } from '../../api/GameApiV2';
import {
  bossGateStatus,
  bossLabel,
  fightableChapters,
  formatCountdown,
} from './bossGate';

function makeFixture(overrides: Partial<{
  classId: ServerStateV2['cat']['classId'];
  chapter: number;
  round: number;
  kills: number;
  killsPerRound: number;
  keys: number;
  cooldownUntil: number | null;
  clearedChapters: number[];
  gated: boolean;
  neededPower: number;
}> = {}): ServerStateV2 {
  const currentChapter = overrides.chapter ?? 1;
  const chDef = v2.CHAPTERS.find((c) => c.index === currentChapter);
  const killsPerRound = overrides.killsPerRound ?? (chDef?.killsPerRound ?? 6);

  const cleared = (overrides.clearedChapters ?? []).map((ch) => ({
    chapter: ch,
    cleared: true,
    wins: 1,
  }));

  return {
    cat: {
      classId: overrides.classId !== undefined ? overrides.classId : 'warrior',
      level: 10,
      xp: 0,
      xpToNext: 100,
    },
    progress: {
      chapter: currentChapter,
      round: overrides.round ?? 1,
      kills: overrides.kills ?? 0,
      killsPerRound,
      gated: overrides.gated ?? false,
      neededPower: overrides.neededPower ?? 0,
    },
    currencies: {
      fish: 100,
      yarn: 50,
      keys: overrides.keys ?? 1,
    },
    materials: {},
    inventory: [],
    bagLimit: 200,
    equipped: {
      weapon: null,
      helmet: null,
      armor: null,
      gloves: null,
      boots: null,
      collar: null,
      earring: null,
      ring: null,
      charm: null,
    },
    unlockedSlots: ['weapon', 'armor'],
    bosses: {
      chapters: cleared,
      cooldownUntil: overrides.cooldownUntil !== undefined ? overrides.cooldownUntil : null,
    },
    forge: {
      blockedBy: null,
      forgedToday: false,
      pending: null,
      today: null,
    },
    founder: false,
    serverTime: 1000,
  };
}

describe('bossGate', () => {
  it('1. classId null -> no_class even with a cooldown running', () => {
    const state = makeFixture({ classId: null, cooldownUntil: 2000 });
    const status = bossGateStatus(state, 1, 1000);
    expect(status).toEqual({ kind: 'no_class' });
  });

  it('2. cooldownUntil = 1000, nowS 958 -> cooldown with secondsLeft 42; nowS 1000 -> not a cooldown', () => {
    const state = makeFixture({ cooldownUntil: 1000 });
    const inCooldown = bossGateStatus(state, 1, 958);
    expect(inCooldown).toEqual({
      kind: 'cooldown',
      secondsLeft: 42,
      until: 1000,
    });

    const expiredCooldown = bossGateStatus(state, 1, 1000);
    expect(expiredCooldown.kind).not.toBe('cooldown');
  });

  it('3. chapter 1, round 10, kills = killsPerRound(ch1), keys 1 -> ready, rematch false', () => {
    const ch1 = v2.CHAPTERS.find((c) => c.index === 1)!;
    const state = makeFixture({
      chapter: 1,
      round: 10,
      kills: ch1.killsPerRound,
      keys: 1,
    });
    const status = bossGateStatus(state, 1, 1000);
    expect(status).toEqual({ kind: 'ready', rematch: false });
  });

  it('4. chapter 1, round 7, kills 2 -> not_reached roundsLeft 3, killsLeft killsPerRound - 2', () => {
    const ch1 = v2.CHAPTERS.find((c) => c.index === 1)!;
    const state = makeFixture({
      chapter: 1,
      round: 7,
      kills: 2,
    });
    const status = bossGateStatus(state, 1, 1000);
    expect(status).toEqual({
      kind: 'not_reached',
      chapter: 1,
      roundsLeft: 3,
      killsLeft: ch1.killsPerRound - 2,
    });
  });

  it('5. asking for chapter 3 while at chapter 2 -> not_reached -1/-1', () => {
    const state = makeFixture({
      chapter: 2,
      round: 5,
      kills: 0,
    });
    const status = bossGateStatus(state, 3, 1000);
    expect(status).toEqual({
      kind: 'not_reached',
      chapter: 3,
      roundsLeft: -1,
      killsLeft: -1,
    });
  });

  it('6. chapter 1 cleared, now at chapter 2 round 1: chapter 1 -> ready rematch true (with a key); without a key -> no_key', () => {
    const withKey = makeFixture({
      chapter: 2,
      round: 1,
      kills: 0,
      clearedChapters: [1],
      keys: 1,
    });
    expect(bossGateStatus(withKey, 1, 1000)).toEqual({
      kind: 'ready',
      rematch: true,
    });

    const withoutKey = makeFixture({
      chapter: 2,
      round: 1,
      kills: 0,
      clearedChapters: [1],
      keys: 0,
    });
    expect(bossGateStatus(withoutKey, 1, 1000)).toEqual({
      kind: 'no_key',
    });
  });

  it('7. cooldown beats no_key and not_reached (order)', () => {
    // Both not_reached and no_key condition present
    const state = makeFixture({
      chapter: 1,
      round: 1,
      kills: 0,
      keys: 0,
      cooldownUntil: 1500,
    });
    const status = bossGateStatus(state, 1, 1000);
    expect(status).toEqual({
      kind: 'cooldown',
      secondsLeft: 500,
      until: 1500,
    });
  });

  it('8. fightableChapters: cleared [1,2], current 3 -> [1,2,3]; nothing cleared, current 1 -> [1]; current 6 -> [1,2,3,4,5] (clamped)', () => {
    const stateA = makeFixture({ clearedChapters: [1, 2], chapter: 3 });
    expect(fightableChapters(stateA)).toEqual([1, 2, 3]);

    const stateB = makeFixture({ clearedChapters: [], chapter: 1 });
    expect(fightableChapters(stateB)).toEqual([1]);

    const stateC = makeFixture({ clearedChapters: [1, 2, 3, 4, 5], chapter: 6 });
    expect(fightableChapters(stateC)).toEqual([1, 2, 3, 4, 5]);
  });

  it('9. formatCountdown cases', () => {
    expect(formatCountdown(59)).toBe('0:59');
    expect(formatCountdown(61)).toBe('1:01');
    expect(formatCountdown(3600)).toBe('60:00');
    expect(formatCountdown(42)).toBe('0:42');
    expect(formatCountdown(0)).toBe('0:00');
  });

  it('bossLabel resolves boss and chapter names', () => {
    const label1 = bossLabel(1);
    expect(label1.id).toBe('mon.yarn.giant');
    expect(label1.name).toBe('Yarn Giant');
    expect(label1.chapterName).toBe('Living Room');

    const label99 = bossLabel(99);
    expect(label99.id).toBe('');
    expect(label99.name).toBe('Unknown Boss');
    expect(label99.chapterName).toBe('Chapter 99');
  });

  describe('gated state transitions', () => {
    it('gated current chapter -> kind gated with neededPower, roundsLeft, killsLeft', () => {
      const ch1 = v2.CHAPTERS.find((c) => c.index === 1)!;
      const state = makeFixture({
        chapter: 1,
        round: 7,
        kills: 2,
        gated: true,
        neededPower: 1500,
      });
      const status = bossGateStatus(state, 1, 1000);
      expect(status).toEqual({
        kind: 'gated',
        chapter: 1,
        neededPower: 1500,
        roundsLeft: 3,
        killsLeft: ch1.killsPerRound - 2,
      });
    });

    it('gated but another chapter -> not_reached -1/-1', () => {
      const state = makeFixture({
        chapter: 1,
        round: 7,
        kills: 2,
        gated: true,
        neededPower: 1500,
      });
      const status = bossGateStatus(state, 2, 1000);
      expect(status).toEqual({
        kind: 'not_reached',
        chapter: 2,
        roundsLeft: -1,
        killsLeft: -1,
      });
    });

    it('gated during a cooldown -> cooldown', () => {
      const state = makeFixture({
        chapter: 1,
        round: 7,
        kills: 2,
        gated: true,
        neededPower: 1500,
        cooldownUntil: 1042,
      });
      const status = bossGateStatus(state, 1, 1000);
      expect(status).toEqual({
        kind: 'cooldown',
        secondsLeft: 42,
        until: 1042,
      });
    });

    it('gated false -> the old result (existing tests unchanged)', () => {
      const ch1 = v2.CHAPTERS.find((c) => c.index === 1)!;
      const state = makeFixture({
        chapter: 1,
        round: 7,
        kills: 2,
        gated: false,
        neededPower: 1500,
      });
      const status = bossGateStatus(state, 1, 1000);
      expect(status).toEqual({
        kind: 'not_reached',
        chapter: 1,
        roundsLeft: 3,
        killsLeft: ch1.killsPerRound - 2,
      });
    });
  });
});
