// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('../GameCanvas', () => ({ GameCanvas: () => <div data-testid="game-canvas" /> }));

import type { ServerStateV2 } from '../api/GameApiV2';
import { sampleServerStateV2 } from './a11y/fixtures';
import { ARENA_FIXTURES } from '../game/arena/arenaFixtures';
let stageState: ServerStateV2;
const syncSnapshot = vi.hoisted(() => ({ claimInFlight: false, lastError: null }));
const stageLoop = vi.hoisted(() => ({ start: vi.fn(async () => {}), stop: vi.fn(), onEvent: () => () => {}, retry: vi.fn(),
  subscribe: () => () => {}, getSnapshot: () => syncSnapshot,
  equip: vi.fn(), setLocked: vi.fn(), chooseClass: vi.fn(), craft: vi.fn(), salvage: vi.fn(), fightBoss: vi.fn() }));
vi.mock('../game/v2/storeV2', () => ({ createEquipQueueV2: () => ({ equip: stageLoop.equip, dispose: vi.fn() }), getGameLoopV2: () => stageLoop,
  useGameSnapshotV2: () => ({ state: stageState, busy: null, loadFailed: false }), useGameModeV2: () => ({ demo: true, notice: null }),
  useActionNoticeState: () => null, getActionNoticeState: () => null, setActionNoticeState: vi.fn(), subscribeActionNotice: () => () => {} }));
vi.mock('../game/stage/StageCanvas', () => ({ StageCanvas: () => <div data-testid="game-canvas" /> }));
vi.mock('../game/arena/BossArena', () => ({ BossArena: ({ onDone }: { onDone: () => void }) => <button onClick={onDone}>Complete replay</button> }));

import { App } from '../App';
import { getGameLoop } from '../game/store';
import { resetHelpForTests } from '../onboarding/helpStore';

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

beforeEach(() => {
  stageState = sampleServerStateV2();
  vi.clearAllMocks();
  syncSnapshot.claimInFlight = false;
  stageLoop.fightBoss.mockResolvedValue(ARENA_FIXTURES[0]!.result);
  vi.stubEnv('VITE_GAME_V2', '1');
  localStorage.clear();
  localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  act(() => resetHelpForTests());
  setViewport(1280, 800);
});

afterEach(() => {
  getGameLoop().stop();
  cleanup();
  vi.unstubAllEnvs();
});

it('keeps the classic layout when VITE_GAME_V2 is not set', () => {
  vi.stubEnv('VITE_GAME_V2', '');
  render(<App />);
  expect(screen.getByRole('region', { name: 'Taskbar strip' })).toBeTruthy();
  expect(screen.queryByRole('region', { name: 'Game stage' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Stage' })).toBeNull();
});

it('desktop: rail, top HUD, stage, character area and the seven tabs', () => {
  render(<App />);
  expect(screen.getByTestId('rail')).toBeTruthy();
  expect(screen.getByTestId('hud')).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Game stage' })).toBeTruthy();
  expect(screen.getByTestId('game-canvas')).toBeTruthy();
  expect(screen.getByTestId('hud-power')).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Cat status' })).toBeTruthy();
  expect(screen.getByLabelText('Currencies and keys').textContent).toContain('Fish');
  expect(screen.queryByRole('region', { name: 'Café board' })).toBeNull();
  expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
    'Home', 'Bag', 'Map', 'Forge', 'Market', 'Hero', 'Help',
  ]);
  expect(screen.getByRole('tab', { name: 'Home' }).getAttribute('aria-selected')).toBe('true');
  fireEvent.click(screen.getByRole('tab', { name: 'Hero' }));
  expect(screen.getByRole('region', { name: 'Character' })).toBeTruthy();
  fireEvent.click(screen.getByRole('tab', { name: 'Forge' }));
  expect(screen.getByRole('heading', { name: 'Forge' })).toBeTruthy();
  fireEvent.click(screen.getByRole('tab', { name: 'Help' }));
  expect(screen.getByRole('tabpanel', { name: 'Help' }).textContent).toContain('Mochi the cat naps');
});

it('phone: bottom nav switches panels, Escape returns focus to tab', () => {
  setViewport(390, 844);
  render(<App />);
  const nav = screen.getByRole('navigation', { name: 'Game menu' });
  expect(nav).toBeTruthy();
  const map = within(nav).getByRole('tab', { name: 'Map' });
  map.focus();
  fireEvent.click(map);
  expect(screen.getByRole('tabpanel', { name: 'Map' })).toBeTruthy();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(document.activeElement).toBe(map);
});




it('uses fixture HUD values and exposes the gated hint', () => {
  stageState = sampleServerStateV2({ gated: true, neededPower: 99999, level: 20, keys: 2 });
  render(<App />);
  const hud = screen.getByRole('region', { name: 'Cat status' });
  expect(hud.textContent).toContain('20');
  expect(screen.getByLabelText('Cat Keys 2 of 5')).toBeTruthy();
  expect(screen.getByTestId('next-hint').textContent).toContain('Equip better gear');
});
it('shows class selection only while the authoritative class is null', () => {
  stageState = sampleServerStateV2({ classId: null });
  const view = render(<App />);
  expect(screen.getByTestId('class-picker')).toBeTruthy();
  fireEvent.click(screen.getByTestId('class-picker-choose-button'));
  fireEvent.click(screen.getByTestId('class-picker-confirm-button'));
  expect(stageLoop.chooseClass).toHaveBeenCalledWith('warrior');
  stageState = sampleServerStateV2(); view.rerender(<App />);
  expect(screen.queryByTestId('class-picker')).toBeNull();
  expect(screen.getByTestId('game-canvas')).toBeTruthy();
});
it('boss request opens the replay, then the victory chest', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('tab', { name: 'Map' }));
  const fight = screen.getByRole('button', { name: /^Fight/ });
  await act(async () => { fireEvent.click(fight); });
  expect(stageLoop.fightBoss).toHaveBeenCalledWith(1);
  expect(screen.getByRole('button', { name: 'Complete replay' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Complete replay' }));
  expect(screen.getByText('Victory!')).toBeTruthy();
  expect(screen.getByRole('dialog')).toBeTruthy();
});


it('phone: panel opening moves focus inside and closing returns it to the selected tab', () => {
  setViewport(390, 844);
  render(<App />);
  const nav = screen.getByRole('navigation', { name: 'Game menu' });
  const map = within(nav).getByRole('tab', { name: 'Map' });
  map.focus();
  fireEvent.click(map);
  expect(screen.getByRole('tabpanel', { name: 'Map' })).toBeTruthy();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(document.activeElement).toBe(map);
  const market = within(nav).getByRole('tab', { name: 'Market' });
  market.focus();
  fireEvent.click(market);
  expect(screen.getByRole('tabpanel', { name: 'Market' })).toBeTruthy();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(document.activeElement).toBe(market);
});

it('StageLayout does not re-render on a timer', () => {
  vi.useFakeTimers();
  try {
    let renders = 0;
    function RenderCounter() {
      renders++;
      return <App />;
    }
    render(<RenderCounter />);
    expect(renders).toBe(1);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(renders).toBe(1);
  } finally {
    vi.useRealTimers();
  }
});

it('marks the production stage root when VITE_GAME_V2 is enabled', () => {
  render(<App />);
  expect(screen.getByRole('region', { name: 'Game stage' }).closest('.v2-shell')?.getAttribute('data-game-v2')).toBe('stage-v2-enabled');
});

it('renders SyncStatus inside the header sync-status slot', () => {
  render(<App />);
  const slot = document.querySelector('[data-slot="sync-status"]');
  expect(slot?.querySelector('[data-sync-status]')).toBeTruthy();
});


it('holds every boss-sensitive panel at the pre-request state, then releases with the confirmed banner', async () => {
  const before = stageState;
  const result = ARENA_FIXTURES[0]!.result;
  let resolve!: (result: typeof ARENA_FIXTURES[0]['result']) => void;
  stageLoop.fightBoss.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const view = render(<App />);
  fireEvent.click(screen.getByRole('tab', { name: 'Map' }));
  const hud = screen.getByRole('region', { name: 'Cat status' });
  const beforeHud = hud.textContent;
  const beforeBag = screen.getByTestId('bag-count').textContent;
  const beforeForge = document.querySelector('#panel-Forge')!.textContent;
  const beforeCharacter = document.querySelector('#panel-Character')!.textContent;
  const sync = document.querySelector('[data-slot="sync-status"]')!;
  fireEvent.click(screen.getByRole('button', { name: /^Fight/ }));
  // Store publishes before the request promise resolves. This must never leak a frame.
  stageState = result.state;
  syncSnapshot.claimInFlight = true;
  view.rerender(<App />);
  expect(hud.textContent).toBe(beforeHud);
  expect(sync.textContent).toContain('Live');
  await act(async () => { resolve(result); });
  expect(hud.textContent).toBe(beforeHud);
  expect(screen.getByTestId('bag-count').textContent).toBe(beforeBag);
  expect(document.querySelector('#panel-Forge')!.textContent).toBe(beforeForge);
  expect(document.querySelector('#panel-Character')!.textContent).toBe(beforeCharacter);
  expect(document.querySelector('.v2-chapter-map [data-chapter="2"]')!.getAttribute('data-state')).toBe('locked');
  expect(screen.queryByText('Victory!')).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(before.progress.chapter).toBe(1);
  fireEvent.click(screen.getByRole('button', { name: 'Complete replay' }));
  expect(screen.getByText('Victory!')).toBeTruthy();
  expect(hud.textContent).not.toBe(beforeHud);
  expect(screen.getByLabelText('Cat Keys 0 of 5')).toBeTruthy();
  expect(document.querySelector('.v2-chapter-map [data-chapter="2"]')!.getAttribute('data-state')).toBe('current');
  expect(screen.getByTestId('bag-count').textContent).not.toBe(beforeBag);
  expect(sync.textContent).toContain('Syncing');
});
