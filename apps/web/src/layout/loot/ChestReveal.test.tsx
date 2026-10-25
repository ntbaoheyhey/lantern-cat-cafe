// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ItemV2, LootV2 } from '../../api/GameApiV2';
import * as reducedMotionModule from '../../motion/reducedMotion';
import { ChestReveal } from './ChestReveal';

const SAMPLE_SWORD_1: ItemV2 = {
  id: 'sword-1',
  itemKey: 'wpn.sword.twig',
  slot: 'weapon',
  weaponType: 'sword',
  rarity: 'common',
  level: 1,
  bonus: [],
  locked: false,
  equipped: false,
};

const SAMPLE_SWORD_2: ItemV2 = {
  id: 'sword-2',
  itemKey: 'wpn.sword.tin',
  slot: 'weapon',
  weaponType: 'sword',
  rarity: 'uncommon',
  level: 2,
  bonus: [],
  locked: false,
  equipped: false,
};

const SAMPLE_CHEST: LootV2 = {
  fish: 500,
  yarn: 0,
  keys: 0,
  materials: {},
  items: [SAMPLE_SWORD_1, SAMPLE_SWORD_2],
  autoSalvaged: [],
};

describe('ChestReveal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('reveals items one by one (after 150 ms one more is visible)', () => {
    const onDone = vi.fn();
    render(<ChestReveal chest={SAMPLE_CHEST} firstClear={false} onDone={onDone} />);

    // Initial state: chest is closed, nothing revealed yet, button is Skip
    expect(screen.getByRole('button', { name: 'Skip' })).toBeTruthy();
    expect(screen.queryByText('+500 Fish')).toBeNull();
    expect(screen.queryByText('Twig Sword')).toBeNull();
    expect(screen.queryByText('Tin Whisker Blade')).toBeNull();

    // Step 1: after 150 ms, chest opens and first line (+500 Fish) is visible
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByText('+500 Fish')).toBeTruthy();
    expect(screen.queryByText('Twig Sword')).toBeNull();
    expect(screen.queryByText('Tin Whisker Blade')).toBeNull();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeTruthy();

    // Step 2: after another 150 ms, one more item (Twig Sword) is visible
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByText('+500 Fish')).toBeTruthy();
    expect(screen.getByText('Twig Sword')).toBeTruthy();
    expect(screen.queryByText('Tin Whisker Blade')).toBeNull();

    // Step 3: after another 150 ms, final item (Tin Whisker Blade) is visible, button becomes Collect
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByText('+500 Fish')).toBeTruthy();
    expect(screen.getByText('Twig Sword')).toBeTruthy();
    expect(screen.getByText('Tin Whisker Blade')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Collect' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
  });

  it('Skip shows all at once and the button becomes Collect', () => {
    const onDone = vi.fn();
    render(<ChestReveal chest={SAMPLE_CHEST} firstClear={false} onDone={onDone} />);

    const skipBtn = screen.getByRole('button', { name: 'Skip' });
    fireEvent.click(skipBtn);

    expect(screen.getByText('+500 Fish')).toBeTruthy();
    expect(screen.getByText('Twig Sword')).toBeTruthy();
    expect(screen.getByText('Tin Whisker Blade')).toBeTruthy();

    const collectBtn = screen.getByRole('button', { name: 'Collect' });
    expect(collectBtn).toBeTruthy();

    // Clicking Collect now calls onDone
    fireEvent.click(collectBtn);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('Collect and Escape call onDone once', () => {
    const onDoneCollect = vi.fn();
    render(<ChestReveal chest={SAMPLE_CHEST} firstClear={false} onDone={onDoneCollect} />);

    // Skip to finish and click Collect
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    fireEvent.click(screen.getByRole('button', { name: 'Collect' }));
    expect(onDoneCollect).toHaveBeenCalledTimes(1);

    cleanup();

    // Escape calls onDone
    const onDoneEscape = vi.fn();
    render(<ChestReveal chest={SAMPLE_CHEST} firstClear={false} onDone={onDoneEscape} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDoneEscape).toHaveBeenCalledTimes(1);
  });

  it('reduced motion shows everything immediately and button is Collect from the start', () => {
    vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(true);

    const onDone = vi.fn();
    render(<ChestReveal chest={SAMPLE_CHEST} firstClear={false} onDone={onDone} />);

    // Shows everything immediately
    expect(screen.getByText('+500 Fish')).toBeTruthy();
    expect(screen.getByText('Twig Sword')).toBeTruthy();
    expect(screen.getByText('Tin Whisker Blade')).toBeTruthy();

    // Button is Collect from the start
    expect(screen.getByRole('button', { name: 'Collect' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
  });

  it('first clear shows the gold chest (query data-icon="chestGoldOpen" after the open step)', () => {
    const onDone = vi.fn();
    const { container } = render(
      <ChestReveal chest={SAMPLE_CHEST} firstClear={true} onDone={onDone} />,
    );

    // Before open step: closed gold chest
    expect(container.querySelector('[data-icon="chestGold"]')).toBeTruthy();
    expect(container.querySelector('[data-icon="chestGoldOpen"]')).toBeNull();

    // Open step: advance 150 ms
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(container.querySelector('[data-icon="chestGoldOpen"]')).toBeTruthy();
  });

  it('unmount clears timers without state update warnings', () => {
    const onDone = vi.fn();
    const { unmount } = render(
      <ChestReveal chest={SAMPLE_CHEST} firstClear={false} onDone={onDone} />,
    );

    // Unmount while timers are active
    unmount();

    // Advancing timers should not throw or warn
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onDone).not.toHaveBeenCalled();
  });

  it('Tab from the last focusable element goes to the first', () => {
    const onDone = vi.fn();
    render(<ChestReveal chest={SAMPLE_CHEST} firstClear={false} onDone={onDone} />);

    const button = screen.getByRole('button', { name: 'Skip' });
    button.focus();
    expect(document.activeElement).toBe(button);

    // Press Tab
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(button);
  });
});
