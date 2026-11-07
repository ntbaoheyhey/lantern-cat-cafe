import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { SquadBridge } from './SquadScene';
let bridge: SquadBridge;
vi.mock('./SquadCanvas', () => ({ SquadCanvas: (props: { bridge: SquadBridge }) => { bridge = props.bridge; return <div data-testid="battle-canvas" />; } }));
vi.mock('./RigPortrait', () => ({ RigPortrait: () => null }));
import SquadAdventure from './SquadAdventure';

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); Object.defineProperty(document, 'hidden', { configurable: true, value: false }); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const elapse = (ms: number) => act(() => vi.advanceTimersByTime(ms));

it('waits for Begin, pauses offscreen/hidden, and resumes without catching up', () => {
  const view = render(<SquadAdventure />);
  elapse(1000); expect(bridge.read().battle.tick).toBe(0);
  fireEvent.click(screen.getByRole('button', { name: 'Begin patrol' }));
  elapse(1000); const first = bridge.read().battle.tick; expect(first).toBeGreaterThan(0);
  view.rerender(<SquadAdventure active={false} />); elapse(5000); expect(bridge.read().battle.tick).toBe(first);
  view.rerender(<SquadAdventure active />);
  Object.defineProperty(document, 'hidden', { configurable: true, value: true }); fireEvent(document, new Event('visibilitychange'));
  elapse(5000); expect(bridge.read().battle.tick).toBe(first);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false }); fireEvent(document, new Event('visibilitychange'));
  elapse(500); expect(bridge.read().battle.tick - first).toBeLessThanOrEqual(10);
});

it('compact mode and pause preserve the same simulation and command log', () => {
  render(<SquadAdventure />); fireEvent.click(screen.getByRole('button', { name: 'Begin patrol' })); elapse(3000);
  fireEvent.click(screen.getByRole('button', { name: 'Pause' })); const paused = bridge.read().battle;
  fireEvent.click(screen.getByRole('button', { name: 'Compact view' })); elapse(5000);
  expect(bridge.read().battle).toBe(paused);
  fireEvent.click(screen.getByLabelText('Auto ultimates'));
  expect(bridge.read().battle.auto).toBe(false);
  expect(bridge.read().battle.commands.at(-1)?.command).toEqual({ type: 'auto', enabled: false });
});

it('priority buttons issue commands, and preparation resets only the local encounter', () => {
  render(<SquadAdventure />);
  fireEvent.click(screen.getByRole('button', { name: /Crumb Slinger/ }));
  expect(bridge.read().battle.focus).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Begin patrol' })); elapse(1000);
  fireEvent.click(screen.getByRole('button', { name: 'Prepare' }));
  expect(bridge.read().battle.tick).toBe(0); expect(bridge.read().battle.commands).toEqual([]);
  fireEvent.change(screen.getByLabelText('Squad'), { target: { value: 'cinders' } });
  expect(bridge.read().battle.actors.filter(a => a.side === 'hero').map(a => a.role)).toEqual(['witch', 'witch', 'alchemist']);
});

it('restores a paused encounter and does not grant a completed reward again', () => {
  let view = render(<SquadAdventure />);
  fireEvent.click(screen.getByRole('button', { name: 'Begin patrol' })); elapse(4000);
  const before = bridge.read().battle;
  view.unmount(); view = render(<SquadAdventure />);
  expect(bridge.read().battle.tick).toBe(before.tick);
  elapse(2000); expect(bridge.read().battle.tick).toBe(before.tick);
  fireEvent.click(screen.getByRole('button', { name: 'Resume' })); elapse(120000);
  const first = JSON.parse(localStorage.getItem('tbh.squad.lab.v2')!);
  expect(first.profile.coins).toBe(35); expect(first.run.settled).toBe(true);
  view.unmount(); render(<SquadAdventure />); elapse(4000);
  expect(JSON.parse(localStorage.getItem('tbh.squad.lab.v2')!).profile.coins).toBe(35);
});

it('unlocks recruitment and the free equipment choice after a real patrol win', () => {
  render(<SquadAdventure />); fireEvent.click(screen.getByRole('button', { name: 'Begin patrol' })); elapse(120000);
  fireEvent.click(screen.getByText(/Camp & loadouts/));
  fireEvent.click(screen.getByRole('button', { name: /Recruit Pepper/ }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Choose free gift' })[0]!);
  fireEvent.change(screen.getByLabelText('Cat 1 weapon'), { target: { value: 'counter' } });
  fireEvent.change(screen.getByLabelText('Cat 2'), { target: { value: 'rogue' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save team' }));
  fireEvent.click(screen.getByRole('button', { name: 'Retry encounter' }));
  const team = bridge.read().battle.actors;
  expect(team[0]!.gear).toContain('counter'); expect(team[1]!.role).toBe('rogue');
  expect(JSON.parse(localStorage.getItem('tbh.squad.lab.v2')!).profile.presets).toHaveLength(1);
});

it('preserves an unreadable existing save rather than replacing it', () => {
  localStorage.setItem('tbh.squad.lab.v2', '{"version":99}');
  render(<SquadAdventure />); fireEvent.click(screen.getByRole('button', { name: 'Begin patrol' })); elapse(5000);
  expect(localStorage.getItem('tbh.squad.lab.v2')).toBe('{"version":99}');
  expect(screen.getByText(/existing save could not be opened/)).toBeTruthy();
});
