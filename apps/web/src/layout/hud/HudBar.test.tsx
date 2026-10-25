// @vitest-environment jsdom
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { sampleServerStateV2 } from '../a11y/fixtures';
import { HudBar } from './HudBar';

describe('HudBar', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders level, xp, chapter/round/kills, fish, yarn, keys, and power with distinct values', () => {
    const state = sampleServerStateV2({
      level: 12,
      chapter: 2,
      round: 3,
      kills: 4,
      killsPerRound: 10,
      keys: 2,
    });
    state.cat.xp = 340;
    state.cat.xpToNext = 1200;
    state.currencies.fish = 5432;
    state.currencies.yarn = 87;

    const power = 1234;

    const { container } = render(<HudBar state={state} power={power} />);

    // Section accessible name and no headings
    const section = screen.getByRole('region', { name: 'Cat status' });
    expect(section).toBeTruthy();
    expect(screen.queryAllByRole('heading')).toHaveLength(0);

    // Level & XP
    expect(screen.getByText('Lv 12')).toBeTruthy();
    expect(screen.getByText('340 / 1,200 XP')).toBeTruthy();

    // Progress
    expect(screen.getByText('Chapter 2 · Round 3 · 4/10')).toBeTruthy();

    // Currencies
    expect(screen.getByText('5,432')).toBeTruthy();
    expect(screen.getByText('87')).toBeTruthy();
    expect(screen.getByText('2/5')).toBeTruthy();

    // Power
    expect(screen.getByText('Power 1,234')).toBeTruthy();

    // Write snippet for screenshot generation
    try {
      const scratchDir = '/Users/bao/.gemini/antigravity/brain/659cf801-aae2-4bb1-9c99-a0422bc66702/scratch';
      mkdirSync(scratchDir, { recursive: true });
      writeFileSync(resolve(scratchDir, 'hud-gated-false.html-snippet'), container.innerHTML);

      cleanup();

      // Also render gated=true state for screenshots
      const gatedState = sampleServerStateV2({
        level: 12,
        chapter: 2,
        round: 3,
        kills: 4,
        killsPerRound: 10,
        gated: true,
        neededPower: 1500,
        keys: 2,
      });
      gatedState.cat.xp = 340;
      gatedState.cat.xpToNext = 1200;
      gatedState.currencies.fish = 5432;
      gatedState.currencies.yarn = 87;
      const { container: gatedContainer } = render(<HudBar state={gatedState} power={power} />);
      writeFileSync(resolve(scratchDir, 'hud-gated-true.html-snippet'), gatedContainer.innerHTML);
    } catch {
      // Ignore if scratch dir not writable
    }
  });

  it('renders without horizontal overflow at 320 px width and verifies CSS rules', () => {
    const state = sampleServerStateV2();
    const { container } = render(
      <div style={{ width: 320 }}>
        <HudBar state={state} power={1000} />
      </div>,
    );

    const hudRoot = container.querySelector('.hud-bar');
    expect(hudRoot).toBeTruthy();
    expect(hudRoot?.classList.contains('hud-bar')).toBe(true);

    // Read hud.css and check layout rules (A18 pattern)
    const cssText = readFileSync(resolve(__dirname, 'hud.css'), 'utf8');

    // Rule 1: hud-bar root wraps
    expect(cssText).toMatch(/\.hud-bar\s*\{[^}]*flex-wrap:\s*wrap/);

    // Rule 2: no child has a fixed width above 320px in css
    const pixelWidthMatches = cssText.match(/(?<![a-zA-Z-])width:\s*(\d+)px/g) ?? [];
    for (const match of pixelWidthMatches) {
      const numMatch = match.match(/\d+/);
      if (numMatch) {
        const px = parseInt(numMatch[0], 10);
        expect(px).toBeLessThanOrEqual(320);
      }
    }
  });
});
