import { afterEach, expect, it, vi } from 'vitest';
import { isLookV2, setLookV2, subscribeLookV2 } from './look-v2';

afterEach(() => { delete window.__LOOK_V2__; delete document.documentElement.dataset.lookV2; });
it('defaults off and notifies only on a real visual change', () => {
  const listener = vi.fn(); const stop = subscribeLookV2(listener);
  expect(isLookV2()).toBe(false);
  setLookV2(true); setLookV2(true);
  expect(isLookV2()).toBe(true);
  expect(document.documentElement.dataset.lookV2).toBe('true');
  expect(listener).toHaveBeenCalledTimes(1);
  setLookV2(false); expect(listener).toHaveBeenCalledTimes(2);
  stop(); setLookV2(true); expect(listener).toHaveBeenCalledTimes(2);
});
