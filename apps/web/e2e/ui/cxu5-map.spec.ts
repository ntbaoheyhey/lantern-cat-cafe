import { test, expect, type Page } from '../support/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { mockV2Save } from '../../src/api/mockV2Fixtures';

const key = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
async function enter(page: Page, keys = 1, chapter = 1) {
  const save = mockV2Save('bossReadyStrong', { nowMs: Date.now(), chapter });
  for (let cleared = 1; cleared < chapter; cleared++) save.state.bossClears[cleared] = { wins: 1 };
  save.state.stacks.catKey = keys;
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save));
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key, save });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Map', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Boss Gate' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
for (const size of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  test.describe(`${size.width}x${size.height}`, () => {
    test.use({ viewport: size });
    test('chapter path, keyboard gates, no nested scroll, unchanged art and reduced motion', async ({ page }) => {
      const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await enter(page);
      const map = page.getByRole('navigation', { name: 'Chapter Map' });
      await expect(map.locator('[data-chapter]')).toHaveCount(5);
      await expect(map.locator('.v2-map-thumb svg')).toHaveCount(5);
      await expect(page.locator('.boss-portrait-svg')).toBeVisible();
      const locked = map.getByRole('button', { name: /Kitchen/ });
      await locked.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Space');
      await expect(locked).toHaveAttribute('aria-disabled', 'true');
      await expect(page.locator('.boss-gate-boss-name')).toHaveText('Yarn Giant');
      const current = map.getByRole('button', { name: /Living Room/ });
      await current.focus(); await page.keyboard.press('Enter');
      await expect(current).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByText('Daily attempts: Key-limited')).toBeVisible();
      await expect(page.getByText('300–500 · 100%')).toBeVisible();
      const geometry = await page.locator('#panel-map').evaluate(panel => {
        const bad: string[] = [];
        for (const node of [panel, ...panel.querySelectorAll('*')]) {
          const el = node as HTMLElement; const style = getComputedStyle(el); const rect = el.getBoundingClientRect();
          if (!rect.width || !rect.height || style.position === 'absolute') continue;
          if (/auto|scroll/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) bad.push(`${el.className}: scroll`);
          if (rect.bottom > innerHeight + 1 || rect.right > innerWidth + 1) bad.push(`${el.className}: viewport`);
        }
        return { bad, document: document.documentElement.scrollHeight > innerHeight,
          animations: panel.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length };
      });
      expect(geometry).toEqual({ bad: [], document: false, animations: 0 });
      expect(errors).toEqual([]);
      if (process.env.SCREENSHOTS === '1') {
        mkdirSync('../../reports/scorecard/cxu5', { recursive: true });
        await page.screenshot({ path: `../../reports/scorecard/cxu5/map-${size.width}.png` });
      }
    });
    test('no key refuses fight and explains the existing daily claim', async ({ page }) => {
      await enter(page, 0);
      await expect(page.getByRole('button', { name: 'Fight', exact: true })).toBeDisabled();
      await expect(page.getByTestId('boss-key-hint')).toBeVisible();
      await expect(page.getByTestId('boss-key-hint-sources')).toContainText('Daily: 1 Cat Key');
      await expect(page.getByRole('region', { name: 'Past runs' })).toContainText('No completed fights here this session.');
      const bounds = await page.locator('.boss-map-sidebar').evaluate(el => ({ bottom: el.getBoundingClientRect().bottom, viewport: innerHeight }));
      expect(bounds.bottom).toBeLessThanOrEqual(bounds.viewport);
      if (process.env.SCREENSHOTS === '1') {
        mkdirSync('../../reports/scorecard/cxu5', { recursive: true });
        const chapter = await page.locator('.v2-map-node[aria-pressed="true"]').getAttribute('data-chapter');
        await page.screenshot({ path: `../../reports/scorecard/cxu5/map-no-key-ch${chapter}-${size.width}.png` });
      }
    });
    test('chapter five shows every reward and shortcut without clipping', async ({ page }) => {
      await enter(page, 0, 5);
      await expect(page.locator('.boss-map-rewards li')).toHaveCount(9);
      await expect(page.getByRole('navigation', { name: 'Chapter selection' }).getByRole('button')).toHaveCount(5);
      const bounds = await page.locator('.boss-map-sidebar').evaluate(el => ({ bottom: el.getBoundingClientRect().bottom, viewport: innerHeight }));
      expect(bounds.bottom).toBeLessThanOrEqual(bounds.viewport);
      if (process.env.SCREENSHOTS === '1') {
        mkdirSync('../../reports/scorecard/cxu5', { recursive: true });
        const chapter = await page.locator('.v2-map-node[aria-pressed="true"]').getAttribute('data-chapter');
        await page.screenshot({ path: `../../reports/scorecard/cxu5/map-no-key-ch${chapter}-${size.width}.png` });
      }
    });
    test('replay releases one result into history, selecting nodes updates fight card', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await enter(page, 2);
      await page.getByRole('button', { name: 'Fight', exact: true }).click();
      await expect(page.getByText('Victory!', { exact: true })).toBeVisible();
      const dialog = page.getByRole('dialog');
      if (await dialog.count()) {
        const buttons = dialog.getByRole('button');
        await buttons.last().click();
      }
      await expect(page.getByRole('region', { name: 'Past runs' })).toContainText('Win');
      await expect(page.getByRole('region', { name: 'Past runs' }).getByRole('listitem')).toHaveCount(1);
      const map = page.getByRole('navigation', { name: 'Chapter Map' });
      await map.getByRole('button', { name: /Kitchen/ }).click();
      await expect(page.locator('.boss-gate-boss-name')).toHaveText('Cucumber Scare');
      await expect(page.getByRole('region', { name: 'Past runs' })).toContainText('No completed fights here this session.');
      await map.getByRole('button', { name: /Living Room/ }).click();
      await expect(page.locator('.boss-gate-boss-name')).toHaveText('Yarn Giant');
      await expect(page.getByRole('button', { name: 'Rematch', exact: true })).toBeVisible();
      await expect(page.getByText('120–200 · 100%')).toBeVisible();
    });
  });
}
