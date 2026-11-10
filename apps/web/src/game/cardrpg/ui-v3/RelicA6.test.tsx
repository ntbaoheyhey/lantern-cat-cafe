import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { DepthModel } from '../depth/model';
import { RelicA6 } from './RelicA6';
import ShellV3 from './ShellV3';
const rpc = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('../depth/relic-reader', () => ({ readConnectedRelics: rpc.read }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); rpc.read.mockReset(); });
it('equips a demo team treasure and restores an empty slot without touching cat gear', () => {
  const m = new DepthModel(true, true, true, true); render(<RelicA6 m={m}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Load demo relics' }));
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
