import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
const fake = vi.hoisted(() => ({ destroy: vi.fn(), complete: null as (() => void) | null }));
vi.mock('./playBossFight', () => ({ playBossFight: (_result: unknown, options: { signal: AbortSignal; onHp: (cat: number, boss: number) => void; onReady: (skip: () => void) => void }) => new Promise<void>(resolve => {
  fake.complete = resolve;
  options.onHp(100, 500);
  options.onReady(resolve);
  options.signal.addEventListener('abort', () => { fake.destroy(); resolve(); }, { once: true });
}) }));
import { BossArena } from './BossArena';
import { ARENA_FIXTURES } from './arenaFixtures';
afterEach(cleanup);
it('StrictMode, Skip and repeated completion notify the owner once; unmount releases the game', async () => {
  const onDone = vi.fn();
  const view = render(<StrictMode><BossArena {...ARENA_FIXTURES[0]!} reducedMotion onDone={onDone} /></StrictMode>);
  await waitFor(() => expect(screen.getByLabelText('Fight health').textContent).toContain('100'));
  fireEvent.click(screen.getByRole('button', { name: 'Skip fight' }));
  await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
  await act(async () => { fake.complete?.(); });
  expect(onDone).toHaveBeenCalledOnce();
  view.unmount();
  expect(fake.destroy).toHaveBeenCalled();
});
it('unmount during a replay never reports completion to the owner', async () => {
  const onDone = vi.fn();
  const view = render(<BossArena {...ARENA_FIXTURES[0]!} reducedMotion onDone={onDone} />);
  await waitFor(() => expect(screen.getByLabelText('Fight health').textContent).toContain('100'));
  view.unmount();
  await act(async () => { fake.complete?.(); });
  expect(onDone).not.toHaveBeenCalled();
});
