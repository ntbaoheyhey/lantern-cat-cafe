import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChapterMap } from './ChapterMap';

describe('ChapterMap Component', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Default mock: reduced motion is false
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('renders five chapters', () => {
    render(<ChapterMap currentChapter={1} clearedChapters={[]} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);

    // Verify all 5 chapter names are displayed
    expect(screen.getByText('Living Room')).toBeTruthy();
    expect(screen.getByText('Kitchen')).toBeTruthy();
    expect(screen.getByText('Bathroom')).toBeTruthy();
    expect(screen.getByText('Basement')).toBeTruthy();
    expect(screen.getByText('Night Rooftops')).toBeTruthy();

    // Verify all 5 bosses are displayed
    expect(screen.getByText('Yarn Giant')).toBeTruthy();
    expect(screen.getByText('Cucumber Scare')).toBeTruthy();
    expect(screen.getByText('Bathtub Tyrant')).toBeTruthy();
    expect(screen.getByText('Vacuum Beast')).toBeTruthy();
    expect(screen.getByText('Laser Dot Phantom')).toBeTruthy();
  });

  it('locked chapter does not call onSelect', () => {
    const onSelect = vi.fn();
    render(<ChapterMap currentChapter={1} clearedChapters={[]} onSelect={onSelect} />);

    // Chapters 2 through 5 should be locked
    const lockedBtn = screen.getByRole('button', { name: /kitchen/i });
    expect(lockedBtn.getAttribute('aria-disabled')).toBe('true');
    expect(lockedBtn.classList.contains('v2-map-node--locked')).toBe(true);

    // Locked chapter carries reason via aria-describedby
    const reasonId = lockedBtn.getAttribute('aria-describedby');
    expect(reasonId).toBeTruthy();
    const reasonEl = document.getElementById(reasonId!);
    expect(reasonEl).toBeTruthy();
    expect(reasonEl?.textContent).toMatch(/Complete Chapter 1 first/i);

    // Clicking locked chapter does NOT invoke onSelect
    fireEvent.click(lockedBtn);
    expect(onSelect).not.toHaveBeenCalled();

    // Keyboard activation (Enter / Space) does NOT invoke onSelect
    fireEvent.keyDown(lockedBtn, { key: 'Enter', code: 'Enter' });
    fireEvent.keyDown(lockedBtn, { key: ' ', code: 'Space' });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('cleared chapter calls onSelect with its number', () => {
    const onSelect = vi.fn();
    render(<ChapterMap currentChapter={2} clearedChapters={[1]} onSelect={onSelect} />);

    // Chapter 1 is cleared
    const clearedBtn = screen.getByRole('button', { name: /living room/i });
    expect(clearedBtn.classList.contains('v2-map-node--cleared')).toBe(true);
    expect(clearedBtn.classList.contains('v2-map-node--rematch')).toBe(true);
    expect(clearedBtn.getAttribute('aria-disabled')).toBeNull();

    // Should display rematch badge
    const rematchBadge = screen.getByTestId('rematch-badge');
    expect(rematchBadge).toBeTruthy();
    expect(rematchBadge.textContent).toBe('Rematch');

    // Clicking cleared chapter calls onSelect with chapter number 1
    fireEvent.click(clearedBtn);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('current chapter has aria-current', () => {
    render(<ChapterMap currentChapter={3} clearedChapters={[1, 2]} round={4} />);

    const currentBtn = screen.getByRole('button', { name: /bathroom/i });
    expect(currentBtn.getAttribute('aria-current')).toBe('step');

    // Other chapters must not have aria-current
    const ch1Btn = screen.getByRole('button', { name: /living room/i });
    const ch2Btn = screen.getByRole('button', { name: /kitchen/i });
    const ch4Btn = screen.getByRole('button', { name: /basement/i });
    const ch5Btn = screen.getByRole('button', { name: /night rooftops/i });

    expect(ch1Btn.getAttribute('aria-current')).toBeNull();
    expect(ch2Btn.getAttribute('aria-current')).toBeNull();
    expect(ch4Btn.getAttribute('aria-current')).toBeNull();
    expect(ch5Btn.getAttribute('aria-current')).toBeNull();

    // Current chapter shows round n/10
    const roundIndicator = screen.getByTestId('round-indicator');
    expect(roundIndicator).toBeTruthy();
    expect(roundIndicator.textContent).toBe('Round 4/10');
  });

  it('reduced motion removes the pulse class (mock matchMedia)', () => {
    // 1. Without reduced motion: current chapter HAS the pulse class
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = render(<ChapterMap currentChapter={2} clearedChapters={[1]} />);
    const activeBtnWithMotion = screen.getByRole('button', { name: /kitchen/i });
    expect(activeBtnWithMotion.classList.contains('pulse')).toBe(true);
    unmount();

    // 2. With reduced motion: current chapter DOES NOT have the pulse class
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<ChapterMap currentChapter={2} clearedChapters={[1]} />);
    const activeBtnReducedMotion = screen.getByRole('button', { name: /kitchen/i });
    expect(activeBtnReducedMotion.classList.contains('pulse')).toBe(false);
  });

  it('keyboard order follows the chapters', () => {
    render(<ChapterMap currentChapter={2} clearedChapters={[1]} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);

    // In DOM order: Chapter 1 -> Chapter 2 -> Chapter 3 -> Chapter 4 -> Chapter 5
    expect(buttons[0]?.getAttribute('data-chapter')).toBe('1');
    expect(buttons[1]?.getAttribute('data-chapter')).toBe('2');
    expect(buttons[2]?.getAttribute('data-chapter')).toBe('3');
    expect(buttons[3]?.getAttribute('data-chapter')).toBe('4');
    expect(buttons[4]?.getAttribute('data-chapter')).toBe('5');

    // All buttons are focusable in tab sequence (none have HTML disabled attribute)
    buttons.forEach((btn) => {
      expect(btn.getAttribute('disabled')).toBeNull();
    });
  });

  it('accepts Set for clearedChapters', () => {
    const onSelect = vi.fn();
    render(<ChapterMap currentChapter={3} clearedChapters={new Set([1, 2])} onSelect={onSelect} />);

    const ch1 = screen.getByRole('button', { name: /living room/i });
    const ch2 = screen.getByRole('button', { name: /kitchen/i });
    expect(ch1.classList.contains('v2-map-node--cleared')).toBe(true);
    expect(ch2.classList.contains('v2-map-node--cleared')).toBe(true);

    fireEvent.click(ch2);
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
