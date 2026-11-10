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
afterEach(() => { cleanup(); mock.workers.length = 0; mock.fail = false; });
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
