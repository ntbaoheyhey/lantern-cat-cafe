// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as reducedMotionModule from '../../motion/reducedMotion';
import { sampleServerStateV2 } from '../a11y/fixtures';
import { HudBar } from './HudBar';

describe('HUD accessibility audit (hud.a11y.test.tsx)', () => {
  beforeEach(() => {
    vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('verifies accessibility requirements across the entire HUD', () => {
    const state = sampleServerStateV2({
      level: 12,
      chapter: 2,
      round: 3,
      kills: 4,
      killsPerRound: 10,
      gated: true,
      neededPower: 1500,
      keys: 2,
    });

    const { container } = render(<HudBar state={state} power={1200} />);

    // 1. The section has accessible name "Cat status"
    const section = screen.getByRole('region', { name: 'Cat status' });
    expect(section).toBeTruthy();
    expect(section.tagName.toLowerCase()).toBe('section');

    // 2. Every icon is aria-hidden
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });

    // 3. No element has tabIndex > 0
    const elementsWithTabIndex = container.querySelectorAll<HTMLElement>('[tabindex]');
    elementsWithTabIndex.forEach((el) => {
      expect(el.tabIndex).toBeLessThanOrEqual(0);
    });

    // 4. No heading levels are skipped (no headings at all is fine)
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
    expect(headings).toHaveLength(0);

    // 5. Progressbar has all required aria attributes
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-label')).toBe('Experience');
    expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressbar.getAttribute('aria-valuemax')).toBeTruthy();
    expect(progressbar.getAttribute('aria-valuenow')).toBeTruthy();
    expect(progressbar.getAttribute('aria-valuetext')).toBeTruthy();

    // 6. Gated hint is announced via role="status"
    const statusHint = screen.getByRole('status');
    expect(statusHint.textContent).toContain('Needs about 1,500 power: upgrade your weapon');
  });

  it('respects reduced motion when active', () => {
    vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(true);

    const state = sampleServerStateV2();
    const { container } = render(<HudBar state={state} power={1000} />);

    const fill = container.querySelector('.hud-xp-fill') as HTMLElement;
    expect(fill).toBeTruthy();
    expect(fill.className).not.toMatch(/animated|transition/);
    expect(fill.style.transition).toBe('none');
  });
});
