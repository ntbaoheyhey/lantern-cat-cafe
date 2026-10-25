import { afterEach, expect, it, vi } from 'vitest';
import { isGameV2 } from './flag';
afterEach(() => vi.unstubAllEnvs());
it('defaults to v2 when the build variable is absent or empty', () => {
  vi.stubEnv('VITE_GAME_V2', undefined); expect(isGameV2()).toBe(true);
  vi.stubEnv('VITE_GAME_V2', ''); expect(isGameV2()).toBe(true);
});
it('keeps an explicit 0 as the classic rollback switch', () => {
  vi.stubEnv('VITE_GAME_V2', '0'); expect(isGameV2()).toBe(false);
  vi.stubEnv('VITE_GAME_V2', '1'); expect(isGameV2()).toBe(true);
});
