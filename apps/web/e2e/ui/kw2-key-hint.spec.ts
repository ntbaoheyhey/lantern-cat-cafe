import { expect, test } from '../support/test';
import fs from 'node:fs';
import path from 'node:path';
import { mockV2Save } from '../../src/api/mockV2Fixtures';


const STORAGE_KEY = fs
  .readFileSync(path.resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8')
  .match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

const writeScreenshots = process.env.SCREENSHOTS === '1';
const reportsDir = path.resolve(process.cwd(), '../../reports/kw2-key-hint');

const VIEWPORTS = [
  { name: '1280x720', width: 1280, height: 720 },
  { name: '390x844', width: 390, height: 844 },
];

for (const vp of VIEWPORTS) {
  for (const keys of [0, 1]) {
    const name = keys === 0 ? 'no_key' : 'ready';
    test(`key hint ${name} at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const save = mockV2Save('bossReadyStrong', { nowMs: Date.now(), classId: 'warrior' });
      save.state.stacks.catKey = keys;
      await page.addInitScript(
        ({ key, save }) => {
          window.localStorage.setItem(key, save);
          window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
        },
        { key: STORAGE_KEY, save: JSON.stringify(save) },
      );
      await page.goto('/');
      await page.locator('.v2-shell').waitFor();
      const tab = page.getByRole('tab', { name: 'Map', exact: true }).or(page.getByRole('tab', { name: 'Boss', exact: true }));
      await tab.click();
      const panel = page.locator('.boss-gate-panel');
      await expect(panel).toBeVisible();
      const hint = page.getByTestId('boss-key-hint');
      if (keys === 0) {
        await expect(hint).toBeVisible();
        await expect(page.getByTestId('boss-key-hint-count')).toHaveText(/^Cat Keys: 0 \/ \d+$/);
      } else {
        await expect(hint).toHaveCount(0);
      }
      const o = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(o[0]).toBeLessThanOrEqual(o[1]! + 1);
      if (keys === 0) await hint.scrollIntoViewIfNeeded();
      if (writeScreenshots) {
        fs.mkdirSync(reportsDir, { recursive: true });
        await page.screenshot({ path: path.join(reportsDir, `${name}-${vp.name}.png`) });
      }
    });
  }
}
