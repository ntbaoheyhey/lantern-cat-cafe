import { expect, test } from '../support/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { sampleStateV2 } from '../../src/layout/sampleState';
import { mockV2Save } from '../../src/api/mockV2Fixtures';

test.use({ reducedMotion: 'reduce' });
const key = readFileSync(path.resolve('src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
const sizes = [[1600, 900], [1280, 720], [390, 844], [320, 568]] as const;

test.beforeEach(async ({ page }) => {
  const sample = sampleStateV2();
  const save = mockV2Save('midGame', { nowMs: Date.now(), classId: 'warrior' });
  Object.assign(save.state, {
    classId: sample.cat.classId, level: sample.cat.level, xp: sample.cat.xp, ...sample.progress,
    stacks: { ...sample.materials, fish: sample.currencies.fish, yarn: sample.currencies.yarn, catKey: sample.currencies.keys },
    items: sample.inventory.map(i => ({ ...i, itemId: i.itemKey, bonusLines: i.bonus, source: 'drop' as const })),
  });
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, save);
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key, save: JSON.stringify(save) });
});

for (const [width, height] of sizes) {
  test(`layout acceptance ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const stage = page.getByRole('region', { name: 'Game stage' });
    await expect(stage.locator('canvas')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.body.scrollWidth <= innerWidth)).toBe(true);
    const hint = page.getByTestId('next-hint');
    expect(await hint.getByRole('button').evaluate(el => getComputedStyle(el).textDecorationLine)).not.toContain('underline');
    await expect(page.getByRole('link', { name: 'Get a browser wallet', exact: true })).toBeVisible();
    await expect(page.locator('.v2-shell')).toHaveAttribute('data-game-v2', 'stage-v2-enabled');
    if (width === 1280) {
      const tabs = await page.getByRole('tablist').boundingBox();
      expect(tabs!.y + tabs!.height).toBeLessThanOrEqual(720);
      await expect(page.getByRole('tabpanel').getByRole('heading', { name: 'Inventory', exact: true })).toBeInViewport({ ratio: 1 });
      expect((await stage.boundingBox())!.height).toBe(288);
    }
    if (width < 600) {
      expect((await stage.boundingBox())!.height).toBeGreaterThanOrEqual(width === 390 ? 200 : 170);
      if (width === 390) expect((await page.locator('.v2-topbar').boundingBox())!.height).toBeLessThanOrEqual(140);
      for (const tab of await page.getByRole('navigation', { name: 'Game menu' }).getByRole('tab').all()) {
        const bounds = (await tab.boundingBox())!;
        expect(bounds.width).toBeGreaterThanOrEqual(44);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        const label = (await tab.locator('.v2-tab-label').boundingBox())!;
        expect(label.x).toBeGreaterThanOrEqual(4);
        expect(label.x + label.width).toBeLessThanOrEqual(width - 4);
      }
      const wallet = (await page.getByRole('link', { name: 'Get a browser wallet', exact: true }).boundingBox())!;
      expect(wallet.width).toBe(44);
      expect(wallet.height).toBe(44);
    }
  });
}

test('evidence at all requested sizes and color schemes', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const [width, height] of sizes) {
      if (colorScheme === 'dark' && width !== 1280 && width !== 390) continue;
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await expect(page.getByRole('region', { name: 'Game stage' }).locator('canvas')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (process.env.SCREENSHOTS === '1') {
        const phase = process.env.U3_SCREENSHOT_PHASE === 'before' ? 'before' : 'after';
        await page.screenshot({ path: path.resolve(`../../reports/u3-layout/${phase}-${width}x${height}${colorScheme === 'dark' ? '-dark' : ''}.png`), animations: 'disabled' });
      }
    }
  }
});
