// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const SESSION = {
  token: 'jwt-1',
  playerId: 'p1',
  wallet: '0x' + '1'.repeat(40),
  expiresAt: Date.now() + 3_600_000,
};

beforeEach(() => {
  sessionStorage.clear();
  vi.resetModules();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

/** Fresh copies of the store singletons, read with the current env and sessionStorage. */
async function load() {
  const store = await import('./store');
  const { MockGameApi } = await import('../api/MockGameApi');
  const { DemoNote } = await import('./DemoNote');
  return { ...store, MockGameApi, DemoNote };
}

it('getGameApi() is the server with a stored session and the env set, and shows no demo note', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://proj.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-1');
  sessionStorage.setItem('taskbar-hero.session', JSON.stringify(SESSION));
  const { getGameApi, MockGameApi, DemoNote } = await load();
  expect(getGameApi()).not.toBeInstanceOf(MockGameApi);
  render(<DemoNote />);
  expect(screen.queryByTestId('demo-note')).toBeNull();
});

it('getGameApi() is the demo mock without a session, with demo items and the demo note', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://proj.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-1');
  const { getGameApi, MockGameApi, DemoNote } = await load();
  const api = getGameApi();
  expect(api).toBeInstanceOf(MockGameApi);
  expect((await api.getState()).inventory.some((g) => !g.equipped)).toBe(true); // vitest runs with DEV on
  render(<DemoNote />);
  expect(screen.getByTestId('demo-note').textContent).toBe('Demo mode, sign in to save progress.');
});

it('getGameApi() is the demo mock when the env is missing, even with a session', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', '');
  sessionStorage.setItem('taskbar-hero.session', JSON.stringify(SESSION));
  const { getGameApi, MockGameApi } = await load();
  expect(getGameApi()).toBeInstanceOf(MockGameApi);
});
