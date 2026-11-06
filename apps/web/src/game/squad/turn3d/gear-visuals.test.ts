import { expect, it } from 'vitest';
import { SQUAD_ITEMS } from '@taskbar-hero/game-rules/src/squad/gear/catalog';
import { UNIQUES } from '@taskbar-hero/game-rules/src/cardrpg/depth/equipment';
import { GearResources } from './gear-visuals';

it('builds twelve distinct named heirlooms with finite geometry on all four sockets', () => {
  const resources = new GearResources();
  const signatures = new Set<string>();
  const base = SQUAD_ITEMS.find(item => item.slot === 'weapon' && item.fit.includes('guardian'))!;
  for (const design of UNIQUES) {
    for (const slot of ['weapon', 'outfit', 'charm', 'relic'] as const) {
      const piece = resources.acquire({ ...base, slot, rarity: 'Legendary', cardDesign: design.id }, 'guardian');
      expect(piece.group.userData.cardDesign).toBe(design.id);
      expect(piece.group.children).toHaveLength(1);
      expect(piece.geometry.attributes.position!.count).toBeGreaterThan(30);
      expect(Array.from(piece.geometry.attributes.position!.array).every(Number.isFinite)).toBe(true);
      if (slot === 'weapon') signatures.add(JSON.stringify(Array.from(piece.geometry.attributes.position!.array)));
    }
  }
  expect(signatures.size).toBe(12);
  resources.dispose();
});

it('reuses prepared geometry and keeps ordinary equipment and unknown descriptors usable', () => {
  const resources = new GearResources();
  const base = SQUAD_ITEMS[0]!;
  const first = resources.acquire(base, 'guardian');
  const second = resources.acquire(base, 'guardian');
  expect(second.geometry).toBe(first.geometry);
  expect(second.material).toBe(first.material);
  expect(second.group).not.toBe(first.group);
  const unknown = resources.acquire({ ...base, cardDesign: 'future-keepsake' }, 'guardian');
  expect(unknown.geometry.attributes.position!.count).toBe(first.geometry.attributes.position!.count);
  resources.dispose();
});
