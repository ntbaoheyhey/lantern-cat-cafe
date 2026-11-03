import { expect, test, type Page } from '../support/test';
import { expectVisibleRoot, watchVisibleRoot } from '../support/visible-root';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import fs from 'node:fs';
import path from 'node:path';
const storageKey = fs.readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

async function capture(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  await expectVisibleRoot(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight)).toBe(false);
  if (process.env.FIRSTPLAY_SCREENSHOTS) {
    fs.mkdirSync(process.env.FIRSTPLAY_SCREENSHOTS, { recursive: true });
    await page.screenshot({ path: path.join(process.env.FIRSTPLAY_SCREENSHOTS, name + '.png') });
  }
}

for (const width of [1280, 1600]) {
  test(`First play reaches Home and naturally earns without a wallet ${width}`, async ({ page }, testInfo) => {
    // The real scheduler claims every30seconds. This budget includes that wait; no clock or claim shortcut.
    test.setTimeout(50_000);
    await page.setViewportSize({ width, height: width * 9 / 16 });
    await watchVisibleRoot(page);
    const errors: string[] = [], writes: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.method()); });
    const start = Date.now(); const timing: Record<string, number> = {};
    await page.goto('/#landing');
    const help = page.getByRole('dialog', { name: 'How to play', exact: true });
    await expect(help).toBeVisible(); timing.firstVisitHelpMs = Date.now() - start;
    await expectVisibleRoot(page);
    await help.getByRole('button', { name: 'Start playing', exact: true }).click();
    await expect(page.getByTestId('landing-start')).toBeFocused();
    await expect(page.getByTestId('landing-start')).toHaveAccessibleDescription(/No token.*No fees to play/);
    await expectVisibleRoot(page); timing.landingMs = Date.now() - start;
    await page.getByTestId('landing-start').click();
    await expect(page.getByTestId('class-picker')).toBeVisible(); timing.classMs = Date.now() - start;
    await expectVisibleRoot(page);
    await page.getByTestId('class-picker-choose-button').click();
    await page.getByTestId('class-picker-confirm-button').click();
    await expect(page.getByTestId('home-dashboard')).toBeVisible(); timing.homeMs = Date.now() - start;
    expect(timing.homeMs, 'UI interaction path should reach Home well before the reward interval').toBeLessThan(5_000);
    const initial = await page.evaluate(() => window.__g1Loop.getSnapshot().state!.currencies.fish);
    await expect.poll(() => page.evaluate(() => window.__g1Loop.getSnapshot().state!.currencies.fish), { timeout: 36_000, intervals: [100, 250, 500] }).toBeGreaterThan(initial);
    await expect(page.getByRole('heading', { name: 'Recent finds', exact: true })).toBeVisible();
    timing.firstEarnMs = Date.now() - start;
    const result = { width, height: width * 9 / 16, method: 'Fresh local guest; first-visit Help; real wall clock and natural30-second claim; no seeded save, manual claim or clock acceleration', timing, blankFrames: await page.evaluate(() => (window as Window & { __visibleRootGuard?: { blankFrames: unknown[] } }).__visibleRootGuard?.blankFrames ?? null), errors, writes };
    await testInfo.attach('first-play-timing', { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
    if (process.env.FIRSTPLAY_SCREENSHOTS) fs.writeFileSync(path.join(process.env.FIRSTPLAY_SCREENSHOTS, `timing-${width}-${process.env.E2E_VIEWPORT ?? 'default'}-repeat${testInfo.repeatEachIndex}.json`), JSON.stringify(result, null, 2) + '\n');
    await capture(page, `first-earn-${width}`);
    expect(errors).toEqual([]); expect(writes).toEqual([]);
  });

  test(`Returning guest stays labelled through disconnected wallet and offline recovery ${width}`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: width * 9 / 16 });
    const save = mockV2Save('midGame', { nowMs: Date.now(), classId: 'warrior' });
    await page.addInitScript(({ key, save }) => { localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); }, { key: storageKey, save: JSON.stringify(save) });
    await watchVisibleRoot(page);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/#hero'); await expect(page.getByRole('region', { name: 'Character' })).toBeVisible();
    await page.evaluate(() => { location.hash = 'landing'; }); await expect(page.getByTestId('landing-start')).toBeVisible();
    await page.getByTestId('landing-start').click(); await expect(page.getByTestId('home-dashboard')).toBeVisible();
    await expect(page.getByTestId('class-picker')).toHaveCount(0); await capture(page, `returning-${width}`);
    await page.getByTestId('nav-market').click();
    await expect(page.getByRole('heading', { name: 'Your Relic shelf' })).toBeVisible();
    await expect(page.getByText('Connect your wallet to see your Relics and the market.', { exact: true })).toBeVisible();
    await capture(page, `wallet-disconnected-${width}`);
    await page.getByTestId('nav-home').click();
    await context.setOffline(true); await page.evaluate(() => dispatchEvent(new Event('offline')));
    await expect(page.locator('header [data-sync-status="offline"]')).toBeVisible();
    await capture(page, `offline-${width}`);
    await context.setOffline(false); await page.evaluate(() => dispatchEvent(new Event('online')));
    await expect(page.getByTestId('home-dashboard')).toBeVisible(); await expectVisibleRoot(page);
    expect(errors).toEqual([]);
  });
}
