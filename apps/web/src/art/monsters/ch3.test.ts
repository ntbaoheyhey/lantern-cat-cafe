import { describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { monsterArtProblems } from './types';
import { CH3_ART } from './ch3';

describe('CH3_ART', () => {
  it('has exactly the 5 monster ids registered for chapter 3 in game-rules v2', () => {
    const ch3Monsters = v2.MONSTERS.filter((m) => m.chapter === 3);
    const expectedIds = ch3Monsters.map((m) => m.id);
    expect(expectedIds).toEqual([
      'mon.soap.slime',
      'mon.rubber.duck',
      'mon.sponge.crab',
      'mon.hair.dryer.wisp',
      'mon.bathtub.tyrant',
    ]);
    expect(Object.keys(CH3_ART).sort()).toEqual(expectedIds.sort());
  });

  it('matches registry kinds for all chapter 3 monsters', () => {
    const ch3Monsters = v2.MONSTERS.filter((m) => m.chapter === 3);
    for (const def of ch3Monsters) {
      expect(CH3_ART[def.id]!.kind).toBe(def.kind);
    }
  });

  it('returns [] from monsterArtProblems for every chapter 3 monster', () => {
    for (const [id, art] of Object.entries(CH3_ART)) {
      const problems = monsterArtProblems(art);
      expect(problems, `Monster ${id} has art problems: ${problems.join('; ')}`).toEqual([]);
    }
  });

  it('ensures each monster palette has dark outline k plus 3 to 6 colors', () => {
    for (const [id, art] of Object.entries(CH3_ART)) {
      expect(art.palette.k, `${id} missing outline 'k'`).toBeDefined();
      const nonKColors = Object.keys(art.palette).filter((c) => c !== 'k');
      expect(
        nonKColors.length,
        `${id} has ${nonKColors.length} non-k colors, expected 3 to 6`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        nonKColors.length,
        `${id} has ${nonKColors.length} non-k colors, expected 3 to 6`,
      ).toBeLessThanOrEqual(6);
    }
  });

  it('ensures no two monsters share identical walk frame 0', () => {
    const walkingMonsters = Object.values(CH3_ART).filter((m) => m.frames.walk);
    expect(walkingMonsters.length).toBe(4);
    const walk0Strings = walkingMonsters.map((m) => m.frames.walk![0]!.join('\n'));
    expect(new Set(walk0Strings).size).toBe(walkingMonsters.length);
  });

  it('ensures regular monsters are <= 20x20, elite <= 28x28, and boss <= 56x56', () => {
    expect(CH3_ART['mon.soap.slime']!.size.w).toBeLessThanOrEqual(20);
    expect(CH3_ART['mon.soap.slime']!.size.h).toBeLessThanOrEqual(20);
    expect(CH3_ART['mon.rubber.duck']!.size.w).toBeLessThanOrEqual(20);
    expect(CH3_ART['mon.rubber.duck']!.size.h).toBeLessThanOrEqual(20);
    expect(CH3_ART['mon.sponge.crab']!.size.w).toBeLessThanOrEqual(20);
    expect(CH3_ART['mon.sponge.crab']!.size.h).toBeLessThanOrEqual(20);
    expect(CH3_ART['mon.hair.dryer.wisp']!.size.w).toBeLessThanOrEqual(28);
    expect(CH3_ART['mon.hair.dryer.wisp']!.size.h).toBeLessThanOrEqual(28);
    expect(CH3_ART['mon.bathtub.tyrant']!.size.w).toBeLessThanOrEqual(56);
    expect(CH3_ART['mon.bathtub.tyrant']!.size.h).toBeLessThanOrEqual(56);
  });

  it('ensures boss has the required boss animations with correct frame counts', () => {
    const boss = CH3_ART['mon.bathtub.tyrant']!;
    expect(boss.frames.idle).toHaveLength(4);
    expect(boss.frames.windup).toHaveLength(3);
    expect(boss.frames.attack).toHaveLength(4);
    expect(boss.frames.hit).toHaveLength(1);
    expect(boss.frames.defeat).toHaveLength(6);
  });
});
