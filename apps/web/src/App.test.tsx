// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('./GameCanvas', () => ({ GameCanvas: () => <div data-testid="game-canvas" /> }));

import { App } from './App';

afterEach(cleanup);

it('shows the strip with the game and no panel initially', () => {
  render(<App />);
  expect(screen.getByRole('region', { name: 'Taskbar strip' })).toBeTruthy();
  expect(screen.getByTestId('game-canvas')).toBeTruthy();
  expect(screen.queryByRole('region', { name: 'Game panel' })).toBeNull();
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
