import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { ForecastV4 } from './ForecastV4';
const mock = vi.hoisted(() => ({ workers: [] as Array<{
  onmessage?: (event: { data: unknown }) => void; onerror?: () => void;
  request?: { key: string; setup: unknown }; postMessage: (message: { key: string; setup: unknown }) => void; terminate: ReturnType<typeof vi.fn>;
}>, fail: false }));
vi.mock('./forecast-worker?worker&inline', () => ({ default: class {
  onmessage?: (event: { data: unknown }) => void;
  onerror?: () => void;
  request?: { key: string; setup: unknown };
  terminate = vi.fn();
  constructor() { if (mock.fail) throw Error('Worker blocked'); mock.workers.push(this); }
  postMessage(message: { key: string; setup: unknown }) { this.request = message; }
} }));
afterEach(() => { cleanup(); vi.useRealTimers(); mock.workers.length = 0; mock.fail = false; });
let serial = 0;
function setup() {
  const state = R.setGameplayV4(R.createDepthAccount(11, 0), true);
  const cats = R.battleCats(state); cats[0]!.stats.hp += ++serial;
  return { seed: 1, chapter: 1, cats, enemies: ['yarn-giant'], gameplayV4: true };
}
function reply(worker: typeof mock.workers[number], band: 'Risky' | 'Even' | 'Favoured') {
  act(() => worker.onmessage!({ data: { key: worker.request!.key, result: { band, risk: 'Mochi often falls first.',
    samples: 20, wins: band === 'Risky' ? 2 : band === 'Even' ? 10 : 18, firstFallen: 'mochi', computeMs: 4 } } }));
}

it('cancels a changed build and ignores its stale result, with no percentage claim', () => {
  const first = setup(), second = setup(), ui = render(<ForecastV4 setup={first} label="Current crew forecast" />);
  const old = mock.workers[0]!; expect(old.request!.setup).toEqual(first);
  ui.rerender(<ForecastV4 setup={second} label="Equipped crew forecast" />);
  expect(old.terminate).toHaveBeenCalled(); reply(old, 'Favoured');
  expect(screen.queryByText('Favoured')).toBeNull();
  reply(mock.workers[1]!, 'Risky');
  expect(screen.getByRole('region', { name: 'Equipped crew forecast' }).textContent).toContain('Risky');
  expect(screen.getByText('Mochi often falls first.')).toBeTruthy();
  expect(screen.queryByText(/10%|2\/20/)).toBeNull();
  ui.unmount(); expect(mock.workers[1]!.terminate).toHaveBeenCalled();
});

it('reuses a full-build result across visits and seed changes but not changed equipment', () => {
  const build = setup(), ui = render(<ForecastV4 setup={build} />);
  reply(mock.workers[0]!, 'Even'); ui.unmount();
  const next = render(<ForecastV4 setup={{ ...build, seed: 999 }} />);
  expect(mock.workers).toHaveLength(1);
  expect(screen.getByRole('region', { name: 'Rough forecast' }).getAttribute('data-cache-hit')).toBe('true');
  const changed = structuredClone(build); changed.cats[0]!.stats.defense += 2;
  next.rerender(<ForecastV4 setup={changed} />); expect(mock.workers).toHaveLength(2);
  expect(screen.queryByText('Even')).toBeNull(); reply(mock.workers[1]!, 'Favoured');
  expect(screen.getByText('Favoured')).toBeTruthy();
});

it('falls back when a worker cannot start or fails; old success is not shown', () => {
  mock.fail = true; const ui = render(<ForecastV4 setup={setup()} />);
  expect(screen.getByText('Scout their plan')).toBeTruthy();
  mock.fail = false; ui.rerender(<ForecastV4 setup={setup()} />);
  const worker = mock.workers[0]!; act(() => worker.onerror!());
  expect(screen.getByText('The forecast is unavailable. Read their plan below.')).toBeTruthy();
  expect(worker.terminate).toHaveBeenCalled();
});

it('keeps A6 forecasts qualitative even when a caller requests a percentage', () => {
  render(<ForecastV4 setup={{...setup(), skillsV5: true, gameplayA6: true}} showChance/>);
  const worker = mock.workers[0]!;
  act(() => worker.onmessage!({data: {key: worker.request!.key, result: {band: 'Favoured', risk: 'Watch the guardian.', samples: 20, wins: 20, firstFallen: null, computeMs: 1}}}));
  expect(screen.getByRole('heading', {name: 'Favoured'})).toBeTruthy();
  expect(screen.queryByText(/100%/)).toBeNull();
});

it('uses current A6 enemy advice without changing the forecast result or legacy prose', () => {
  const build = {...setup(), enemies: ['teacup-healer'], skillsV5: true, gameplayA6: true};
  const ui = render(<ForecastV4 setup={build}/>);
  const worker = mock.workers[0]!;
  act(() => worker.onmessage!({data: {key: worker.request!.key, result: {band: 'Favoured', risk: 'Every third round restores 65 HP.', samples: 20, wins: 19, firstFallen: null, computeMs: 1}}}));
  expect(screen.getByText(/Teacup Healer: Heals its weakest ally on even rounds or at full rage/)).toBeTruthy();
  expect(screen.getByRole('heading', {name: 'Favoured'})).toBeTruthy();
  expect(screen.queryByText(/Every third round/)).toBeNull();
  ui.rerender(<ForecastV4 setup={{...setup(), enemies: ['teacup-healer']}}/>);
  const legacy = mock.workers[1]!;
  act(() => legacy.onmessage!({data: {key: legacy.request!.key, result: {band: 'Favoured', risk: 'Every third round restores 65 HP.', samples: 20, wins: 19, firstFallen: null, computeMs: 1}}}));
  expect(screen.getByText('Every third round restores 65 HP.')).toBeTruthy();
});


it('bounds a silent worker and ignores its late answer without caching it', () => {
  vi.useFakeTimers();
  const build = setup(), ui = render(<ForecastV4 setup={build}/>), worker = mock.workers[0]!;
  act(() => vi.advanceTimersByTime(7_999));
  expect(screen.getByText('Reading the matchup…')).toBeTruthy();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByText('Scout their plan')).toBeTruthy();
  expect(worker.terminate).toHaveBeenCalled();
  reply(worker, 'Favoured');
  expect(screen.queryByText('Favoured')).toBeNull();
  ui.unmount(); render(<ForecastV4 setup={build}/>);
  expect(mock.workers).toHaveLength(2);
  expect(screen.getByText('Reading the matchup…')).toBeTruthy();
});

it('keeps the first completed answer and clears its deadline', () => {
  vi.useFakeTimers();
  const build = setup(), ui = render(<ForecastV4 setup={build}/>), worker = mock.workers[0]!;
  reply(worker, 'Even');
  act(() => worker.onerror!()); reply(worker, 'Risky');
  act(() => vi.advanceTimersByTime(20_000));
  expect(screen.getByText('Even')).toBeTruthy();
  expect(screen.queryByText('Scout their plan')).toBeNull();
  ui.unmount(); render(<ForecastV4 setup={build}/>);
  expect(mock.workers).toHaveLength(1);
  expect(screen.getByText('Even')).toBeTruthy();
});

it('keeps an unrelated reply pending and gives a changed build its own full deadline', () => {
  vi.useFakeTimers();
  const ui = render(<ForecastV4 setup={setup()}/>), old = mock.workers[0]!;
  act(() => old.onmessage!({data:{key:'unrelated',result:{band:'Favoured'}}}));
  expect(old.terminate).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(7_000));
  ui.rerender(<ForecastV4 setup={setup()}/>);
  act(() => vi.advanceTimersByTime(1_000));
  expect(screen.getByText('Reading the matchup…')).toBeTruthy();
  reply(old, 'Favoured');
  expect(screen.queryByText('Favoured')).toBeNull();
  reply(mock.workers[1]!, 'Risky');
  expect(screen.getByText('Risky')).toBeTruthy();
});

it('ends a failed response and releases a pending worker when leaving the screen', () => {
  vi.useFakeTimers();
  const ui = render(<ForecastV4 setup={setup()}/>), worker = mock.workers[0]!;
  act(() => worker.onmessage!({data:{key:worker.request!.key,error:'Unavailable'}}));
  expect(screen.getByText('Scout their plan')).toBeTruthy();
  reply(worker, 'Even'); expect(screen.queryByText('Even')).toBeNull();
  ui.rerender(<ForecastV4 setup={setup()}/>); const pending = mock.workers[1]!;
  ui.unmount(); expect(pending.terminate).toHaveBeenCalled();
  reply(pending, 'Favoured'); act(() => vi.advanceTimersByTime(20_000));
  expect(screen.queryByRole('region')).toBeNull();
});
