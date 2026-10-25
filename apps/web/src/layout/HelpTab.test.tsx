// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { STEPS } from '../onboarding/HowToPlay';
import { HelpTab } from './HelpTab';

describe('HelpTab', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GAME_V2', '1');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('1. Flag on: the seven h3 headings appear in this order; the text contains "Mochi the cat naps"', () => {
    const { container } = render(<HelpTab />);
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent?.trim());
    expect(headings).toEqual([
      'Getting started',
      'Classes',
      'Chapters and rounds',
      'Cat Keys and bosses',
      'Forge',
      'Drop rates',
      'Mini mode',
    ]);
    expect(container.textContent).toContain('Mochi the cat naps');
  });

  it('2. Flag on: numbers match config and lossCooldownSeconds dynamically updates when config changes', () => {
    render(<HelpTab />);
    const yarnCostStr = String(v2.RELIC_RECIPE.materials.yarn);
    const moonPearlCostStr = String(v2.RELIC_RECIPE.materials.moonPearl);
    const relicLine = screen.getByText((content) =>
      content.startsWith('The Relic:') &&
      content.includes(yarnCostStr) &&
      content.includes(moonPearlCostStr) &&
      content.includes('Moon Pearl')
    );
    expect(relicLine).toBeTruthy();

    const catnapLine = screen.getByText(
      new RegExp(`${v2.V2_CONFIG.boss.lossCooldownSeconds}\\s*s catnap`)
    );
    expect(catnapLine).toBeTruthy();

    const dailyKeyLine = screen.getByText(
      new RegExp(`You get ${v2.V2_CONFIG.idle.dailyKeys} Cat Key`)
    );
    expect(dailyKeyLine).toBeTruthy();

    // Verify dynamic update when changing lossCooldownSeconds
    const originalCooldown = v2.V2_CONFIG.boss.lossCooldownSeconds;
    try {
      (v2.V2_CONFIG.boss as { lossCooldownSeconds: number }).lossCooldownSeconds = 123;
      cleanup();
      render(<HelpTab />);
      expect(screen.getByText(/123\s*s catnap/)).toBeTruthy();
    } finally {
      (v2.V2_CONFIG.boss as { lossCooldownSeconds: number }).lossCooldownSeconds = originalCooldown;
    }
  });

  it('3. First-clear key sentence absent with firstClearKeys 0 or missing; present when set to 1', () => {
    const bossObj = v2.V2_CONFIG.boss as { firstClearKeys?: number };
    const original = bossObj.firstClearKeys;
    try {
      bossObj.firstClearKeys = 0;
      cleanup();
      render(<HelpTab />);
      expect(screen.queryByText(/First-clear boss chests also award/)).toBeNull();

      delete bossObj.firstClearKeys;
      cleanup();
      render(<HelpTab />);
      expect(screen.queryByText(/First-clear boss chests also award/)).toBeNull();

      bossObj.firstClearKeys = 1;
      cleanup();
      render(<HelpTab />);
      expect(screen.getByText(/First-clear boss chests also award 1 Cat Key/)).toBeTruthy();
    } finally {
      if (original === undefined) {
        delete bossObj.firstClearKeys;
      } else {
        bossObj.firstClearKeys = original;
      }
    }
  });

  it('4. Every v2.CLASSES name and every v2.CHAPTERS name appears', () => {
    render(<HelpTab />);
    for (const cls of v2.CLASSES) {
      expect(screen.getByText(new RegExp(cls.name))).toBeTruthy();
    }
    for (const ch of v2.CHAPTERS) {
      expect(screen.getByText(new RegExp(ch.name))).toBeTruthy();
    }
  });

  it('5. Flag off: the rendered list equals today\'s (same number of li as STEPS, same texts in order) and none of the v2 headings appear', () => {
    vi.stubEnv('VITE_GAME_V2', '0');
    const { container } = render(<HelpTab />);
    const items = container.querySelectorAll('li.help-step-item');
    expect(items.length).toBe(STEPS.length);
    items.forEach((item, index) => {
      expect(item.textContent).toContain(STEPS[index]!.text);
    });
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });

  it('6. a11y: headings h3 only, no skipped levels inside the panel, icons (if any) aria-hidden, no tabIndex > 0', () => {
    const { container } = render(<HelpTab />);
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBe(7);
    headings.forEach((h) => {
      expect(h.tagName.toLowerCase()).toBe('h3');
    });

    const withTabIndex = container.querySelectorAll<HTMLElement>('[tabindex]');
    withTabIndex.forEach((el) => {
      expect(el.tabIndex).toBeLessThanOrEqual(0);
    });

    const svgs = container.querySelectorAll('svg');
    svgs.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
