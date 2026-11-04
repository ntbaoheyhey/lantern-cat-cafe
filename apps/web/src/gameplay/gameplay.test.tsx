// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { GuestCoach, COACH_KEY, isNewGuest } from './GuestCoach';
import { journeyGoals } from './goals';
import { sampleServerStateV2 } from '../layout/a11y/fixtures';
afterEach(() => { cleanup(); localStorage.clear(); window.history.replaceState({}, '', '/'); });
it('allows a demo entry without coaching while preserving a permanent dismissal', () => {
  window.history.replaceState({}, '', '/?demo&coach=off');
  expect(isNewGuest()).toBe(false);
  expect(localStorage.getItem(COACH_KEY)).toBeNull();
  window.history.replaceState({}, '', '/?demo');
  expect(isNewGuest()).toBe(true);
  localStorage.setItem(COACH_KEY, 'done');
  expect(isNewGuest()).toBe(false);
});
it('gives three non-modal tips and persists a forever dismissal', () => {
  const nav = vi.fn(); render(<GuestCoach enabled onNavigate={nav} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByText('Watch Mochi')); expect(nav).toHaveBeenCalledWith('home');
  fireEvent.click(screen.getByText('Next tip')); fireEvent.click(screen.getByText('Open Bag'));
  expect(nav).toHaveBeenCalledWith('bag');
  fireEvent.click(screen.getByText('Next tip')); fireEvent.click(screen.getByText('Done'));
  expect(screen.queryByTestId('guest-coach')).toBeNull(); expect(localStorage.getItem(COACH_KEY)).toBe('done');
  expect(isNewGuest()).toBe(false);
});
it('never coaches a returning or signed-in player automatically', () => {
  localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); expect(isNewGuest()).toBe(false);
  render(<GuestCoach enabled={false} onNavigate={vi.fn()} />); expect(screen.queryByTestId('guest-coach')).toBeNull();
});
it('offers an upgrade review without performing an equip action', () => {
  const state = sampleServerStateV2(); const before = structuredClone(state);
  const goals = journeyGoals(state); expect(goals.later).toBeTruthy(); expect(state).toEqual(before);
});
it('does not advertise a power wall as a boss unlock', () => {
  const state = sampleServerStateV2(); state.inventory = [];
  state.progress = { chapter: 1, round: 2, kills: 6, killsPerRound: 6, gated: true, neededPower: 80 };
  state.bosses.chapters = []; state.bosses.cooldownUntil = null;
  const goals = journeyGoals(state);
  expect(goals.now.text).toContain('power wall'); expect(goals.soon).toBe('48 foes to the chapter boss');
});
it('routes a completed chapter to real key or cooldown guidance instead of zero remaining foes', () => {
  const state = sampleServerStateV2(); state.inventory = [];
  state.progress = { chapter: 1, round: 10, kills: 6, killsPerRound: 6, gated: false, neededPower: 0 };
  state.bosses.chapters = []; state.bosses.cooldownUntil = null; state.currencies.keys = 0;
  expect(journeyGoals(state).now).toEqual({ text: 'Find a Cat Key for the boss', screen: 'map' });
  state.currencies.keys = 1; state.bosses.cooldownUntil = state.serverTime + 12;
  expect(journeyGoals(state).now).toEqual({ text: 'Boss rests · retry in 12s', screen: 'map' });
});
