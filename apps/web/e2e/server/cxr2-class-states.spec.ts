import { test, expect, load, inspect } from '../support/server-fixture';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expectVisibleRoot, watchVisibleRoot } from '../support/visible-root';

for (const width of [1280, 1600]) test(`CXR2 first class stays visible during save and can recover ${width}`, async ({ page, request }) => {
  await watchVisibleRoot(page);
  await page.setViewportSize({ width, height: width * 9 / 16 });
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.continue());
  const session = await load(page, request, 'fresh');
  await page.evaluate(() => document.fonts.ready);
  let release!: () => void;
  const held = new Promise<void>(done => { release = done; });
  let refuse = true;
  await page.route('**/functions/v1/v2-choose-class', async route => {
    if (route.request().method() !== 'POST' || !refuse) return route.continue();
    await held;
    return route.fulfill({ status: 503, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ error: 'server_busy' }) });
  });
  const capture = async (state: string) => {
    await page.clock.runFor(50);
    await expectVisibleRoot(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight)).toBe(false);
    if (process.env.CXR2_SCREENSHOTS) {
      mkdirSync(process.env.CXR2_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: resolve(process.env.CXR2_SCREENSHOTS, `class-${state}-${width}.png`) });
    }
  };
  try {
    const started = page.waitForRequest(request => request.url().endsWith('/v2-choose-class') && request.method() === 'POST');
    await page.getByTestId('class-picker-choose-button').click(); await started;
    await expect(page.getByTestId('class-picker')).toBeVisible();
    await expect(page.getByTestId('class-picker-choose-button')).toBeDisabled();
    await expect(page.getByTestId('class-picker-locked-notice')).toHaveCount(0);
    await expect(page.getByTestId('class-picker-choose-button')).toHaveAttribute('aria-busy', 'true');
    await capture('saving');
    release();
    await expect(page.getByRole('alert').filter({ hasText: 'Class selection did not go through' })).toBeVisible();
    await expect(page.getByTestId('class-picker-choose-button')).toBeEnabled();
    expect((await inspect(request, session)).raw.classId).toBeNull();
    await capture('save-error');
    refuse = false;
    await page.getByTestId('class-picker-choose-button').click();
    await expect(page.getByTestId('home-dashboard')).toBeVisible();
    expect((await inspect(request, session)).raw.classId).toBe('warrior');
  } finally { release(); }
});
