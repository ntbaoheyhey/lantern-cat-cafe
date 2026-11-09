import { expect, it } from 'vitest';
import { StableLabelLayout } from './look-label-layout';
import { intersects } from './label-layout';
const label = { id: 'cup', x: 200, y: 120, height: 30, head: { x: 180, y: 128, width: 50, height: 80 } };
it('reuses safe plates across small idle motion and invalidates roster or viewport changes', () => {
 const cache = new StableLabelLayout();
 const first = cache.resolve([label], 600, 320, 138, []);
 expect(cache.resolve([{ ...label, x: 203 }], 600, 320, 138, [])).toBe(first);
 expect(cache.resolve([label], 610, 320, 138, [])).not.toBe(first);
 expect(cache.resolve([], 610, 320, 138, []).size).toBe(0);
});
it('never reuses a plate when a moving face enters its safety margin', () => {
 const cache = new StableLabelLayout(), first = cache.resolve([label], 600, 320, 138, []);
 const face = { ...first.get('cup')!, width: 50, height: 30 };
 const next = cache.resolve([label], 600, 320, 138, [face]);
 expect(next).not.toBe(first);
 for (const box of next.values()) expect(intersects(box, face, 5)).toBe(false);
});
