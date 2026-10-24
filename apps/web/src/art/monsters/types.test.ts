import { describe, expect, it } from 'vitest';
import { monsterArtProblems, type MonsterArt } from './types';

const rows = (w: number, h: number) => Array.from({ length: h }, (_, y) => (y === h - 1 ? 'k'.repeat(w) : '.'.repeat(w)));
const good: MonsterArt = {
  id: 'mon.test.blob',
  kind: 'regular',
  size: { w: 10, h: 10 },
  palette: { k: 0x000000 },
  frames: { walk: [rows(10, 10), rows(10, 10)], hit: [rows(10, 10)], defeat: [rows(10, 10), rows(10, 10), rows(10, 10)] },
};

describe('monsterArtProblems', () => {
  it('accepts art that follows the format', () => {
    expect(monsterArtProblems(good)).toEqual([]);
  });
  it('reports a wrong id, a missing animation and a wrong frame count', () => {
    expect(monsterArtProblems({ ...good, id: 'Blob' })).toHaveLength(1);
    expect(monsterArtProblems({ ...good, frames: { ...good.frames, hit: undefined } }).join()).toContain('missing hit');
    expect(monsterArtProblems({ ...good, frames: { ...good.frames, defeat: [rows(10, 10)] } }).join()).toContain('defeat has 1 frames');
  });
  it('reports rows of the wrong width, unknown characters and an empty bottom row', () => {
    const bad = { ...good, frames: { ...good.frames, hit: [['.'.repeat(9), ...rows(10, 10).slice(1)]] } };
    expect(monsterArtProblems(bad).join()).toContain('width 9');
    const unknown = { ...good, frames: { ...good.frames, hit: [['x'.repeat(10), ...rows(10, 10).slice(1)]] } };
    expect(monsterArtProblems(unknown).join()).toContain("'x' is not in the palette");
    const floating = { ...good, frames: { ...good.frames, hit: [Array.from({ length: 10 }, () => '.'.repeat(10))] } };
    expect(monsterArtProblems(floating).join()).toContain('bottom row is empty');
  });
  it('rejects a frame over the size limit for its kind', () => {
    expect(monsterArtProblems({ ...good, size: { w: 24, h: 24 }, frames: {} }).join()).toContain('over the 20px limit');
  });
});
