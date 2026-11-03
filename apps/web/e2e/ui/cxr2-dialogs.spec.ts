import { expect, test, type Page, type Locator } from '../support/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';

const key = readFileSync(resolve('src/api/MockGameApiV2.ts'), 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
async function checkDialog(page: Page, dialog: Locator) {
  await expect(dialog).toBeVisible(); await expect(dialog).toHaveClass(/ui-modal/);
  await expect(dialog).toHaveCSS('background-color', 'rgb(42, 31, 54)');
  await expect(page.locator('#root')).toHaveAttribute('inert', '');
  await expect(page.locator('#root')).toHaveAttribute('aria-hidden', 'true');
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  const box = await dialog.boundingBox(), size = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(size.height);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function restored(page: Page) {
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.locator('#root').getAttribute('inert')).toBeNull();
  expect(await page.locator('#root').getAttribute('aria-hidden')).toBeNull();
}
async function capture(page: Page, name: string) {
  if (process.env.CXR2_SCREENSHOTS) await page.screenshot({ path: resolve(process.env.CXR2_SCREENSHOTS, name + '.png') });
}
for (const size of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    test.describe(`CXR2 ${size.width} ${motion}`, () => {
      test.use({ viewport: size, reducedMotion: motion });
      test('first-visit Help uses shared keyboard and background isolation', async ({ page }) => {
        const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        await page.goto('/#landing');
        const dialog = page.getByRole('dialog', { name: 'How to play', exact: true });
        await checkDialog(page, dialog);
        await expect(dialog.getByRole('listitem')).toHaveCount(5);
        await expect(dialog).toContainText('30 Yarn and 1 Moon Pearl');
        await expect(dialog).not.toContainText('5 fights a day');
        await expect(dialog.getByRole('button', { name: 'Start playing' })).toBeFocused();
        await page.keyboard.press('Tab'); await expect(dialog.getByRole('button', { name: 'Close help' })).toBeFocused();
        await page.keyboard.press('Shift+Tab'); await expect(dialog.getByRole('button', { name: 'Start playing' })).toBeFocused();
        await capture(page, `help-${size.width}-${motion}`);
        await page.keyboard.press('Escape'); await restored(page);
        await expect(page.getByTestId('landing-start')).toBeEnabled();
        await expect(page.getByTestId('landing-start')).toBeFocused();
        await page.reload(); await expect(page.getByRole('dialog')).toHaveCount(0);
        expect(errors).toEqual([]);
      });
      test('offline welcome and real boss chest retain actions, art and exclusive focus', async ({ page }) => {
        const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        const now = Date.UTC(2026, 10, 3, 12);
        await page.clock.install({ time: now });
        const save = mockV2SaveJson('bossReadyStrong', { nowMs: now - 3600_000, classId: 'warrior' });
        // Seed a real prior visit as well as an old claim; the UI does not infer absence from a save alone.
        await page.addInitScript(({ key, save, lastVisit }) => { localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); localStorage.setItem('taskbar-hero:v2-last-visit', String(lastVisit)); }, { key, save, lastVisit: now - 3600_000 });
        await page.goto('/');
        // The unchanged production loop claims on its normal30s tick.
        await page.clock.fastForward(30_000);
        const welcome = page.getByRole('dialog', { name: 'Welcome back!', exact: true });
        await checkDialog(page, welcome);
        await expect(welcome.getByRole('button')).toHaveCount(1);
        await expect(welcome.getByRole('button', { name: 'OK' })).toBeFocused();
        await page.keyboard.press('Tab');
        const lootScroll = welcome.getByRole('region', { name: 'Scrollable offline loot' });
        await expect(lootScroll).toBeFocused();
        await page.keyboard.press('End');
        await expect.poll(() => lootScroll.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
        await page.keyboard.press('Home');
        await expect.poll(() => lootScroll.evaluate(el => el.scrollTop)).toBe(0);
        await page.keyboard.press('Tab'); await expect(welcome.getByRole('button', { name: 'OK' })).toBeFocused();
        await expect(welcome.getByRole('heading', { name: 'Welcome back!', exact: true })).toBeInViewport();
        await expect(welcome.locator('.welcome-back-rule')).toBeInViewport();
        await expect(welcome.getByRole('button', { name: 'OK' })).toBeInViewport();
        await capture(page, `welcome-${size.width}-${motion}`);
        await welcome.getByRole('button', { name: 'OK' }).click(); await restored(page);
        const railStyle = await page.getByTestId('nav-home').evaluate(el => ({ radius: getComputedStyle(el).borderTopLeftRadius, border: getComputedStyle(el).borderTopWidth }));
        expect(railStyle).toEqual({ radius: '0px', border: '2px' });
        await page.getByRole('tab', { name: 'Map', exact: true }).click();
        await page.getByRole('button', { name: 'Fight', exact: true }).click();
        if (motion === 'no-preference') await page.getByRole('button', { name: 'Skip fight', exact: true }).click();
        const chest = page.getByRole('dialog', { name: 'First clear chest!', exact: true });
        await checkDialog(page, chest);
        await expect(chest.locator('svg[data-backdrop="livingroom"]')).toHaveCount(1);
        await expect(chest.getByRole('button')).toHaveCount(1);
        await page.clock.resume();
        if (await chest.getByRole('button', { name: 'Skip', exact: true }).isVisible()) await chest.getByRole('button', { name: 'Skip', exact: true }).click();
        const collect = chest.getByRole('button', { name: 'Collect', exact: true });
        await expect(collect).toBeVisible(); await expect(collect).toBeInViewport();
        await page.keyboard.press('Shift+Tab'); await expect(collect).toBeFocused();
        await capture(page, `chest-${size.width}-${motion}`);
        await collect.click(); await restored(page);
        await expect(page.getByTestId('nav-map')).toBeFocused();
        await expect(page.getByTestId('nav-home')).toBeEnabled();
        expect(errors).toEqual([]);
      });
    });
  }
}
