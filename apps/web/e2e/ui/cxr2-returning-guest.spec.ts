import { test, expect } from '../support/test';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const storageKey = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

for (const width of [1280, 1600]) test(`CXR2 returning guest can play again from Landing without losing progress ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: width * 9 / 16 });
  const now = Date.now(), save = mockV2Save('midGame', { nowMs: now, classId: 'warrior' });
  await page.clock.install({ time: new Date(0) }); await page.clock.pauseAt(new Date(now));
  await page.addInitScript(({ key, save }) => { localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); }, { key: storageKey, save: JSON.stringify(save) });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/#hero');
  await expect(page.getByRole('region', { name: 'Character' })).toBeVisible();
  const before = await page.evaluate(() => window.__g1Loop.getSnapshot().state);
  await page.evaluate(() => { location.hash = 'landing'; });
  await expect(page.getByTestId('landing-hero')).toBeVisible();
  await page.getByTestId('landing-start').click();
  await expect(page.getByTestId('home-dashboard')).toBeVisible();
  await expect(page.getByTestId('nav-home')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('class-picker')).toHaveCount(0);
  expect(await page.evaluate(() => window.__g1Loop.getSnapshot().state)).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight)).toBe(false);
  await page.clock.runFor(500); await page.evaluate(() => document.fonts.ready);
  if (process.env.CXR2_SCREENSHOTS) {
    mkdirSync(process.env.CXR2_SCREENSHOTS, { recursive: true });
    await page.screenshot({ path: resolve(process.env.CXR2_SCREENSHOTS, `returning-guest-home-${width}.png`) });
  }
  expect(errors).toEqual([]);
});
