import { test, expect } from '../support/test';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import fs from 'node:fs';
import path from 'node:path';
const key = fs.readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
test('G1 stage evidence at the six requested viewports', async ({ page }) => {
  const save = mockV2Save('midGame', { nowMs: Date.now() });
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, save);
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key, save: JSON.stringify(save) });
  const folder = path.resolve('../../reports/g1-speed');
  for (const [width, height, scheme] of [
    [1600, 900, 'light'], [1280, 720, 'light'], [390, 844, 'light'],
    [320, 568, 'light'], [1280, 720, 'dark'], [390, 844, 'dark'],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('.v2-stage-canvas canvas')).toHaveCount(1);
    const heroTab = page.getByRole('tab', { name: 'Hero', exact: true }).or(page.getByRole('tab', { name: 'Character', exact: true }));
    if ((await heroTab.count()) > 0) {
      await heroTab.click();
      await expect(page.getByRole('region', { name: 'Character', exact: true })).toBeVisible();
      const homeTab = page.getByRole('tab', { name: 'Home', exact: true });
      if ((await homeTab.count()) > 0) await homeTab.click();
    } else {
      await expect(page.getByRole('region', { name: 'Character', exact: true })).toBeVisible();
    }
    if (process.env.SCREENSHOTS === '1') {
      const file = path.join(folder, `${width}x${height}-${scheme}.png`);
      await page.screenshot({ path: file, animations: 'disabled' });
      expect(fs.statSync(file).size).toBeLessThan(200_000);
    }
  }
});
