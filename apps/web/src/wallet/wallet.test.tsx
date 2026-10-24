// @vitest-environment jsdom
import { FUJI_CHAIN_ID } from '@taskbar-hero/chain';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { parseSiweMessage } from 'viem/siwe';
import { avalanche } from 'viem/chains';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createConfig, http } from 'wagmi';
import { injected, mock } from 'wagmi/connectors';
import { createMockAuthApi, type AuthApi } from './authApi';
import { fuji, makeFujiChain } from './config';
import { createSessionStore } from './session';
import { CORE_INSTALL_URL, NO_WALLET_HINT, WalletButton } from './WalletButton';
import { WalletProvider } from './WalletProvider';

const ACCOUNT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const;

function makeConfig(startOnFuji: boolean) {
  const chains = startOnFuji ? ([fuji, avalanche] as const) : ([avalanche, fuji] as const);
  return createConfig({
    chains,
    connectors: [mock({ accounts: [ACCOUNT] })],
    transports: { [fuji.id]: http(), [avalanche.id]: http() },
  });
}

function setup(opts: { startOnFuji?: boolean; api?: AuthApi } = {}) {
  window.sessionStorage.clear();
  const store = createSessionStore();
  const api = opts.api ?? createMockAuthApi();
  render(
    <WalletProvider config={makeConfig(opts.startOnFuji ?? true)} api={api} store={store}>
      <WalletButton />
    </WalletProvider>,
  );
  return { store, api };
}

// The mock connector forwards signing to an RPC node (eth_sign); answer it with a fake signature.
const FAKE_SIGNATURE = `0x${'11'.repeat(65)}`;
beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? '{}')) as { id?: number };
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id ?? 1, result: FAKE_SIGNATURE }), {
      headers: { 'content-type': 'application/json' },
    });
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('uses Fuji and honours a custom RPC', () => {
  expect(fuji.id).toBe(FUJI_CHAIN_ID);
  expect(makeFujiChain('https://rpc.example').rpcUrls.default.http).toEqual(['https://rpc.example']);
});

it('connecting shows the short address and a Sign in button', async () => {
  setup();
  fireEvent.click(await screen.findByRole('button', { name: 'Connect wallet' }));
  expect(await screen.findByText('0x7099…79C8')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
});

it('shows a switch prompt on the wrong network', async () => {
  setup({ startOnFuji: false });
  fireEvent.click(await screen.findByRole('button', { name: 'Connect wallet' }));
  expect((await screen.findByRole('alert')).textContent).toMatch(/Wrong network/);
  fireEvent.click(screen.getByRole('button', { name: 'Switch to Fuji' }));
  expect(await screen.findByRole('button', { name: 'Sign in' })).toBeTruthy();
});

it('signs in with a valid SIWE message and stores the session', async () => {
  const api = createMockAuthApi();
  const verify = vi.spyOn(api, 'verify');
  const { store } = setup({ api });
  fireEvent.click(await screen.findByRole('button', { name: 'Connect wallet' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
  await screen.findByText(/Signed in/);

  const { message, signature } = verify.mock.calls[0]![0];
  const parsed = parseSiweMessage(message);
  expect(parsed.domain).toBe(window.location.host);
  expect(parsed.chainId).toBe(FUJI_CHAIN_ID);
  expect(parsed.nonce).toBe('mocknonce00000001');
  expect(parsed.address).toBe(ACCOUNT);
  expect(parsed.version).toBe('1');
  expect(parsed.uri).toBe(window.location.origin);
  expect(parsed.expirationTime!.getTime() - parsed.issuedAt!.getTime()).toBe(10 * 60 * 1000);
  expect(signature).toBe(FAKE_SIGNATURE);

  const s = store.get()!;
  expect(s.wallet.toLowerCase()).toBe(ACCOUNT.toLowerCase());
  expect(s.token).toBeTruthy();
  expect(s.expiresAt).toBeGreaterThan(Date.now());
  expect(window.sessionStorage.getItem('taskbar-hero.session')).toContain(s.token);
});

it('disconnect clears the session', async () => {
  const { store } = setup();
  fireEvent.click(await screen.findByRole('button', { name: 'Connect wallet' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
  await screen.findByText(/Signed in/);
  fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeTruthy());
  expect(store.get()).toBeNull();
  expect(window.sessionStorage.getItem('taskbar-hero.session')).toBeNull();
});

it('session store survives broken storage and drops expired sessions', () => {
  const broken = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); }, removeItem: () => { throw new Error('x'); } } as unknown as Storage;
  const s = createSessionStore(broken);
  s.set({ token: 't', playerId: 'p', wallet: 'w', expiresAt: Date.now() + 1000 });
  expect(s.get()?.token).toBe('t');
  s.clear();
  expect(s.get()).toBeNull();
});

it('without a browser wallet the button links to core.app and says which wallets work', () => {
  window.sessionStorage.clear();
  const config = createConfig({ chains: [fuji], connectors: [injected()], transports: { [fuji.id]: http() } });
  render(
    <WalletProvider config={config} api={createMockAuthApi()} store={createSessionStore()}>
      <WalletButton />
    </WalletProvider>,
  );
  const link = screen.getByRole('link', { name: 'Get a browser wallet' });
  expect(link.getAttribute('href')).toBe(CORE_INSTALL_URL);
  expect(link.getAttribute('title')).toBe(NO_WALLET_HINT);
  expect(NO_WALLET_HINT).toMatch(/Core, MetaMask/);
  expect(NO_WALLET_HINT).toMatch(/Chrome, Brave or Edge/);
});
