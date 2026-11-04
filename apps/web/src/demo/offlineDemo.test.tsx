import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FUJI_CHAIN_ID } from '@taskbar-hero/chain';
import { makeWagmiConfig } from '../wallet/config';
import { WalletButton } from '../wallet/WalletButton';
import { FujiProofPanel } from '../chain-proof/FujiProofPanel';
import { MarketTab } from '../market/MarketTab';
import { createSessionStore } from '../wallet/session';
import { bossGateStatus } from '../layout/boss/bossGate';
import { MockGameApiV2, MOCK_V2_STORAGE_KEY } from '../api/MockGameApiV2';
import { currentDemoProfile, offlineStorage, resetDemoProfile } from './profiles';

beforeEach(() => {
  vi.stubEnv('VITE_OFFLINE_DEMO', '1');
  localStorage.clear(); sessionStorage.clear();
  offlineStorage.removeItem('profile'); offlineStorage.removeItem(MOCK_V2_STORAGE_KEY);
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it('has no connectors, no persistent wallet state, and a transport that cannot reach the network', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  const config = makeWagmiConfig();
  expect(config.connectors).toHaveLength(0);
  expect(config.storage).toBeNull();
  await expect(config.getClient({ chainId: FUJI_CHAIN_ID }).request({ method: 'eth_chainId' })).rejects.toThrow('Chain access is disabled');
  expect(fetch).not.toHaveBeenCalled();
});

it('renders wallet, market and proof without mounting any connected hooks or providers', () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  render(<><WalletButton /><MarketTab /><FujiProofPanel enabled /></>);
  expect(screen.getByText('Offline guest · wallet disabled')).toBeTruthy();
  expect(screen.getByText(/Listings and ownership are unavailable/)).toBeTruthy();
  expect(screen.getByText(/Deployed-code, linkage, listings and event checks: Unavailable offline/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: /connect|sign|mint|buy|refresh/i })).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

it('ignores a stored authenticated session when storage is explicitly disabled', () => {
  const session = { token: 'test-only', playerId: 'p', wallet: '0x1', expiresAt: Date.now() + 3600000 };
  sessionStorage.setItem('taskbar-hero.session', JSON.stringify(session));
  const isolated = createSessionStore(null);
  expect(isolated.get()).toBeNull();
  isolated.set({ ...session, playerId: 'local' });
  expect(JSON.parse(sessionStorage.getItem('taskbar-hero.session')!).playerId).toBe('p');
});

it('loads valid rule-built tour gear without replacing a normal guest save', async () => {
  localStorage.setItem(MOCK_V2_STORAGE_KEY, 'normal-guest-save');
  resetDemoProfile('tour');
  const api = new MockGameApiV2({ storage: offlineStorage });
  const state = await api.getState();
  expect(currentDemoProfile()).toBe('tour');
  expect(state.cat.level).toBe(20);
  expect(state.inventory.some(item => !item.equipped)).toBe(true);
  expect(state.bosses.chapters.find(chapter => chapter.chapter === 1)?.cleared).toBe(true);
  expect(localStorage.getItem(MOCK_V2_STORAGE_KEY)).toBe('normal-guest-save');
});

it('restarts into a genuinely unchosen fresh guest and can restore the boss sample', async () => {
  resetDemoProfile('fresh');
  const fresh = await new MockGameApiV2({ storage: offlineStorage }).getState();
  expect(fresh.cat.classId).toBeNull(); expect(fresh.cat.level).toBe(1);
  expect(fresh.inventory).toHaveLength(0);
  resetDemoProfile('boss');
  const boss = await new MockGameApiV2({ storage: offlineStorage }).getState();
  expect(currentDemoProfile()).toBe('boss');
  expect(boss.currencies.keys).toBe(1);
  expect(bossGateStatus(boss, 1, Math.floor(Date.now() / 1000)).kind).toBe('ready');
});

it('keeps the sample playable in memory when browser storage is denied', async () => {
  vi.stubGlobal('localStorage', { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } });
  resetDemoProfile('tour');
  const state = await new MockGameApiV2({ storage: offlineStorage }).getState();
  expect(state.cat.level).toBe(20);
  expect(state.inventory.some(item => !item.equipped)).toBe(true);
});
