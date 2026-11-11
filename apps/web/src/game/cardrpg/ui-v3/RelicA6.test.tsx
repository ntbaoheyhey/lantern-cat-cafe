import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { DepthModel } from '../depth/model';
import { RelicReadError } from '../depth/relic-reader';
import { RelicA6 } from './RelicA6';
import ShellV3 from './ShellV3';
const rpc = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('../depth/relic-reader', async importOriginal => ({ ...await importOriginal<typeof import('../depth/relic-reader')>(), readConnectedRelics: rpc.read }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); rpc.read.mockReset(); });
it('equips a demo team treasure and restores an empty slot without touching cat gear', () => {
  const m = new DepthModel(true, true, true, true); render(<RelicA6 m={m}/>);
  expect(screen.getAllByRole('button', { name: 'Load demo relics first' })).toHaveLength(4);
  fireEvent.click(screen.getByRole('button', { name: 'Load demo relics' }));
  expect(screen.getByText('Choose a keepsake from your collection.')).toBeTruthy();
  const gear = JSON.stringify(m.state.equipment);
  fireEvent.click(screen.getByRole('button', { name: 'Equip Legendary lantern cup' }));
  expect(screen.getByText('Team bonus +8%')).toBeTruthy(); expect(JSON.stringify(m.state.equipment)).toBe(gear);
  expect(screen.getByRole('link', { name: 'Relic Fuji ↗' }).getAttribute('href')).toContain(R.FUJI_RELIC_ADDRESS);
  fireEvent.click(screen.getByRole('button', { name: 'Unequip treasure' }));
  expect(screen.getByText('Team bonus +0%')).toBeTruthy();
});
it('offers no fixture in product and keeps the game available when no wallet exists', async () => {
  const m = new DepthModel(false, true, true, true); render(<RelicA6 m={m}/>);
  expect(screen.queryByRole('button', { name: 'Load demo relics' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Read connected wallet' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('You can keep playing'));
  expect(m.state.relics).toEqual([]); expect(rpc.read).not.toHaveBeenCalled();
});
it('keeps provider diagnostics out of the keepsake status and allows a clean retry', async () => {
  vi.stubGlobal('ethereum', { on: vi.fn(), removeListener: vi.fn() });
  const m = new DepthModel(false, true, true, true);
  rpc.read.mockRejectedValueOnce(Error('Provider unavailable. Request details: ' + '0xabcdef'.repeat(500)));
  rpc.read.mockResolvedValueOnce({ chainId: 43113, block: '42', holdings: R.RELIC_FIXTURE });
  const before = structuredClone(m.state); render(<RelicA6 m={m}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Read connected wallet' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Could not read your Fuji collection. Try again; you can keep playing.'));
  expect(screen.getAllByRole('button', { name: 'Read wallet first' })).toHaveLength(4);
  expect(screen.queryByText(/Request details/)).toBeNull(); expect(m.state).toEqual(before);
  fireEvent.click(screen.getByRole('button', { name: 'Read connected wallet' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Collection read at Fuji block 42. Choose one keepsake.'));
  expect(m.state.relics).toEqual([1,2,3,4]); expect(m.state.selectedRelic).toBeNull();
  expect(screen.getByText('Choose a keepsake from your collection.')).toBeTruthy();
});
it('does not announce a successful collection when its attributes were rejected', async () => {
  vi.stubGlobal('ethereum', { on: vi.fn(), removeListener: vi.fn() });
  rpc.read.mockResolvedValue({ chainId: 43113, block: '42', holdings: [{id:4,rarity:9,balance:'1'}] });
  const m = new DepthModel(false, true, true, true); render(<RelicA6 m={m}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Read connected wallet' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('This collection does not match the supported Fuji Relics. You can keep playing.'));
  expect(m.state.relics).toEqual([]); expect(m.state.selectedRelic).toBeNull();
  expect(screen.queryByText(/Collection read at/)).toBeNull(); expect(m.error).toBe(false);
});
it.each([
  'Connect a wallet to this app before reading its Relics.',
  'Select Avalanche Fuji 43113 in your wallet, then retry.',
])('keeps the actionable wallet instruction: %s', async message => {
  vi.stubGlobal('ethereum', { on: vi.fn(), removeListener: vi.fn() });
  rpc.read.mockRejectedValue(new RelicReadError(message));
  render(<RelicA6 m={new DepthModel(false, true, true, true)}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Read connected wallet' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe(message));
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Read connected wallet' }).disabled).toBe(false);
});
it('reports the accepted empty collection even when zero-balance rows are present', async () => {
  vi.stubGlobal('ethereum', { on: vi.fn(), removeListener: vi.fn() });
  rpc.read.mockResolvedValue({ chainId: 43113, block: '42', holdings: R.RELIC_FIXTURE.map(h => ({ ...h, balance: '0' })) });
  const m = new DepthModel(false, true, true, true); render(<RelicA6 m={m}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Read connected wallet' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('No supported Relics in this wallet. Your team is ready to play.'));
  expect(m.state.relics).toEqual([]);
  expect(screen.getByText('No supported keepsakes found. You can keep playing.')).toBeTruthy();
  expect(screen.getAllByRole('button', { name: 'Not in your wallet' })).toHaveLength(4);
});
it('allows retry after a timeout without accepting the late collection', async () => {
  vi.useFakeTimers(); vi.stubGlobal('ethereum', { on: vi.fn(), removeListener: vi.fn() });
  let finish!: (value: unknown) => void;
  rpc.read.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  rpc.read.mockResolvedValueOnce({ chainId: 43113, block: '43', holdings: [R.RELIC_FIXTURE[0]] });
  const m = new DepthModel(false, true, true, true); render(<RelicA6 m={m}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Read connected wallet' }));
  expect(screen.getAllByRole('button', { name: 'Reading collection…' })).toHaveLength(4);
  await act(async () => { await vi.advanceTimersByTimeAsync(8000); });
  expect(screen.getByRole('status').textContent).toBe('Fuji is taking too long. Try again later; your game is ready.');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Read connected wallet' })); });
  expect(m.state.relics).toEqual([1]);
  await act(async () => finish({ chainId: 43113, block: '42', holdings: R.RELIC_FIXTURE }));
  expect(m.state.relics).toEqual([1]); expect(screen.getByRole('status').textContent).toContain('block 43');
});
it('drops stale wallet results and removes bonus when the wallet changes', async () => {
  const listeners = new Map<string, () => void>();
  const provider = { on: vi.fn((event, fn) => listeners.set(event, fn)), removeListener: vi.fn(), request: vi.fn() };
  vi.stubGlobal('ethereum', provider);
  const m = new DepthModel(false, true, true, true);
  m.state = R.selectRelic(R.acceptRelicSnapshot(m.state, 43113, R.RELIC_FIXTURE).state, 4).state;
  let finish!: (value: unknown) => void;
  rpc.read.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const view = render(<RelicA6 m={m}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Read connected wallet' }));
  act(() => listeners.get('accountsChanged')!());
  await act(async () => finish({ chainId: 43113, block: '42', holdings: R.RELIC_FIXTURE }));
  expect(m.state.relics).toEqual([]); expect(screen.getByText('Team bonus +0%')).toBeTruthy();
  expect(screen.getAllByRole('button', { name: 'Read wallet first' })).toHaveLength(4);
  view.unmount(); expect(provider.removeListener).toHaveBeenCalledTimes(3);
});

it('clears a wallet bonus from the cafe while its collection sheet is closed', () => {
  const listeners = new Map<string, () => void>();
  vi.stubGlobal('ethereum', { on: vi.fn((event, fn) => listeners.set(event, fn)), removeListener: vi.fn() });
  const m = new DepthModel(false, true, true, true);
  m.state = R.selectRelic(R.acceptRelicSnapshot(m.state, 43113, R.RELIC_FIXTURE).state, 4).state;
  render(<ShellV3 m={m}><span>Cafe</span></ShellV3>);
  expect(R.relicBonusA6(m.state)).toBe(800);
  act(() => listeners.get('chainChanged')!());
  expect(R.relicBonusA6(m.state)).toBe(0);
});

it('observes a wallet provider that appears after the cafe first renders', () => {
  const m = new DepthModel(false, true, true, true);
  const view = render(<ShellV3 m={m}><span>Cafe</span></ShellV3>);
  const listeners = new Map<string, () => void>();
  vi.stubGlobal('ethereum', { on: vi.fn((event, fn) => listeners.set(event, fn)), removeListener: vi.fn() });
  m.state = R.selectRelic(R.acceptRelicSnapshot(m.state, 43113, R.RELIC_FIXTURE).state, 4).state;
  view.rerender(<ShellV3 m={m}><span>Cafe</span></ShellV3>);
  expect(R.relicBonusA6(m.state)).toBe(800);
  act(() => listeners.get('accountsChanged')!());
  expect(R.relicBonusA6(m.state)).toBe(0);
});
