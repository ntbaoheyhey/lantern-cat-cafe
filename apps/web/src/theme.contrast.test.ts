import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve('src/theme.css'), 'utf8');
const root = css.match(/:root\s*\{([^}]+)\}/)![1]!;
const tokens = Object.fromEntries([...root.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)]
  .map(([, name, value]) => [name!, value!.trim()]));

function luminance(hex: string): number {
  expect(hex).toMatch(/^#[\da-f]{6}$/i);
  const channels = [1, 3, 5].map(start => {
    const srgb = parseInt(hex.slice(start, start + 2), 16) / 255;
    return srgb <= .04045 ? srgb / 12.92 : ((srgb + .055) / 1.055) ** 2.4;
  });
  return .2126 * channels[0]! + .7152 * channels[1]! + .0722 * channels[2]!;
}

const pairs: [string, string, number][] = [
  ['--text', '--bg', 4.5], ['--text', '--surface', 4.5],
  ['--text', '--surface-2', 4.5], ['--text', '--surface-3', 4.5],
  ['--muted', '--bg', 4.5], ['--muted', '--surface', 4.5],
  ['--muted', '--surface-2', 4.5],
  // XP fill is a graphical indicator, so WCAG non-text contrast is 3:1.
  ['--good', '--surface-2', 3],
  ['--on-accent', '--accent', 4.5], ['--border', '--bg', 3],
  // CXU4: selected Help topic, toast text and modal/button focus outlines.
  ['--accent', '--surface', 4.5], ['--muted', '--surface-2', 4.5],
  ['--focus', '--surface', 3], ['--focus', '--surface-2', 3],
];

describe('theme WCAG contrast', () => {
  for (const [foreground, background, minimum] of pairs) {
    it(`${foreground} on ${background} >= ${minimum}:1`, () => {
      expect(tokens).toHaveProperty(foreground);
      expect(tokens).toHaveProperty(background);
      const a = luminance(tokens[foreground]!);
      const b = luminance(tokens[background]!);
      const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      console.log(`${foreground} on ${background}: ${ratio.toFixed(4)}:1 (minimum ${minimum}:1)`);
      expect(ratio).toBeGreaterThanOrEqual(minimum);
    });
  }
});
