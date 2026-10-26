import { expect, test } from '../support/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';

const key = readFileSync(resolve('src/api/MockGameApiV2.ts'), 'utf8')
  .match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
const views = [
  [1600, 900, 'light'], [1280, 720, 'light'], [390, 844, 'light'], [320, 568, 'light'],
  [1280, 720, 'dark'], [390, 844, 'dark'],
] as const;

for (const [width, height, colorScheme] of views) test(`S1 main, Forge and Boss at ${width}x${height} ${colorScheme}`, async ({ page, context }) => {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
  const nowMs = Date.UTC(2026, 9, 26, 12);
  await page.clock.install({ time: nowMs });
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, save);
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key, save: mockV2SaveJson('midGame', { nowMs, classId: 'warrior' }) });
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Game stage' }).locator('canvas')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.clock.runFor(200);
  const captures: { label: string; png: string }[] = [];
  for (const label of ['Main', 'Forge', 'Boss']) {
    if (label !== 'Main') {
      await page.getByRole('tab', { name: label, exact: true }).click();
      await expect(page.getByRole('tabpanel', { name: label, exact: true })).toBeVisible();
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    if (process.env.SCREENSHOTS === '1') {
      captures.push({ label, png: (await page.screenshot({ animations: 'disabled' })).toString('base64') });
    }
  }
  if (process.env.SCREENSHOTS === '1') {
    // Native-sized, unmodified viewport captures in a labelled contact sheet:
    // six PNGs cover all eighteen view/viewport combinations within the budget.
    const sheet = await context.newPage();
    try {
      await sheet.setViewportSize({ width: width * 3, height: height + 28 });
      await sheet.setContent(`<style>body{margin:0;display:flex;background:#21182b;color:#fff;font:16px sans-serif}figure{margin:0;width:${width}px}figcaption{height:28px;line-height:28px;text-align:center}img{display:block;width:${width}px;height:${height}px}</style>` +
        captures.map(({ label, png }) => `<figure><figcaption>${label} · ${width}×${height} · ${colorScheme}</figcaption><img src="data:image/png;base64,${png}"></figure>`).join(''));
      await sheet.locator('img').evaluateAll(images => Promise.all(images.map(image => (image as HTMLImageElement).decode())));
      const dir = resolve('../../reports/s1-infra');
      mkdirSync(dir, { recursive: true });
      const buffer = await sheet.screenshot({ path: resolve(dir, `after-${width}x${height}-${colorScheme}.png`) });
      expect(buffer.length, 'Contact sheet must stay under 200 KB').toBeLessThan(200_000);
    } finally {
      await sheet.close();
    }
  }
});
