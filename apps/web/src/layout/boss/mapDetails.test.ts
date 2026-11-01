import { describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { bossRewardPreview, recommendedBossPower } from './mapDetails';

describe('boss Map advice and rewards', () => {
  it('uses the selected boss, equipped build and normal-attack estimate rather than the idle gate', () => {
    const stats = v2.deriveStats({ classId: 'warrior', level: 10 }, []);
    const first = recommendedBossPower(stats, 1)!;
    const last = recommendedBossPower(stats, 5)!;
    expect(first).toBeGreaterThan(0);
    expect(last).toBeGreaterThan(first);
    const scale = first / v2.powerRating(stats);
    const scaled = { ...stats, hp: stats.hp * scale, atk: stats.atk * scale, def: stats.def * scale };
    const check = v2.monsterFight(scaled, { ...v2.bossOfChapter(1), xp: 0, fish: 0 });
    expect(check.canWin).toBe(true);
    expect(check.timeToKillMs).toBeLessThanOrEqual(v2.V2_CONFIG.boss.maxMs);
  });
  it('has a lower bound: equipment strength is not itself the recommendation', () => {
    const stats = v2.deriveStats({ classId: 'warrior', level: 100 }, []);
    expect(recommendedBossPower(stats, 1)).toBeLessThan(v2.powerRating(stats));
  });
  it('shows the real first-clear amounts and independent line chances', () => {
    expect(bossRewardPreview(1, true)).toEqual([
      { label: 'Fish', count: '300–500', chance: 100 },
      { label: 'Yarn', count: '15–25', chance: 100 },
      { label: 'Fluff Tuft', count: '5–8', chance: 100 },
      { label: 'Shiny Button', count: '1–2', chance: 40 },
      { label: 'Main gear', count: '1', chance: 100 },
      { label: 'Accessory', count: '1', chance: 50 },
      { label: 'Moon Pearl', count: '1', chance: 100 },
    ]);
  });
  it('switches reward table on rematch and chapter, never adds an imaginary guaranteed key', () => {
    expect(bossRewardPreview(1, false)).toContainEqual({ label: 'Fish', count: '120–200', chance: 100 });
    expect(bossRewardPreview(1, false)).toContainEqual({ label: 'Main gear', count: '1', chance: 70 });
    expect(bossRewardPreview(2, true)).toContainEqual({ label: 'Fish', count: '600–1000', chance: 100 });
    expect(bossRewardPreview(5, true)).toHaveLength(9);
    expect(bossRewardPreview(0, true)).toEqual([]);
  });
});
