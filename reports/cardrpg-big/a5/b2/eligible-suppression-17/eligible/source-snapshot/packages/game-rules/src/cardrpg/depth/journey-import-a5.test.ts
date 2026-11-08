// Equipment can be the first imported module (for example in a miniature preview).
// Keep this entry order: the barrel entry masks the equipment/state/journey cycle.
import { SETS } from './equipment';
import { discoveryIdsV4 } from './journey-v4';
import { expect, it } from 'vitest';

it('loads discovery catalogs when equipment is imported before the rules barrel', () => {
  expect(SETS).toHaveLength(8);
  const ids = discoveryIdsV4();
  expect(ids).toContain('set:bellsteel');
  expect(ids).toContain('legendary:first');
  expect(ids).toContain('rank:mochi:2');
  expect(new Set(ids).size).toBe(ids.length);
});
