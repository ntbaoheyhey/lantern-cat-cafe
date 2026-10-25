// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as reducedMotionModule from '../../motion/reducedMotion';
import { LevelXpBar } from './LevelXpBar';

describe('LevelXpBar', () => {
  beforeEach(() => {
    vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders level text and role progressbar with aria attributes', () => {
    render(<LevelXpBar level={12} xp={340} xpToNext={1200} />);

    expect(screen.getByText('Lv 12')).toBeTruthy();

    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('Experience');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('1200');
    expect(bar.getAttribute('aria-valuenow')).toBe('340');
    expect(bar.getAttribute('aria-valuetext')).toBe('340 / 1,200 XP');

    // Fill width is (340 / 1200) * 100 = 28.333...%
    const fill = bar.querySelector('.hud-xp-fill') as HTMLElement;
    expect(fill).toBeTruthy();
    const widthPct = parseFloat(fill.style.width);
    expect(widthPct).toBeCloseTo((340 / 1200) * 100, 1);
  });

  it('clamps width to 100% when xp > xpToNext', () => {
    render(<LevelXpBar level={12} xp={1500} xpToNext={1200} />);

    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('1500');
    expect(bar.getAttribute('aria-valuemax')).toBe('1200');

    const fill = bar.querySelector('.hud-xp-fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('clamps width to 0% when xp is negative or xpToNext is zero', () => {
    const { rerender } = render(<LevelXpBar level={1} xp={-10} xpToNext={100} />);
    const bar = screen.getByRole('progressbar');
    const fill = bar.querySelector('.hud-xp-fill') as HTMLElement;
    expect(fill.style.width).toBe('0%');

    rerender(<LevelXpBar level={1} xp={50} xpToNext={0} />);
    expect(fill.style.width).toBe('0%');
  });

  it('reduced motion: fill element has no transition class/style', () => {
    vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(true);
    const { container } = render(<LevelXpBar level={12} xp={340} xpToNext={1200} />);

    const fill = container.querySelector('.hud-xp-fill') as HTMLElement;
    expect(fill).toBeTruthy();
    expect(fill.className).not.toMatch(/animated|transition/);
    expect(fill.style.transition).toBe('none');
  });

  it('without reduced motion: fill element includes animation class', () => {
    vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(false);
    const { container } = render(<LevelXpBar level={12} xp={340} xpToNext={1200} />);

    const fill = container.querySelector('.hud-xp-fill') as HTMLElement;
    expect(fill).toBeTruthy();
    expect(fill.className).toContain('hud-xp-fill--animated');
  });
});
