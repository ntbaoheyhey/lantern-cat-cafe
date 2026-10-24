import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, filtersFromQuery, previewGrid, visualsFor } from './previewGrid';

describe('previewGrid', () => {
  it('covers class x armor set x rarity x animation when nothing is filtered', () => {
    const g = previewGrid({ cls: 'all', gear: 'all', rarity: 'all', anim: 'all' });
    expect(g.rows).toHaveLength(7 * 2 * 5);
    expect(g.anims).toHaveLength(6);
    expect(new Set(g.rows.map((r) => r.label)).size).toBe(g.rows.length);
  });

  it('narrows each axis with its filter', () => {
    const g = previewGrid({ cls: 'rogue', gear: 'cozy', rarity: 'all', anim: 'attack' });
    expect(g.rows.map((r) => r.rarity)).toEqual(['common', 'uncommon', 'rare', 'epic', 'legendary']);
    expect(g.anims).toEqual(['attack']);
  });

  it('dresses a row in the starter weapon plus the chosen set', () => {
    expect(visualsFor('archer', 'none', 'epic')).toEqual({ weapon: { set: 'bow.basic', rarity: 'epic' } });
    expect(visualsFor('archer', 'cozy', 'epic').boots).toEqual({ set: 'cozy', rarity: 'epic' });
  });

  it('reads filters from the URL and ignores unknown values', () => {
    expect(filtersFromQuery(new URLSearchParams('cls=witch&anim=defeat&rarity=nope'))).toEqual({
      ...DEFAULT_FILTERS, cls: 'witch', anim: 'defeat',
    });
  });
});
