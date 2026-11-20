import { describe, expect, it, vi } from 'vitest';
import { ImpactPool, type ImpactInk } from './impact';
function harness() {
  const ink: ImpactInk = { clear: vi.fn(() => ink), fillStyle: vi.fn(() => ink), fillRect: vi.fn(() => ink), destroy: vi.fn() };
  return { pool: new ImpactPool(ink), ink };
}
describe('cosmetic impact budget', () => {
  it('caps repeated bursts at sixteen native, integer pixels and expires them', () => {
    const { pool, ink } = harness();
    for (let i = 0; i < 40; i++) pool.burst(100, 60, true);
    pool.update(16);
    expect(ink.fillRect).toHaveBeenCalledTimes(16);
    for (const [x, y, width, height] of vi.mocked(ink.fillRect).mock.calls) {
      expect(Number.isInteger(x) && Number.isInteger(y)).toBe(true); expect([width, height]).toEqual([1, 1]);
    }
    for (let i = 0; i < 30; i++) pool.update(16);
    vi.mocked(ink.fillRect).mockClear(); pool.update(16); expect(ink.fillRect).not.toHaveBeenCalled();
  });
  it('releases presentation on cleanup and never changes its inputs', () => {
    const { pool, ink } = harness(); pool.burst(30, 50, false); pool.clear(); pool.update(16);
    expect(ink.fillRect).not.toHaveBeenCalled(); pool.destroy(); expect(ink.destroy).toHaveBeenCalledOnce();
  });
});
