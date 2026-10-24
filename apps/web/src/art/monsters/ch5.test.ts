import { describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { monsterArtProblems } from './types';
import { CH5_ART } from './ch5';

describe('CH5 Monster Art', () => {
  const ch5Monsters = v2.MONSTERS.filter((m) => m.chapter === 5);
  const ch5Ids = ch5Monsters.map((m) => m.id);

  it('contains exactly the registry ids for chapter 5', () => {
    expect(ch5Ids).toEqual([
      'mon.shadow.crow',
      'mon.moth.swarm',
      'mon.neon.dot',
      'mon.chimney.ghost',
      'mon.laser.dot.phantom',
    ]);
    expect(Object.keys(CH5_ART).sort()).toEqual([...ch5Ids].sort());
    expect(Object.keys(CH5_ART)).toHaveLength(5);
  });

  it('matches monster kind with the game-rules roster', () => {
    for (const def of ch5Monsters) {
      expect(CH5_ART[def.id]?.kind).toBe(def.kind);
    }
  });

  it('follows the monsterArt format with zero problems for each monster', () => {
    for (const [id, art] of Object.entries(CH5_ART)) {
      const problems = monsterArtProblems(art);
      expect(problems, `Monster ${id} has art problems: ${problems.join('; ')}`).toEqual([]);
    }
  });

  it('ensures each monster palette has dark outline k plus 3 to 6 colors', () => {
    for (const [id, art] of Object.entries(CH5_ART)) {
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
    const walk0s = Object.entries(CH5_ART).map(([id, art]) => {
      const frame0 = art.frames.walk?.[0];
      expect(frame0, `Monster ${id} should have walk frame 0`).toBeDefined();
      return frame0!.join('\n');
    });

    const uniqueWalk0s = new Set(walk0s);
    expect(uniqueWalk0s.size).toBe(Object.keys(CH5_ART).length);
  });

  it('ensures regular monsters are <= 20x20, elite <= 28x28, and boss <= 56x56', () => {
    expect(CH5_ART['mon.shadow.crow']!.size.w).toBeLessThanOrEqual(20);
    expect(CH5_ART['mon.shadow.crow']!.size.h).toBeLessThanOrEqual(20);
    expect(CH5_ART['mon.moth.swarm']!.size.w).toBeLessThanOrEqual(20);
    expect(CH5_ART['mon.moth.swarm']!.size.h).toBeLessThanOrEqual(20);
    expect(CH5_ART['mon.neon.dot']!.size.w).toBeLessThanOrEqual(20);
    expect(CH5_ART['mon.neon.dot']!.size.h).toBeLessThanOrEqual(20);
    expect(CH5_ART['mon.chimney.ghost']!.size.w).toBeLessThanOrEqual(28);
    expect(CH5_ART['mon.chimney.ghost']!.size.h).toBeLessThanOrEqual(28);
    expect(CH5_ART['mon.laser.dot.phantom']!.size.w).toBeLessThanOrEqual(56);
    expect(CH5_ART['mon.laser.dot.phantom']!.size.h).toBeLessThanOrEqual(56);
  });

  it('ensures boss has the required boss animations with correct frame counts', () => {
    const boss = CH5_ART['mon.laser.dot.phantom']!;
    expect(boss.frames.idle).toHaveLength(4);
    expect(boss.frames.windup).toHaveLength(3);
    expect(boss.frames.attack).toHaveLength(4);
    expect(boss.frames.hit).toHaveLength(1);
    expect(boss.frames.defeat).toHaveLength(6);
  });
});
