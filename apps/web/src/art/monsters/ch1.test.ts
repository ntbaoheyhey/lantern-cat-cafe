import { describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { CH1_ART } from './ch1';
import { monsterArtProblems } from './types';

describe('CH1 Monster Art', () => {
  const ch1Monsters = v2.MONSTERS.filter((m) => m.chapter === 1);
  const ch1Ids = ch1Monsters.map((m) => m.id);

  it('contains exactly the registry ids for chapter 1', () => {
    expect(Object.keys(CH1_ART).sort()).toEqual([...ch1Ids].sort());
    expect(Object.keys(CH1_ART)).toHaveLength(5);
  });

  it('follows the monsterArt format with zero problems for each monster', () => {
    for (const [id, art] of Object.entries(CH1_ART)) {
      const problems = monsterArtProblems(art);
      expect(problems, `Monster ${id} has art problems: ${problems.join('; ')}`).toEqual([]);
    }
  });

  it('ensures no two monsters share identical walk frame 0', () => {
    const walk0s = Object.entries(CH1_ART).map(([id, art]) => {
      const frame0 = art.frames.walk?.[0];
      expect(frame0, `Monster ${id} should have walk frame 0`).toBeDefined();
      return frame0!.join('\n');
    });

    const uniqueWalk0s = new Set(walk0s);
    expect(uniqueWalk0s.size).toBe(Object.keys(CH1_ART).length);
  });

  it('matches monster kind with the game-rules roster', () => {
    for (const m of ch1Monsters) {
      expect(CH1_ART[m.id]?.kind).toBe(m.kind);
    }
  });
});
