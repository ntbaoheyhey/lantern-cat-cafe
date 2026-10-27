// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as reducedMotionModule from '../../motion/reducedMotion';
import { ChestReveal } from '../loot/ChestReveal';
import { LootSummary } from '../loot/LootSummary';
import { WelcomeBack } from '../loot/WelcomeBack';
import {
  chestRevealProps,
  emptyGainsV2,
  emptyLootV2,
  lootSummaryProps,
  sampleGainsV2,
  sampleLootV2,
  welcomeBackProps,
} from './fixtures';

describe('v2 Loot accessibility & reduced-motion audit', () => {
  beforeEach(() => {
    vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('LootSummary', () => {
    it('check 1 & 2: controls have accessible names and no positive tabIndex', () => {
      const { container } = render(<LootSummary {...lootSummaryProps()} />);
      const controls = container.querySelectorAll<HTMLElement>('button, a[href], [role="button"], [role="link"]');
      controls.forEach((el) => {
        const name = el.getAttribute('aria-label') || el.textContent?.trim();
        expect(name).toBeTruthy();
      });
      const withTabIndex = container.querySelectorAll<HTMLElement>('[tabindex]');
      withTabIndex.forEach((el) => {
        expect(el.tabIndex).toBeLessThanOrEqual(0);
      });
    });

    it('check 3: decorative pixel art and frames have aria-hidden', () => {
      const { container } = render(<LootSummary {...lootSummaryProps()} />);
      const icons = container.querySelectorAll('svg[data-icon]');
      icons.forEach((icon) => {
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });
      const frames = container.querySelectorAll('svg[data-frame]');
      frames.forEach((frame) => {
        expect(frame.getAttribute('aria-hidden')).toBe('true');
      });
      const badges = container.querySelectorAll('.loot-line-badge');
      badges.forEach((b) => {
        expect(b.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('check 4: heading level matches requested prop and links section without skipped levels', () => {
      const { container, rerender } = render(
        <LootSummary {...lootSummaryProps({ heading: 'Level 2 Heading', headingLevel: 2 })} />,
      );
      const h2 = screen.getByRole('heading', { level: 2, name: 'Level 2 Heading' });
      expect(h2).toBeTruthy();
      expect(container.querySelector('section')?.getAttribute('aria-labelledby')).toBe(h2.id);

      rerender(<LootSummary {...lootSummaryProps({ heading: 'Level 3 Heading', headingLevel: 3 })} />);
      const h3 = screen.getByRole('heading', { level: 3, name: 'Level 3 Heading' });
      expect(h3).toBeTruthy();
      expect(container.querySelector('section')?.getAttribute('aria-labelledby')).toBe(h3.id);
    });

    it('check 7: rarity is never colour-only and renders text label next to frame', () => {
      render(<LootSummary {...lootSummaryProps()} />);
      expect(screen.getByText('Common')).toBeTruthy();
      expect(screen.getByText('Uncommon')).toBeTruthy();
    });

    it('check 8: numbers shown equal props with no rounding surprises', () => {
      const loot = sampleLootV2({
        fish: 1250,
        yarn: 25,
        keys: 1,
        materials: { fluffTuft: 4 },
      });
      render(<LootSummary {...lootSummaryProps({ loot })} />);
      expect(screen.getByText('+1,250 Fish')).toBeTruthy();
      expect(screen.getByText('+25 Yarn')).toBeTruthy();
      expect(screen.getByText('+1 Cat Key')).toBeTruthy();
      expect(screen.getByText('+4 Fluff Tuft')).toBeTruthy();
    });

    it('empty edge case: renders accessible empty notice linked to heading', () => {
      const { container } = render(
        <LootSummary {...lootSummaryProps({ loot: emptyLootV2(), heading: 'Empty Chest' })} />,
      );
      const heading = screen.getByRole('heading', { level: 2, name: 'Empty Chest' });
      expect(screen.getByText('Nothing new this time.')).toBeTruthy();
      expect(container.querySelector('section')?.getAttribute('aria-labelledby')).toBe(heading.id);
    });
  });

  describe('ChestReveal', () => {
    it('check 1 & 2: action button has non-empty accessible name and no positive tabIndex', () => {
      const { container } = render(<ChestReveal {...chestRevealProps()} />);
      const btn = screen.getByRole('button');
      expect(btn.textContent?.trim()).toMatch(/^(Skip|Collect)$/);
      const withTabIndex = container.querySelectorAll<HTMLElement>('[tabindex]');
      withTabIndex.forEach((el) => {
        expect(el.tabIndex).toBeLessThanOrEqual(0);
      });
    });

    it('check 3: chest icon has role img and accessible label', () => {
      const { container } = render(<ChestReveal {...chestRevealProps({ firstClear: false })} />);
      const icon = container.querySelector('.chest-reveal-icon-wrap svg');
      expect(icon?.getAttribute('role')).toBe('img');
      expect(icon?.getAttribute('aria-label')).toBe('Boss chest');
    });

    it('check 4: heading hierarchy has single top h2 and sub-heading h3 without skips', () => {
      render(<ChestReveal {...chestRevealProps()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2.textContent).toBe('Boss chest');
      const h3 = screen.getByRole('heading', { level: 3 });
      expect(h3.textContent).toBe('Rewards');
    });

    it('check 5: dialog role, aria-modal, heading label, focus on open, Escape, and Tab trap', () => {
      const onDone = vi.fn();
      const { container } = render(<ChestReveal {...chestRevealProps({ onDone })} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      const title = container.querySelector('.chest-reveal-title');
      expect(dialog.getAttribute('aria-labelledby')).toBe(title?.id);

      const actionBtn = screen.getByRole('button', { name: 'Skip' });
      expect(document.activeElement).toBe(actionBtn);

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
      expect(document.activeElement).toBe(actionBtn);
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(actionBtn);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('check 6: reduced motion skips straight to final content with Collect button', () => {
      vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(true);
      render(<ChestReveal {...chestRevealProps()} />);

      expect(screen.getByRole('button', { name: 'Collect' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
      expect(screen.getByText('+1,250 Fish')).toBeTruthy();
      expect(screen.getByText('Twig Sword')).toBeTruthy();
    });

    it('check 7 & 8: firstClear shows distinct title and numbers match props', () => {
      render(<ChestReveal {...chestRevealProps({ firstClear: true })} />);
      expect(screen.getByRole('heading', { level: 2, name: 'First clear chest!' })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
      expect(screen.getByText('+1,250 Fish')).toBeTruthy();
      expect(screen.getByText('+25 Yarn')).toBeTruthy();
    });
  });

  describe('WelcomeBack', () => {
    it('check 1 & 2: OK button has accessible name and no positive tabIndex', () => {
      const { container } = render(<WelcomeBack {...welcomeBackProps()} />);
      const btn = screen.getByRole('button', { name: 'OK' });
      expect(btn).toBeTruthy();
      const withTabIndex = container.querySelectorAll<HTMLElement>('[tabindex]');
      withTabIndex.forEach((el) => {
        expect(el.tabIndex).toBeLessThanOrEqual(0);
      });
    });

    it('check 4: heading hierarchy has single top h2 and sub-heading h3', () => {
      render(<WelcomeBack {...welcomeBackProps()} />);
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2.textContent).toBe('Welcome back!');
      const h3 = screen.getByRole('heading', { level: 3 });
      expect(h3.textContent).toBe('While you were away');
    });

    it('check 5: dialog role, aria-modal, heading label, focus on open, Escape, and Tab trap', () => {
      const onClose = vi.fn();
      const { container } = render(<WelcomeBack {...welcomeBackProps({ onClose })} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      const title = container.querySelector('.welcome-back-title');
      expect(dialog.getAttribute('aria-labelledby')).toBe(title?.id);

      const okBtn = screen.getByRole('button', { name: 'OK' });
      expect(document.activeElement).toBe(okBtn);

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
      expect(document.activeElement).toBe(okBtn);
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(okBtn);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('check 6, 7 & 8: renders offline numbers and formats duration without surprises', () => {
      render(<WelcomeBack {...welcomeBackProps({ awaySeconds: 8100 })} />);
      expect(screen.getByText('Your cat kept going for 2 h 15 min.')).toBeTruthy();
      expect(screen.getByText('+1,250 Fish')).toBeTruthy();
      expect(screen.getByText('+25 Yarn')).toBeTruthy();
      expect(screen.getByText('Common')).toBeTruthy();
    });

    it('duration cap edge case: awaySeconds exceeding offline cap explains cap', () => {
      render(<WelcomeBack {...welcomeBackProps({ awaySeconds: 30000 })} />);
      expect(screen.getByText('Your cat kept going for 8 h (the most a claim counts).')).toBeTruthy();
    });

    it('empty / short duration edge cases: renders nothing under 300s or empty gains', () => {
      const { container, rerender } = render(
        <WelcomeBack {...welcomeBackProps({ awaySeconds: 120 })} />,
      );
      expect(container.firstChild).toBeNull();

      rerender(<WelcomeBack {...welcomeBackProps({ gains: emptyGainsV2(), awaySeconds: 3600 })} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
