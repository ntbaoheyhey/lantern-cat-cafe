// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ItemV2, LootV2 } from '../../api/GameApiV2';
import { backdropFor } from '../../art/backdrops';
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
    const { baseElement: container } = render(
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

  describe('V19c: Chapter room backdrop', () => {
    it('with chapter 3 dialog contains exactly one svg[data-backdrop="bathroom"] with aria-hidden="true" and accessible name unchanged', () => {
      const { baseElement: container } = render(
        <ChestReveal chest={SAMPLE_CHEST} firstClear={false} onDone={vi.fn()} chapter={3} />,
      );

      const backdrops = container.querySelectorAll('.chest-reveal-dialog svg[data-backdrop="bathroom"]');
      expect(backdrops).toHaveLength(1);
      const svg = backdrops[0];
      expect(svg?.getAttribute('aria-hidden')).toBe('true');

      // Accessible name of dialog is unchanged (still the heading "Boss chest")
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeTruthy();
      expect(dialog.getAttribute('aria-labelledby')).toBe(
        screen.getByRole('heading', { level: 2, name: 'Boss chest' }).id,
      );
      expect(screen.getByRole('heading', { level: 2, name: 'Boss chest' })).toBeTruthy();
    });

    it('without chapter there is no [data-backdrop]', () => {
      const { baseElement: container } = render(
        <ChestReveal chest={SAMPLE_CHEST} firstClear={false} onDone={vi.fn()} />,
      );
      expect(container.querySelector('[data-backdrop]')).toBeNull();
    });

    it('for chapters 1-5 the backdrop id matches backdropFor(n).id', () => {
      for (let ch = 1; ch <= 5; ch++) {
        const expectedId = backdropFor(ch).id;
        const { baseElement: container, unmount } = render(
          <ChestReveal chest={SAMPLE_CHEST} firstClear={false} onDone={vi.fn()} chapter={ch} />,
        );
        const svg = container.querySelector('.chest-reveal-dialog svg[data-backdrop]');
        expect(svg?.getAttribute('data-backdrop')).toBe(expectedId);
        expect(svg?.getAttribute('aria-hidden')).toBe('true');
        unmount();
      }
    });
  });

  describe('V19c / A18 Finding #1: Focus restore', () => {
    it('restores focus to trigger button after unmount and after pressing Escape', () => {
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      // Part 1: focus restored on unmount
      const { unmount } = render(
        <ChestReveal chest={SAMPLE_CHEST} firstClear={false} onDone={vi.fn()} />,
      );
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Skip' }));
      unmount();
      expect(document.activeElement).toBe(trigger);

      // Part 2: focus restored after pressing Escape
      const onDone = vi.fn();
      // Match StageLayout: onDone removes the controlled dialog before restoring focus.
      const view = render(<ChestReveal chest={SAMPLE_CHEST} firstClear={false}
        onDone={() => { onDone(); view.unmount(); }} />);
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Skip' }));
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(trigger);

      document.body.removeChild(trigger);
    });
  });
});
