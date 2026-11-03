// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HelpButton, HowToPlay } from './HowToPlay';
import { resetHelpForTests } from './helpStore';

beforeEach(() => {
  localStorage.clear();
  act(() => resetHelpForTests());
});
afterEach(cleanup);

const dialog = () => screen.queryByRole('dialog', { name: 'How to play' });

it('shows on first visit with five steps and focuses Start playing', () => {
  render(<HowToPlay />);
  const d = dialog();
  expect(d).not.toBeNull();
  expect(d?.classList.contains('fx-pop')).toBe(true);
  expect(d?.classList.contains('pixel-card')).toBe(true);

  const items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(5);
  expect(screen.getByText(/up to 8 h/)).toBeTruthy();
  expect(screen.getByText(/5 fights a day/)).toBeTruthy();
  expect(screen.getByText(/Demo mode works without a wallet/)).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Start playing' }));

  // Each of the 5 steps gets its PixelIcon and numbered badge
  const icons = ['paw', 'sword', 'bag', 'flask', 'shop'];
  icons.forEach((name, i) => {
    expect(d?.querySelector(`svg[data-icon="${name}"]`)).not.toBeNull();
    expect(items[i]?.textContent).toContain(String(i + 1));
  });
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

describe('focus return on first auto-open', () => {
  it('returns focus to the menu toggle when closed via Start playing', () => {
    render(
      <>
        <button className="toggle" aria-controls="game-panel">Menu</button>
        <HowToPlay />
      </>,
    );
    expect(dialog()).not.toBeNull();
    const startBtn = screen.getByRole('button', { name: 'Start playing' });
    fireEvent.click(startBtn);
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Menu' }));
  });

  it('returns focus to the menu toggle when closed via the close (x) button', () => {
    render(
      <>
        <button className="toggle" aria-controls="game-panel">Menu</button>
        <HowToPlay />
      </>,
    );
    expect(dialog()).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close help' }));
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Menu' }));
  });

  it('returns focus to the menu toggle when closed via Escape', () => {
    render(
      <>
        <button className="toggle" aria-controls="game-panel">Menu</button>
        <HowToPlay />
      </>,
    );
    expect(dialog()).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Menu' }));
  });

  it('returns focus to the menu toggle when closed via backdrop click', () => {
    render(
      <>
        <button className="toggle" aria-controls="game-panel">Menu</button>
        <HowToPlay />
      </>,
    );
    const backdrop = document.querySelector('.help-backdrop')!;
    fireEvent.click(backdrop);
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Menu' }));
  });
});

describe('focus return when reopened via HelpButton', () => {
  beforeEach(() => {
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    act(() => resetHelpForTests());
  });

  it('returns focus to HelpButton when closed via Start playing', () => {
    render(
      <>
        <button className="toggle" aria-controls="game-panel">Menu</button>
        <HelpButton />
        <HowToPlay />
      </>,
    );
    const helpBtn = screen.getByRole('button', { name: 'How to play' });
    fireEvent.click(helpBtn);
    expect(dialog()).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Start playing' }));
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(helpBtn);
  });

  it('returns focus to HelpButton when closed via Close (x) button', () => {
    render(
      <>
        <button className="toggle" aria-controls="game-panel">Menu</button>
        <HelpButton />
        <HowToPlay />
      </>,
    );
    const helpBtn = screen.getByRole('button', { name: 'How to play' });
    fireEvent.click(helpBtn);
    expect(dialog()).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Close help' }));
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(helpBtn);
  });

  it('returns focus to HelpButton when closed via Escape key', () => {
    render(
      <>
        <button className="toggle" aria-controls="game-panel">Menu</button>
        <HelpButton />
        <HowToPlay />
      </>,
    );
    const helpBtn = screen.getByRole('button', { name: 'How to play' });
    fireEvent.click(helpBtn);
    expect(dialog()).not.toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(helpBtn);
  });

  it('returns focus to HelpButton when closed via backdrop click', () => {
    render(
      <>
        <button className="toggle" aria-controls="game-panel">Menu</button>
        <HelpButton />
        <HowToPlay />
      </>,
    );
    const helpBtn = screen.getByRole('button', { name: 'How to play' });
    fireEvent.click(helpBtn);
    expect(dialog()).not.toBeNull();

    const backdrop = document.querySelector('.help-backdrop')!;
    fireEvent.click(backdrop);
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(helpBtn);
  });
});

describe('HelpButton accessible name and visible label', () => {
  it('renders an accessible name and visible text "How to play"', () => {
    render(<HelpButton />);
    const btn = screen.getByRole('button', { name: 'How to play' });
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('How to play');
    expect(btn.textContent).toContain('How to play');
    expect(btn.textContent).toContain('?');
  });
});

describe('keyboard focus trapping inside dialog', () => {
  it('traps focus between first and last button with Tab and Shift+Tab', () => {
    render(<HowToPlay />);
    const closeBtn = screen.getByRole('button', { name: 'Close help' });
    const startBtn = screen.getByRole('button', { name: 'Start playing' });

    // Initial focus on Start playing
    expect(document.activeElement).toBe(startBtn);

    // Tab from last element wraps to first
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);

    // Shift+Tab from first element wraps to last
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(startBtn);
  });
});

it('v2 first-visit guidance matches current key, recipe and bag rules without classic claims', () => {
  render(<HowToPlay mode="v2" />);
  expect(screen.getAllByRole('listitem')).toHaveLength(5);
  expect(screen.getByText(/first claim each day grants 1 Cat Key/)).toBeTruthy();
  expect(screen.getByText(/A boss win spends 1; a loss keeps your key/)).toBeTruthy();
  expect(screen.getByText(/capacity 200/)).toBeTruthy();
  expect(screen.getByText(/30 Yarn and 1 Moon Pearl, up to 1 per day/)).toBeTruthy();
  expect(screen.queryByText(/5 fights a day|30 Yarn and 1 Cat Key|gear upgrades in Inventory/)).toBeNull();
});
