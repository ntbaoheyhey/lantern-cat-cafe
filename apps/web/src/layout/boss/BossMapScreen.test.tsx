import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { sampleServerStateV2 } from '../a11y/fixtures';
import { BossMapScreen } from './BossMapScreen';
import type { BossRun } from '../bossPresentation';

afterEach(cleanup);
const state = () => {
  const value = sampleServerStateV2();
  value.progress = { chapter: 2, round: 10, kills: 6, killsPerRound: 6, gated: false, neededPower: 999999 };
  value.bosses = { chapters: [{ chapter: 1, cleared: true, wins: 7 }], cooldownUntil: null };
  value.currencies.keys = 2;
  return value;
};
function Harness({ history = [] }: { history?: readonly BossRun[] }) {
  const [chapter, select] = useState(2);
  return <BossMapScreen state={state()} chapter={chapter} onSelectChapter={select} busy={false} onFight={vi.fn()} history={history} />;
}
it('selects reachable nodes, updates the boss and real rewards, blocks locked nodes by mouse and keyboard', () => {
  render(<Harness />);
  const map = screen.getByRole('navigation', { name: 'Chapter Map' });
  const gate = screen.getByRole('region', { name: 'Boss Gate' });
  expect(within(gate).getByRole('heading', { name: 'Cucumber Scare' })).toBeDefined();
  fireEvent.click(within(map).getByRole('button', { name: /Living Room/ }));
  expect(within(gate).getByRole('heading', { name: 'Yarn Giant' })).toBeDefined();
  expect(within(gate).getByRole('button', { name: 'Rematch' })).toBeDefined();
  expect(screen.getByText('120–200 · 100%')).toBeDefined();
  const locked = within(map).getByRole('button', { name: /Bathroom/ });
  expect(locked.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(locked);
  fireEvent.keyDown(locked, { key: 'Enter' });
  fireEvent.keyDown(locked, { key: ' ' });
  expect(within(gate).getByRole('heading', { name: 'Yarn Giant' })).toBeDefined();
  expect(screen.queryByText('999,999')).toBeNull();
});
it('explains key limits and preserves the key gate even when a caller selects a locked chapter', () => {
  const onFight = vi.fn();
  const value = state(); value.currencies.keys = 0;
  const props = { state: value, chapter: 1, busy: false, onFight, onSelectChapter: vi.fn(), history: [] };
  const { rerender } = render(<BossMapScreen {...props} />);
  expect(screen.getByText('Daily attempts: Key-limited')).toBeDefined();
  expect((screen.getByRole('button', { name: 'Fight' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Fight' }));
  value.currencies.keys = 2;
  rerender(<BossMapScreen {...props} chapter={5} />);
  expect((screen.getByRole('button', { name: 'Fight' }) as HTMLButtonElement).disabled).toBe(true);
  expect(onFight).not.toHaveBeenCalled();
});
it('shows only three latest runs for the selected chapter and separates lifetime wins', () => {
  const run = { chapter: 1, won: true, durationMs: 1200, firstClear: false };
  render(<Harness history={[{ ...run, chapter: 2, durationMs: 9900 }, run, { ...run, won: false }, run, { ...run, durationMs: 8888 }]} />);
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Chapter Map' })).getByRole('button', { name: /Living Room/ }));
  const past = screen.getByRole('region', { name: 'Past runs' });
  expect(within(past).getAllByRole('listitem')).toHaveLength(3);
  expect(within(past).getByText('Lifetime wins: 7')).toBeDefined();
  expect(within(past).queryByText(/9.9s|8.9s/)).toBeNull();
  expect(within(past).getAllByText('Rematch · 1.2s')).toHaveLength(3);
  expect(within(past).getAllByText('Win')).toHaveLength(2);
  expect(within(past).getByText('Loss')).toBeDefined();
});

it('preserves the original compact panel and pinned fight action for smaller viewports', () => {
  const onFight = vi.fn();
  render(<BossMapScreen state={state()} chapter={1} busy={false} onFight={onFight} onSelectChapter={vi.fn()} history={[]} compact />);
  const gate = screen.getByRole('region', { name: 'Boss Gate' });
  const map = within(gate).getByRole('navigation', { name: 'Chapter Map' });
  expect(map.classList.contains('v2-chapter-map--compact')).toBe(true);
  expect(map.classList.contains('v2-chapter-map--path')).toBe(false);
  expect(screen.queryByRole('region', { name: 'Past runs' })).toBeNull();
  const action = within(gate).getByRole('button', { name: 'Rematch' });
  expect(action.closest('.boss-gate-actions')).not.toBeNull();
  fireEvent.click(action);
  expect(onFight).toHaveBeenCalledWith(1);
});
