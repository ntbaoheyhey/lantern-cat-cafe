import { v2 } from '@taskbar-hero/game-rules';
import { describe, expect, it } from 'vitest';
import { BACKDROPS, backdropFor } from './index';
import { backdropProblems } from './types';

describe('BACKDROPS registry and backdrops', () => {
  it('backdropProblems(art) is [] for all five backdrops', () => {
    for (const [id, art] of Object.entries(BACKDROPS)) {
      const problems = backdropProblems(art);
      expect(problems, `${id} had problems: ${problems.join('; ')}`).toEqual([]);
    }
  });

  it('Object.keys(BACKDROPS) equals the five CHAPTERS background ids', () => {
    const chapterBackgroundIds = v2.CHAPTERS.map((c) => c.background);
    expect(Object.keys(BACKDROPS).sort()).toEqual([...chapterBackgroundIds].sort());
  });

  it('backdropFor(1..5) returns the matching id and backdropFor(99) returns livingroom', () => {
    for (let chapter = 1; chapter <= 5; chapter++) {
      const expectedId = v2.CHAPTERS.find((c) => c.index === chapter)?.background;
      expect(backdropFor(chapter).id).toBe(expectedId);
    }
    expect(backdropFor(99).id).toBe('livingroom');
  });

  it('no two backdrops have identical far rows', () => {
    const entries = Object.entries(BACKDROPS);
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const entryA = entries[i];
        const entryB = entries[j];
        if (entryA && entryB) {
          const [idA, artA] = entryA;
          const [idB, artB] = entryB;
          expect(artA.far.rows, `${idA} and ${idB} have identical far rows`).not.toEqual(
            artB.far.rows,
          );
        }
      }
    }
  });
});
