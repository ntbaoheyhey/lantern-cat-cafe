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

async function expectRewardContrast(page: Page) {
  const colors = await page.locator('.home-card--loot .loot-summary-heading, .home-card--loot .loot-line, .home-card--loot .loot-item-name, .home-card--loot .loot-item-meta').evaluateAll(nodes => nodes.filter(node => {
    const rect = node.getBoundingClientRect();
    return rect.width && rect.height;
  }).map(node => {
    let surface: Element | null = node;
    while (surface && getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)') surface = surface.parentElement;
    return { label: node.textContent, foreground: getComputedStyle(node).color, background: surface ? getComputedStyle(surface).backgroundColor : '' };
  }));
  expect(colors.length).toBeGreaterThan(1);
  const luminance = (rgb: string) => {
    const channels = rgb.match(/[\d.]+/g)!.map(Number);
    expect(channels.length === 3 || channels[3] === 1, `Opaque color required: ${rgb}`).toBe(true);
    const values = channels.slice(0, 3).map(value => { const channel = value / 255; return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4; });
    return .2126 * values[0]! + .7152 * values[1]! + .0722 * values[2]!;
  };
  return colors.map(row => {
    const a = luminance(row.foreground), b = luminance(row.background);
    const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    expect(ratio, JSON.stringify(row)).toBeGreaterThanOrEqual(4.5);
    return { ...row, ratio };
  });
}

for (const width of [1280, 1600]) {
  test(`First play reaches Home and naturally earns without a wallet ${width}`, async ({ page }, testInfo) => {
    // The real first claim is scheduled after ten seconds; no clock or claim shortcut.
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
    await expect(help).toHaveCount(0); timing.firstVisitMs = Date.now() - start;
    await expectVisibleRoot(page);
    await page.getByTestId('landing-start').focus();
    await expect(page.getByTestId('landing-start')).toBeFocused();
    await expect(page.getByTestId('landing-start')).toHaveAccessibleDescription(/No token.*No fees to play/);
    await expectVisibleRoot(page); timing.landingMs = Date.now() - start;
    await page.getByTestId('landing-start').click();
    await expect(page.getByTestId('class-picker')).toBeVisible(); timing.classMs = Date.now() - start;
    await expectVisibleRoot(page);
    await page.getByTestId('class-picker-choose-button').click();
    await expect(page.getByTestId('home-dashboard')).toBeVisible(); timing.homeMs = Date.now() - start;
    expect(timing.homeMs, 'UI interaction path should reach Home well before the reward interval').toBeLessThan(5_000);
    await expect(page.getByTestId('guest-coach')).toBeVisible();
    const initial = await page.evaluate(() => window.__g1Loop.getSnapshot().state!.currencies.fish);
    await expect.poll(() => page.evaluate(() => window.__g1Loop.getSnapshot().state!.currencies.fish), { timeout: 36_000, intervals: [100, 250, 500] }).toBeGreaterThan(initial);
    await expect(page.getByRole('heading', { name: 'Recent finds', exact: true })).toBeVisible();
    const contrast = await expectRewardContrast(page);
    timing.firstEarnMs = Date.now() - start;
    const result = { width, height: width * 9 / 16, method: 'Fresh local guest; nonblocking coach; real wall clock and natural ten-second first claim; no seeded save, manual claim or clock acceleration', timing, contrast, blankFrames: await page.evaluate(() => (window as Window & { __visibleRootGuard?: { blankFrames: unknown[] } }).__visibleRootGuard?.blankFrames ?? null), errors, writes };
    await testInfo.attach('first-play-timing', { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
    if (process.env.FIRSTPLAY_SCREENSHOTS) {
      fs.mkdirSync(process.env.FIRSTPLAY_SCREENSHOTS, { recursive: true });
      fs.writeFileSync(path.join(process.env.FIRSTPLAY_SCREENSHOTS, `timing-${width}-${process.env.E2E_VIEWPORT ?? 'default'}-repeat${testInfo.repeatEachIndex}.json`), JSON.stringify(result, null, 2) + '\n');
    }
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
