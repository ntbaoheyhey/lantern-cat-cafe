import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { sampleServerStateV2 } from '../../layout/a11y/fixtures';
const fake = vi.hoisted(() => ({ games: [] as { scale: { resize: ReturnType<typeof vi.fn> }; destroy: ReturnType<typeof vi.fn>; step: ReturnType<typeof vi.fn> }[],
  show: vi.fn(), relayout: vi.fn() }));
vi.mock('phaser', () => ({ default: { CANVAS: 1, Game: class {
  isBooted = true;
  scale = { resize: vi.fn() };
  scene = { add: vi.fn() };
  destroy = vi.fn();
  step = vi.fn();
  constructor() { fake.games.push(this); }
} } }));
vi.mock('./StageScene', () => ({ StageScene: class { show = fake.show; relayout = fake.relayout; } }));
vi.mock('../../art/backdrops/BackdropView', () => ({ BackdropView: () => null }));
import { StageCanvas } from './StageCanvas';
afterEach(() => { cleanup(); fake.games.length = 0; vi.clearAllMocks(); });
it('resizes one game and consumes deferred destruction even with the tab hidden', async () => {
  const state = sampleServerStateV2();
  const view = render(<StageCanvas state={state} zoom={3} width={1000} reducedMotion={false} />);
  await waitFor(() => expect(fake.games).toHaveLength(1));
  const game = fake.games[0]!;
  for (let i = 0; i < 12; i++) {
    view.rerender(<StageCanvas state={{ ...state }} zoom={3} width={i % 2 ? 1360 : 1000} reducedMotion={false} />);
  }
  expect(fake.games).toHaveLength(1);
  expect(game.scale.resize).toHaveBeenLastCalledWith(453, 96);
  expect(fake.relayout).toHaveBeenCalled();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  view.unmount();
  expect(game.destroy).toHaveBeenCalledWith(true);
  expect(game.step).toHaveBeenCalledWith(expect.any(Number), 0);
  expect(game.destroy.mock.invocationCallOrder[0]).toBeLessThan(game.step.mock.invocationCallOrder[0]!);
  vi.restoreAllMocks();
});
it('does not create a game if unmounted before the lazy imports resolve', async () => {
  const view = render(<StageCanvas state={sampleServerStateV2()} zoom={3} width={1000} reducedMotion={false} />);
  view.unmount();
  await act(async () => { await Promise.resolve(); });
  expect(fake.games).toHaveLength(0);
});

it('keeps the current authoritative label during cleared/start moments and subsequent kills', async () => {
  vi.useFakeTimers();
  try {
    const before = sampleServerStateV2({ round: 1, kills: 5 });
    const after = sampleServerStateV2({ round: 2, kills: 0 });
    const view = render(<StageCanvas state={before} zoom={2} width={800} reducedMotion />);
    await act(async () => { await Promise.resolve(); });
    view.rerender(<StageCanvas state={after} zoom={2} width={800} reducedMotion />);
    expect(view.getByLabelText('Stage progress').textContent).toContain('Chapter 1 · Round 2 / 10');
    expect(view.getByRole('status').textContent).toBe('Round cleared');
    view.rerender(<StageCanvas state={{ ...after, progress: { ...after.progress, kills: 1 } }} zoom={2} width={800} reducedMotion />);
    act(() => vi.advanceTimersByTime(1400));
    expect(view.getByRole('status').textContent).toBe('Round start');
    act(() => vi.advanceTimersByTime(1400));
    expect(view.getByRole('status').textContent).toBe('');
    expect(view.getByLabelText('1 / 6 kills; last kill is elite')).toBeTruthy();
    view.unmount();
  } finally { vi.useRealTimers(); }
});

it('announces the gate and boss readiness from progress', () => {
  const view = render(<StageCanvas state={sampleServerStateV2({ gated: true })} zoom={2} width={800} reducedMotion />);
  expect(view.getByRole('status').textContent).toBe('Too strong — equip better gear');
  view.rerender(<StageCanvas state={sampleServerStateV2()} zoom={2} width={800} reducedMotion />);
  expect(view.getByRole('status').textContent).toBe('Boss ready — open Boss');
});
