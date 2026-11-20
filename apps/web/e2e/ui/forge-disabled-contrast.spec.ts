import { expect, test, type Locator } from '../support/test';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import { readFileSync } from 'node:fs';

const storageKey = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

// Composite text and its background through every ancestor, including group
// opacity. Reading only computed `color` misses dimmed explanatory text.
async function contrast(text: Locator) {
  return text.evaluate(node => {
    type Color = [number, number, number, number];
    const parse = (css: string): Color => {
      const channels = css.match(/[\d.]+/g)!.map(Number);
      return [channels[0]!, channels[1]!, channels[2]!, channels[3] ?? 1];
    };
    const over = (front: Color, back: Color): Color => {
      const alpha = front[3] + back[3] * (1 - front[3]);
      return alpha === 0 ? [0, 0, 0, 0] : [
        ...[0, 1, 2].map(i => (front[i]! * front[3] + back[i]! * back[3] * (1 - front[3])) / alpha), alpha,
      ] as Color;
    };
    let foreground = parse(getComputedStyle(node).color), background: Color = [0, 0, 0, 0];
    for (let parent: Element | null = node; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (style.backgroundImage !== 'none') throw new Error('Contrast fixture requires a solid background');
      const surface = parse(style.backgroundColor), opacity = Number(style.opacity);
      foreground = over(foreground, surface); foreground[3] *= opacity;
      background = over(background, surface); background[3] *= opacity;
    }
    const luminance = (rgba: Color) => over(rgba, [255, 255, 255, 1]).slice(0, 3)
      .map(channel => channel / 255).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4)
      .reduce((sum, channel, i) => sum + channel * [.2126, .7152, .0722][i]!, 0);
    const a = luminance(foreground), b = luminance(background);
    return { text: node.textContent, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
  });
}

for (const width of [1280, 1600]) for (const motion of ['no-preference', 'reduce'] as const) {
  test(`Unavailable salvage reasons remain readable ${width} ${motion}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width * 9 / 16 });
    await page.emulateMedia({ reducedMotion: motion });
    const save = mockV2Save('forgeRich', { nowMs: Date.now(), classId: 'warrior' });
    await page.addInitScript(({ key, save }) => {
      localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key: storageKey, save: JSON.stringify(save) });
    await page.goto('/#forge');
    await page.getByTestId('tab-salvage').click();
    await page.evaluate(() => document.fonts.ready);
    for (const id of ['fx:forgeRich:0', 'fx:forgeRich:4']) {
      await expect(page.getByTestId('salvage-check-' + id)).toBeDisabled();
      const row = page.getByTestId('salvage-item-' + id);
      await row.scrollIntoViewIfNeeded();
      const labels = row.locator('.forge-item-name, .forge-note, .forge-item-meta > span, .forge-item-status-tag');
      expect(await labels.count()).toBeGreaterThanOrEqual(5);
      for (const label of await labels.all()) {
        const measured = await contrast(label);
        expect(measured.ratio, JSON.stringify(measured)).toBeGreaterThanOrEqual(4.5);
      }
    }
    await page.getByTestId('salvage-check-fx:forgeRich:1').check();
    await page.getByTestId('salvage-btn').click();
    await expect(page.getByTestId('salvage-confirm-box')).toBeVisible();
    for (const tag of await page.locator('.forge-item-status-tag').all()) {
      const measured = await contrast(tag);
      expect(measured.ratio, JSON.stringify(measured)).toBeGreaterThanOrEqual(4.5);
    }
  });
}
