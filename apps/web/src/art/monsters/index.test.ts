import { describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { MONSTER_ART, monsterArt, monsterArtProblems } from './index';

describe('MONSTER_ART registry', () => {
  it('has every key equal to its art id', () => {
    for (const [key, art] of Object.entries(MONSTER_ART)) {
      expect(art.id).toBe(key);
    }
  });

  it('has monsterArtProblems returning empty array for all registered monsters', () => {
    for (const art of Object.values(MONSTER_ART)) {
      const problems = monsterArtProblems(art);
      expect(problems).toEqual([]);
    }
  });

  it('resolves every boss id of a chapter whose file is present', () => {
    for (const ch of v2.CHAPTERS) {
      if (ch.boss) {
        const art = monsterArt(ch.boss);
        expect(art).not.toBeNull();
        expect(art?.id).toBe(ch.boss);
        expect(art?.kind).toBe('boss');
      }
    }
  });

  it('returns null for an unknown monster id', () => {
    expect(monsterArt('mon.nonexistent.monster')).toBeNull();
  });
});
