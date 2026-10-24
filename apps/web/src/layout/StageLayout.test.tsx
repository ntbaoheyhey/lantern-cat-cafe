// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('../GameCanvas', () => ({ GameCanvas: () => <div data-testid="game-canvas" /> }));

import { App } from '../App';
import { getGameLoop } from '../game/store';
import { resetHelpForTests } from '../onboarding/helpStore';
import { MINI_MODE_KEY } from './useMiniMode';

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

beforeEach(() => {
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
  expect(screen.queryByRole('button', { name: 'Mini mode' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Stage' })).toBeNull();
});

it('desktop: top bar, stage, character area and the five tabs', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1, name: 'Taskbar Hero' })).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Game stage' })).toBeTruthy();
  expect(screen.getByTestId('game-canvas')).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Character' })).toBeTruthy();
  expect(screen.getByTestId('hero-power')).toBeTruthy();
  expect(screen.getByTestId('gold-counter')).toBeTruthy();
  expect(screen.queryByRole('region', { name: 'Café board' })).toBeNull();
  expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
    'Inventory', 'Boss', 'Forge', 'Market', 'Help',
  ]);
  expect(screen.getByRole('tab', { name: 'Inventory' }).getAttribute('aria-selected')).toBe('true');
  fireEvent.click(screen.getByRole('tab', { name: 'Forge' }));
  expect(screen.getByRole('heading', { name: 'Forge' })).toBeTruthy();
  fireEvent.click(screen.getByRole('tab', { name: 'Help' }));
  expect(screen.getByRole('tabpanel', { name: 'Help' }).textContent).toContain('Mochi the cat naps');
});

it('phone: bottom nav opens and closes a bottom sheet', () => {
  setViewport(390, 844);
  render(<App />);
  const nav = screen.getByRole('navigation', { name: 'Game menu' });
  expect(nav).toBeTruthy();
  expect(screen.queryByRole('tabpanel')).toBeNull(); // hidden while closed
  fireEvent.click(screen.getByRole('tab', { name: 'Boss' }));
  expect(screen.getByRole('tabpanel', { name: 'Boss' })).toBeTruthy();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('tabpanel')).toBeNull();
  fireEvent.click(screen.getByRole('tab', { name: 'Market' }));
  fireEvent.click(screen.getByRole('button', { name: 'Close panel' }));
  expect(screen.queryByRole('tabpanel')).toBeNull();
});

it('Mini mode shows the classic strip, is remembered, and Stage goes back', () => {
  const view = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Mini mode' }));
  expect(screen.getByRole('region', { name: 'Taskbar strip' })).toBeTruthy();
  expect(screen.queryByRole('region', { name: 'Game stage' })).toBeNull();
  expect(localStorage.getItem(MINI_MODE_KEY)).toBe('1');

  view.unmount();
  render(<App />);
  expect(screen.getByRole('region', { name: 'Taskbar strip' })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Stage' }));
  expect(screen.getByRole('region', { name: 'Game stage' })).toBeTruthy();
  expect(localStorage.getItem(MINI_MODE_KEY)).toBe('0');
});

it('Mini mode still works when localStorage throws', () => {
  const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  try {
    render(<App />);
    // The How to play dialog opens when its flag cannot be read; it does not stop the toggle.
    fireEvent.click(screen.getByRole('button', { name: 'Mini mode' }));
    expect(screen.getByRole('region', { name: 'Taskbar strip' })).toBeTruthy();
  } finally {
    get.mockRestore();
    set.mockRestore();
  }
});
