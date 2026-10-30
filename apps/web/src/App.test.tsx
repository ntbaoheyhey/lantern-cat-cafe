// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('./GameCanvas', () => ({ GameCanvas: () => <div data-testid="game-canvas" /> }));
vi.mock('./layout/flag', () => ({ isGameV2: () => false }));

import { App } from './App';
import { getGameLoop } from './game/store';
import { resetHelpForTests } from './onboarding/helpStore';

beforeEach(() => {
  localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  act(() => resetHelpForTests());
});

afterEach(() => {
  getGameLoop().stop();
  cleanup();
});

it('shows the strip with the game and no panel initially', () => {
  render(<App />);
  expect(screen.getByRole('region', { name: 'Taskbar strip' })).toBeTruthy();
  expect(screen.getByTestId('game-canvas')).toBeTruthy();
  expect(screen.queryByRole('region', { name: 'Game panel' })).toBeNull();
});

it('renders the page above the strip with title, copy, Mochi card, and next-step hint', async () => {
  await act(async () => {
    await getGameLoop().start(document);
  });
  render(<App />);

  // Title in display font
  const title = screen.getByRole('heading', { level: 1, name: 'Taskbar Hero' });
  expect(title).toBeTruthy();

  // One line of copy
  expect(
    screen.getByText('Your cat fights on its own. Collect fish, upgrade gear, beat the bosses.'),
  ).toBeTruthy();

  // Mochi the cat card
  const catCard = screen.getByRole('region', { name: 'Mochi the cat' });
  expect(catCard.classList.contains('pixel-card')).toBe(true);
  expect(screen.getByRole('heading', { level: 2, name: 'Mochi the cat' })).toBeTruthy();
  expect(screen.getByRole('img', { name: 'Portrait of Mochi the cat' })).toBeTruthy();
  expect(screen.getByTestId('cat-card-power')).toBeTruthy();
  expect(screen.getByTestId('cat-card-boss-level')).toBeTruthy();

  // Highlighted next-step hint card
  const hintCard = screen.getByTestId('next-hint');
  expect(hintCard.classList.contains('pixel-card')).toBe(true);

  // Cafe board regions and cards
  expect(screen.getByRole('region', { name: 'Café board' })).toBeTruthy();
  expect(screen.getByRole('region', { name: "Today's quest" })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 2, name: "Today's Quest" })).toBeTruthy();
  expect(screen.getByTestId('cafe-boss-progress')).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Relic shelf' })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 2, name: 'Relic Shelf' })).toBeTruthy();
  expect(screen.getByTestId('relic-shelf-slot')).toBeTruthy();
});

it('toggles the panel with the strip button', () => {
  render(<App />);
  const toggle = screen.getByRole('button', { name: 'Menu' });
  expect(toggle.getAttribute('aria-expanded')).toBe('false');

  fireEvent.click(toggle);
  expect(screen.getByRole('region', { name: 'Game panel' })).toBeTruthy();
  expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
    'Hero', 'Inventory', 'Boss', 'Forge', 'Market',
  ]);
  expect(screen.getByRole('button', { name: 'Close' }).getAttribute('aria-expanded')).toBe('true');

  fireEvent.click(screen.getByRole('tab', { name: 'Forge' }));
  expect(screen.getByRole('heading', { name: 'Forge' })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('region', { name: 'Game panel' })).toBeNull();
});
