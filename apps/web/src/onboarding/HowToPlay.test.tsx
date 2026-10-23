// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { HelpButton, HowToPlay } from './HowToPlay';
import { resetHelpForTests } from './helpStore';

beforeEach(() => {
  localStorage.clear();
  act(() => resetHelpForTests());
});
afterEach(cleanup);

const dialog = () => screen.queryByRole('dialog', { name: 'How to play' });

it('shows on first visit with four steps and focuses Start playing', () => {
  render(<HowToPlay />);
  expect(dialog()).not.toBeNull();
  expect(screen.getAllByRole('listitem')).toHaveLength(4);
  expect(screen.getByText(/up to 8 h/)).toBeTruthy();
  expect(screen.getByText(/5 fights a day/)).toBeTruthy();
  expect(screen.getByText(/Demo mode works without a wallet/)).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Start playing' }));
});

it('stays closed after dismissal, even after a reload', () => {
  const { unmount } = render(<HowToPlay />);
  fireEvent.click(screen.getByRole('button', { name: 'Start playing' }));
  expect(dialog()).toBeNull();
  unmount();
  act(() => resetHelpForTests());
  render(<HowToPlay />);
  expect(dialog()).toBeNull();
});

it('reopens from the ? button and Esc closes it', () => {
  localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  act(() => resetHelpForTests());
  render(<><HelpButton /><HowToPlay /></>);
  expect(dialog()).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'How to play' }));
  expect(dialog()).not.toBeNull();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(dialog()).toBeNull();
});

it('still closes when localStorage throws', () => {
  const orig = Storage.prototype.setItem;
  Storage.prototype.setItem = () => {
    throw new Error('blocked');
  };
  try {
    render(<HowToPlay />);
    fireEvent.click(screen.getByRole('button', { name: 'Close help' }));
    expect(dialog()).toBeNull();
  } finally {
    Storage.prototype.setItem = orig;
  }
});
