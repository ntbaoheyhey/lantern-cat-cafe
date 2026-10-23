// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { BossResult } from '@taskbar-hero/game-rules';
import { afterEach, expect, it, vi } from 'vitest';
import type { BossFightResult, GameApi, ServerState } from '../api/GameApi';
import { MockGameApi } from '../api/MockGameApi';
import { GameLoop } from '../game/gameState';
import { BossTab } from './BossTab';
import { frameAt, stepMs } from './replay';

const WIN: BossResult = {
  won: true,
  heroMaxHp: 360,
  bossMaxHp: 100,
  log: [
    { t: 1, type: 'hero_hit', damage: 60, crit: true, bossHp: 40 },
    { t: 1, type: 'boss_hit', damage: 50, heroHp: 310 },
    { t: 2, type: 'hero_hit', damage: 40, crit: false, bossHp: 0 },
    { t: 2, type: 'end', won: true },
  ],
};

const LOSS: BossResult = {
  won: false,
  heroMaxHp: 100,
  bossMaxHp: 900,
  log: [
    { t: 1, type: 'hero_hit', damage: 30, crit: false, bossHp: 870 },
    { t: 1, type: 'boss_hit', damage: 100, heroHp: 0 },
    { t: 1, type: 'end', won: false },
  ],
};

let loop: GameLoop | null = null;

afterEach(() => {
  loop?.stop();
  loop = null;
  cleanup();
  vi.useRealTimers();
});

/** A GameApi whose state and fight result the test controls. */
async function setup(opts: { result?: BossResult; keyGranted?: boolean; attemptsLeft?: number; replayMs?: number }) {
  const base = await new MockGameApi().getState();
  const attemptsLeft = opts.attemptsLeft ?? 5;
  let state: ServerState = { ...base, boss: { ...base.boss, attemptsLeft, attemptsToday: 5 - attemptsLeft } };
  const fightBoss = vi.fn(async (): Promise<BossFightResult> => {
    const won = opts.result?.won ?? false;
    const left = state.boss.attemptsLeft - 1;
    state = {
      ...state,
      bossKeys: state.bossKeys + (opts.keyGranted ? 1 : 0),
      bossLevel: state.bossLevel + (won ? 1 : 0),
      boss: { ...state.boss, level: state.boss.level + (won ? 1 : 0), attemptsLeft: left, attemptsToday: 5 - left },
    };
    return { result: opts.result ?? LOSS, keyGranted: !!opts.keyGranted, state };
  });
  const api: GameApi = {
    getState: async () => state,
    claim: async () => ({ ...state, drops: [] }),
    equip: async () => state,
    fightBoss,
    forgeRelic: () => Promise.reject(new Error('unused')),
    reportMint: async () => state,
    upgrade: async () => state,
  };
  loop = new GameLoop({ api });
  await loop.start(document);
  render(<BossTab api={api} loop={loop} replayMs={opts.replayMs ?? 40} />);
  return { fightBoss, api };
}

it('shows boss level, attempts left and keys', async () => {
  await setup({ attemptsLeft: 3 });
  expect(screen.getByTestId('boss-level').textContent).toBe('1');
  expect(screen.getByTestId('boss-attempts').textContent).toBe('3');
  expect(screen.getByTestId('boss-keys').textContent).toBe('0');
});

it('a winning log shows the key once the replay ends', async () => {
  await setup({ result: WIN, keyGranted: true });
  fireEvent.click(screen.getByRole('button', { name: 'Fight' }));
  await waitFor(() => expect(screen.getByTestId('boss-key').textContent).toBe('Boss Key earned!'));
  expect(screen.getByTestId('boss-outcome').textContent).toMatch(/Victory/);
  await waitFor(() => expect(screen.getByTestId('boss-keys').textContent).toBe('1')); // applied after the replay
  expect(screen.getByTestId('boss-level').textContent).toBe('2');
  expect(screen.getByRole('progressbar', { name: 'Boss level 1 health' }).getAttribute('aria-valuenow')).toBe('0');
});

it('a losing log shows attempts left', async () => {
  await setup({ result: LOSS, attemptsLeft: 3 });
  fireEvent.click(screen.getByRole('button', { name: 'Fight' }));
  await waitFor(() => expect(screen.getByTestId('boss-outcome').textContent).toBe('Defeated. 2 attempts left today.'));
  expect(screen.queryByTestId('boss-key')).toBeNull();
  await waitFor(() => expect(screen.getByTestId('boss-attempts').textContent).toBe('2'));
});

it('disables Fight at the daily limit and says when it resets', async () => {
  const { fightBoss } = await setup({ attemptsLeft: 0 });
  const fight = screen.getByRole('button', { name: 'Fight' }) as HTMLButtonElement;
  expect(fight.disabled).toBe(true);
  expect(screen.getByTestId('boss-limit').textContent).toMatch(/midnight Vietnam time/);
  fireEvent.click(fight);
  expect(fightBoss).not.toHaveBeenCalled();
});

it('the last attempt disables Fight after the replay', async () => {
  await setup({ result: LOSS, attemptsLeft: 1 });
  fireEvent.click(screen.getByRole('button', { name: 'Fight' }));
  await waitFor(() => expect(screen.getByTestId('boss-limit')).toBeTruthy());
  expect((screen.getByRole('button', { name: 'Fight' }) as HTMLButtonElement).disabled).toBe(true);
});

it('Fight is disabled while replaying and Skip jumps to the result', async () => {
  await setup({ result: WIN, keyGranted: true, replayMs: 60_000 });
  fireEvent.click(screen.getByRole('button', { name: 'Fight' }));
  const fighting = await screen.findByRole('button', { name: 'Fighting…' });
  expect((fighting as HTMLButtonElement).disabled).toBe(true);
  expect(screen.queryByTestId('boss-outcome')).toBeNull();
  expect(screen.getByTestId('boss-keys').textContent).toBe('0'); // not spoiled mid-replay

  act(() => fireEvent.click(screen.getByRole('button', { name: 'Skip' })));
  expect(screen.getByTestId('boss-key')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
  await waitFor(() => expect(screen.getByTestId('boss-keys').textContent).toBe('1'));
});

it('the replay keeps going while the idle loop re-renders the tab', async () => {
  const { api } = await setup({ result: LOSS, replayMs: 300 }); // 100 ms per event
  const churn = setInterval(() => void api.getState().then((s) => loop?.adopt({ ...s })), 30);
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Fight' }));
    await waitFor(() => expect(screen.getByTestId('boss-outcome')).toBeTruthy(), { timeout: 2000 });
  } finally {
    clearInterval(churn);
  }
});

it('frameAt folds the log into health bars', () => {
  expect(frameAt(WIN, 0)).toEqual({ heroHp: 360, bossHp: 100, last: null, done: false });
  expect(frameAt(WIN, 2)).toMatchObject({ heroHp: 310, bossHp: 40, done: false });
  expect(frameAt(WIN, 99)).toMatchObject({ heroHp: 310, bossHp: 0, done: true });
});

it('replay lasts about 4.5 s whatever the log length', () => {
  expect(stepMs(WIN) * WIN.log.length).toBeCloseTo(4500);
  const long = { ...WIN, log: Array.from({ length: 121 }, () => WIN.log[0]!) };
  expect(stepMs(long) * long.log.length).toBeCloseTo(4500);
});
