import { describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { monsterArtProblems } from './types';
import { CH4_ART } from './ch4';

describe('CH4_ART', () => {
  const ch4Monsters = v2.MONSTERS.filter((m) => m.chapter === 4);
  const expectedIds = ch4Monsters.map((m) => m.id);

  it('has exactly the 5 monster ids registered for chapter 4 in game-rules v2', () => {
    expect(expectedIds).toEqual([
      'mon.mouse.trap',
      'mon.dust.moth',
      'mon.windup.robot',
      'mon.box.fort.knight',
      'mon.vacuum.beast',
    ]);
    expect(Object.keys(CH4_ART).sort()).toEqual([...expectedIds].sort());
    expect(Object.keys(CH4_ART)).toHaveLength(5);
  });

  it('matches registry kinds for all chapter 4 monsters', () => {
    for (const def of ch4Monsters) {
      expect(CH4_ART[def.id]?.kind).toBe(def.kind);
    }
  });

  it('returns [] from monsterArtProblems for every chapter 4 monster', () => {
    for (const [id, art] of Object.entries(CH4_ART)) {
      const problems = monsterArtProblems(art);
      expect(problems, `Monster ${id} has art problems: ${problems.join('; ')}`).toEqual([]);
    }
  });

  it('ensures each monster palette has dark outline k plus 3 to 6 colors', () => {
    for (const [id, art] of Object.entries(CH4_ART)) {
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
    const walk0s = Object.entries(CH4_ART).map(([id, art]) => {
      const frame0 = art.frames.walk?.[0];
      expect(frame0, `Monster ${id} should have walk frame 0`).toBeDefined();
      return frame0!.join('\n');
    });

    const uniqueWalk0s = new Set(walk0s);
    expect(uniqueWalk0s.size).toBe(Object.keys(CH4_ART).length);
  });

  it('ensures regular monsters are <= 20x20, elite <= 28x28, and boss <= 56x56', () => {
    expect(CH4_ART['mon.mouse.trap']!.size.w).toBeLessThanOrEqual(20);
    expect(CH4_ART['mon.mouse.trap']!.size.h).toBeLessThanOrEqual(20);
    expect(CH4_ART['mon.dust.moth']!.size.w).toBeLessThanOrEqual(20);
    expect(CH4_ART['mon.dust.moth']!.size.h).toBeLessThanOrEqual(20);
    expect(CH4_ART['mon.windup.robot']!.size.w).toBeLessThanOrEqual(20);
    expect(CH4_ART['mon.windup.robot']!.size.h).toBeLessThanOrEqual(20);
    expect(CH4_ART['mon.box.fort.knight']!.size.w).toBeLessThanOrEqual(28);
    expect(CH4_ART['mon.box.fort.knight']!.size.h).toBeLessThanOrEqual(28);
    expect(CH4_ART['mon.vacuum.beast']!.size.w).toBeLessThanOrEqual(56);
    expect(CH4_ART['mon.vacuum.beast']!.size.h).toBeLessThanOrEqual(56);
  });

  it('ensures boss has the required boss animations with correct frame counts', () => {
    const boss = CH4_ART['mon.vacuum.beast']!;
    expect(boss.frames.idle).toHaveLength(4);
    expect(boss.frames.windup).toHaveLength(3);
    expect(boss.frames.attack).toHaveLength(4);
    expect(boss.frames.hit).toHaveLength(1);
    expect(boss.frames.defeat).toHaveLength(6);
  });
});
