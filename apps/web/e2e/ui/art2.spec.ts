import { expect, test } from '../support/test';
import { expectArtPaint } from '../support/art-ready';
import fs from 'node:fs';
import path from 'node:path';

for (const width of [1280, 1600]) test(`ART2 decoded sample art, transparent frames and bounded gallery ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 1280 ? 720 : 900 });
  const errors: string[] = [], writes: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.method()); });
  await page.goto('/art2-fixture/e2e/fixtures/art2-view.html');
  await expect(page.getByRole('region', { name: 'Original art samples' })).toBeVisible();
  await expect(page.locator('figure')).toHaveCount(23);
  for (const figure of await page.locator('figure').all()) await expect(figure).toContainText('Sample');
  await expectArtPaint(page);
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight);
  expect(await overflow()).toBe(false);
  for (const section of ['top', 'skills', 'illustrations']) {
    if (section === 'skills') await page.locator('[data-art2="skill-frame-seamsweep"]').scrollIntoViewIfNeeded();
    if (section === 'illustrations') await page.locator('[data-art2="landing"]').scrollIntoViewIfNeeded();
    await expectArtPaint(page); expect(await overflow()).toBe(false);
    if (process.env.ART2_SCREENSHOTS) {
      fs.mkdirSync(process.env.ART2_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: path.join(process.env.ART2_SCREENSHOTS, `art2-${section}-${width}.png`) });
    }
  }
  expect(errors).toEqual([]); expect(writes).toEqual([]);
});

test('ART2 shared flag remains off and requests no added art in the production app', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', request => { if (request.url().includes('/ui-art2/')) requested.push(request.url()); });
  await page.addInitScript(() => localStorage.setItem('taskbar-hero.howToPlaySeen', '1'));
  await page.goto('/#landing');
  await expect(page.getByTestId('landing-start')).toBeVisible();
  await expect(page.locator('[data-art2]')).toHaveCount(0);
  await page.getByTestId('landing-start').click();
  await expect(page.locator('[data-art2]')).toHaveCount(0);
  expect(requested).toEqual([]);
});
