import { describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { monsterArtProblems } from './types';
import { CH2_ART } from './ch2';

describe('CH2_ART', () => {
  it('has exactly the 5 monster ids registered for chapter 2 in game-rules v2', () => {
    const ch2Monsters = v2.MONSTERS.filter((m) => m.chapter === 2);
    const expectedIds = ch2Monsters.map((m) => m.id);
    expect(expectedIds).toEqual([
      'mon.pickle.imp',
      'mon.toast.mimic',
      'mon.spoon.bug',
      'mon.blender.brute',
      'mon.cucumber.scare',
    ]);
    expect(Object.keys(CH2_ART).sort()).toEqual(expectedIds.sort());
  });

  it('matches registry kinds for all chapter 2 monsters', () => {
    const ch2Monsters = v2.MONSTERS.filter((m) => m.chapter === 2);
    for (const def of ch2Monsters) {
      expect(CH2_ART[def.id]!.kind).toBe(def.kind);
    }
  });

  it('returns [] from monsterArtProblems for every chapter 2 monster', () => {
    for (const [id, art] of Object.entries(CH2_ART)) {
      const problems = monsterArtProblems(art);
      expect(problems, `Monster ${id} has art problems: ${problems.join('; ')}`).toEqual([]);
    }
  });

  it('ensures each monster palette has dark outline k plus 3 to 6 colors', () => {
    for (const [id, art] of Object.entries(CH2_ART)) {
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
    const walkingMonsters = Object.values(CH2_ART).filter((m) => m.frames.walk);
    expect(walkingMonsters.length).toBe(4);
    const walk0Strings = walkingMonsters.map((m) => m.frames.walk![0]!.join('\n'));
    expect(new Set(walk0Strings).size).toBe(walkingMonsters.length);
  });

  it('ensures regular monsters are <= 20x20, elite <= 28x28, and boss <= 56x56', () => {
    expect(CH2_ART['mon.pickle.imp']!.size.w).toBeLessThanOrEqual(20);
    expect(CH2_ART['mon.pickle.imp']!.size.h).toBeLessThanOrEqual(20);
    expect(CH2_ART['mon.toast.mimic']!.size.w).toBeLessThanOrEqual(20);
    expect(CH2_ART['mon.toast.mimic']!.size.h).toBeLessThanOrEqual(20);
    expect(CH2_ART['mon.spoon.bug']!.size.w).toBeLessThanOrEqual(20);
    expect(CH2_ART['mon.spoon.bug']!.size.h).toBeLessThanOrEqual(20);
    expect(CH2_ART['mon.blender.brute']!.size.w).toBeLessThanOrEqual(28);
    expect(CH2_ART['mon.blender.brute']!.size.h).toBeLessThanOrEqual(28);
    expect(CH2_ART['mon.cucumber.scare']!.size.w).toBeLessThanOrEqual(56);
    expect(CH2_ART['mon.cucumber.scare']!.size.h).toBeLessThanOrEqual(56);
  });

  it('ensures boss has the required boss animations with correct frame counts', () => {
    const boss = CH2_ART['mon.cucumber.scare']!;
    expect(boss.frames.idle).toHaveLength(4);
    expect(boss.frames.windup).toHaveLength(3);
    expect(boss.frames.attack).toHaveLength(4);
    expect(boss.frames.hit).toHaveLength(1);
    expect(boss.frames.defeat).toHaveLength(6);
  });
});
