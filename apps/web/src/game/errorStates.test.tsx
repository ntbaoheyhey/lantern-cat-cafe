// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { GameApiError, type GameApi } from '../api/GameApi';
import { MockGameApi, type MockGameApiOptions } from '../api/MockGameApi';
import { BossTab } from '../boss/BossTab';
import { ForgeTab } from '../forge/ForgeTab';
import { InventoryTab } from '../inventory/InventoryTab';
import { GameLoop } from './gameState';
import { GENERIC_TEXT, OFFLINE_TEXT, SESSION_TEXT } from './LoadNotice';

vi.mock('wagmi', () => ({
  useAccount: () => ({ isConnected: false, chainId: 43113, address: undefined }),
  useSwitchChain: () => ({ switchChain: vi.fn(), isPending: false }),
  useWriteContract: () => ({ writeContractAsync: vi.fn() }),
  usePublicClient: () => undefined,
}));

const FAILED_LOAD = "Mochi couldn't reach the café just now.";

let loop: GameLoop | null = null;

beforeEach(() => localStorage.clear());
afterEach(() => {
  loop?.stop();
  loop = null;
  cleanup();
  vi.unstubAllGlobals();
});

/** The mock API, except `getState` fails while `down.load` is set and each action fails with `down.action`. */
function flakyApi(opts: MockGameApiOptions = {}) {
  const mock = new MockGameApi(opts);
  const down: { load: boolean; action: unknown } = { load: false, action: null };
  const act = <T,>(run: () => Promise<T>) => async () => {
    if (down.action) throw down.action;
    return run();
  };
  const api: GameApi = {
    getState: async () => {
      if (down.load) throw new GameApiError('server_error', 'game-state failed (503)');
      return mock.getState();
    },
    claim: () => mock.claim(),
    equip: async (id) => (down.action ? Promise.reject(down.action) : mock.equip(id)),
    fightBoss: act(() => mock.fightBoss()),
    upgrade: async (id) => (down.action ? Promise.reject(down.action) : mock.upgrade(id)),
    forgeRelic: act(() => mock.forgeRelic()),
    reportMint: (n, h) => mock.reportMint(n, h),
  };
  return { api, down, mock };
}

async function startLoop(api: GameApi) {
  loop = new GameLoop({ api });
  await loop.start(document);
  return loop;
}

const tabs = {
  inventory: (api: GameApi, l: GameLoop) => <InventoryTab api={api} loop={l} />,
  boss: (api: GameApi, l: GameLoop) => <BossTab api={api} loop={l} />,
  forge: (api: GameApi, l: GameLoop) => <ForgeTab api={api} loop={l} demo={false} />,
} as const;

for (const [name, view] of Object.entries(tabs)) {
  it(`${name} tab: a failed first load shows a plain message and Retry, then recovers`, async () => {
    const { api, down } = flakyApi();
    down.load = true;
    const l = await startLoop(api);
    render(view(api, l));

    expect(screen.getByRole('alert').textContent).toBe(FAILED_LOAD);
    expect(screen.queryByText(/server_error|503/)).toBeNull();

    down.load = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(screen.queryByText(/fetching/)).toBeNull();
  });
}

it('a tab shows the waiting message, not an error, while the first load is still in flight', () => {
  loop = new GameLoop({ api: new MockGameApi() });
  render(<InventoryTab api={new MockGameApi()} loop={loop} />);
  expect(screen.getByText('Mochi is fetching your bag…')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('the loop keeps running after a failed load and the snapshot says so', async () => {
  const { api, down } = flakyApi();
  down.load = true;
  const l = await startLoop(api);
  expect(l.getSnapshot()).toMatchObject({ server: null, loadFailed: true, paused: false });
  down.load = false;
  await l.retry();
  expect(l.getSnapshot()).toMatchObject({ loadFailed: false });
  expect(l.getSnapshot().server).not.toBeNull();
});

it('inventory: a failed equip shows a plain message and Retry that tries again', async () => {
  const { api, down, mock } = flakyApi({ inventory: [{ slot: 'weapon', rarity: 'epic', level: 5 }] });
  const equip = vi.spyOn(mock, 'equip');
  const l = await startLoop(api);
  render(tabs.inventory(api, l));
  down.action = new GameApiError('server_error', 'equip failed (500)');
  fireEvent.click(screen.getByRole('button', { name: 'Equip Epic Feather Wand, level 5' }));

  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain(GENERIC_TEXT));
  expect(screen.queryByText(/server_error|500/)).toBeNull();

  down.action = null;
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(equip).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
});

it('boss: a failed fight shows a plain message and Retry that starts the fight', async () => {
  const { api, down, mock } = flakyApi();
  const fight = vi.spyOn(mock, 'fightBoss');
  const l = await startLoop(api);
  render(tabs.boss(api, l));
  down.action = new TypeError('Failed to fetch');
  fireEvent.click(screen.getByRole('button', { name: 'Fight' }));

  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain(GENERIC_TEXT));
  down.action = null;
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(fight).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
});

it('forge: a failed forge shows a plain message and Retry', async () => {
  const { api, down, mock } = flakyApi({ start: { shards: 100, bossKeys: 1 } });
  const forge = vi.spyOn(mock, 'forgeRelic');
  const l = await startLoop(api);
  render(tabs.forge(api, l));
  down.action = new GameApiError('server_error', 'relic-forge failed (502)');
  fireEvent.click(screen.getByRole('button', { name: 'Forge' }));

  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain(GENERIC_TEXT));
  expect(screen.queryByText(/server_error|502/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  down.action = null;
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(forge).toHaveBeenCalledTimes(1));
});

it('an ended session says to sign in again and offers no Retry', async () => {
  const { api, down } = flakyApi();
  const l = await startLoop(api);
  render(tabs.boss(api, l));
  down.action = new GameApiError('unauthenticated');
  fireEvent.click(screen.getByRole('button', { name: 'Fight' }));

  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(SESSION_TEXT));
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
});

it('while the browser is offline the message says to check the connection', async () => {
  vi.stubGlobal('navigator', { ...navigator, onLine: false });
  const { api, down } = flakyApi();
  const l = await startLoop(api);
  render(tabs.boss(api, l));
  down.action = new GameApiError('server_error', 'Failed to fetch');
  fireEvent.click(screen.getByRole('button', { name: 'Fight' }));

  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain(OFFLINE_TEXT));
  expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
});

it('known game answers keep their own wording and offer no Retry', async () => {
  const { api, down } = flakyApi();
  const l = await startLoop(api);
  render(tabs.boss(api, l));
  down.action = new GameApiError('no_attempts_left');
  fireEvent.click(screen.getByRole('button', { name: 'Fight' }));

  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('No attempts left today.'));
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
});
