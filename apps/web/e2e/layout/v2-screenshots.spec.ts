import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';

const STORAGE_KEY = 'taskbar-hero:v2-demo:1';
const OUT_DIR = path.resolve(process.cwd(), '../../docs/screenshots/v2');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

interface ScreenshotTarget {
  name: string;
  setup: (page: Page, width: number) => Promise<void>;
}

const VIEWPORTS = [
  { name: '1280', width: 1280, height: 720 },
  { name: '390', width: 390, height: 844 },
];

const THEMES = ['dark', 'light'] as const;

async function setTheme(page: Page, theme: 'dark' | 'light') {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
  await page.waitForTimeout(100);
}

async function setSave(page: Page, save: string | null) {
  await page.addInitScript(
    ({ key, s }) => {
      if (s === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, s);
      window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    },
    { key: STORAGE_KEY, s: save },
  );
}

test.describe('Cat RPG v2 Screenshot Capture', () => {
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`capture class-picker at ${vp.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await setSave(page, null);
        await page.goto('/');
        await setTheme(page, theme);
        await expect(page.getByTestId('class-picker')).toBeVisible();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(OUT_DIR, `class-picker-${vp.name}-${theme}.png`) });
      });

      test(`capture stage-hud at ${vp.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const save = mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'warrior' });
        await setSave(page, save);
        await page.goto('/');
        await setTheme(page, theme);
        await expect(page.getByRole('region', { name: 'Game stage' })).toBeVisible();
        await expect(page.getByLabel('Currencies and keys')).toBeVisible();
        await page.waitForTimeout(400); // let Phaser draw
        await page.screenshot({ path: path.join(OUT_DIR, `stage-hud-${vp.name}-${theme}.png`) });
      });

      test(`capture bag and character at ${vp.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const save = mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'warrior' });
        await setSave(page, save);
        await page.goto('/');
        await setTheme(page, theme);
        if (vp.width <= 600) {
          // In phone view, open Inventory sheet
          await page.getByRole('navigation', { name: 'Game menu' }).getByRole('tab', { name: 'Inventory' }).click();
          await expect(page.getByRole('tabpanel', { name: 'Inventory' })).toBeVisible();
        } else {
          await page.getByRole('tab', { name: 'Inventory' }).click();
          await expect(page.getByRole('tabpanel', { name: 'Inventory' })).toBeVisible();
        }
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(OUT_DIR, `bag-${vp.name}-${theme}.png`) });

        // Character panel capture
        if (vp.width <= 600) {
          // Close sheet to reveal character area on mobile
          await page.getByRole('button', { name: 'Close panel' }).click();
          await page.waitForTimeout(200);
        }
        await page.screenshot({ path: path.join(OUT_DIR, `character-${vp.name}-${theme}.png`) });
      });

      test(`capture forge at ${vp.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const save = mockV2SaveJson('forgeRich', { nowMs: Date.now(), classId: 'warrior' });
        await setSave(page, save);
        await page.goto('/');
        await setTheme(page, theme);
        if (vp.width <= 600) {
          await page.getByRole('navigation', { name: 'Game menu' }).getByRole('tab', { name: 'Forge' }).click();
        } else {
          await page.getByRole('tab', { name: 'Forge' }).click();
        }
        await expect(page.getByRole('tabpanel', { name: 'Forge' })).toBeVisible();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(OUT_DIR, `forge-${vp.name}-${theme}.png`) });
      });

      test(`capture map and boss gate at ${vp.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const save = mockV2SaveJson('bossReadyStrong', { nowMs: Date.now(), classId: 'warrior' });
        await setSave(page, save);
        await page.goto('/');
        await setTheme(page, theme);
        if (vp.width <= 600) {
          await page.getByRole('navigation', { name: 'Game menu' }).getByRole('tab', { name: 'Boss' }).click();
        } else {
          await page.getByRole('tab', { name: 'Boss' }).click();
        }
        await expect(page.getByRole('tabpanel', { name: 'Boss' })).toBeVisible();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(OUT_DIR, `boss-gate-${vp.name}-${theme}.png`) });
        await page.screenshot({ path: path.join(OUT_DIR, `map-${vp.name}-${theme}.png`) });
      });

      test(`capture arena at ${vp.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/?dev=arena&fixture=ch1-win');
        await setTheme(page, theme);
        await expect(page.locator('.boss-arena canvas')).toBeVisible();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT_DIR, `arena-${vp.name}-${theme}.png`) });
      });

      test(`capture chest reveal at ${vp.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const save = mockV2SaveJson('bossReadyStrong', { nowMs: Date.now(), classId: 'warrior' });
        await setSave(page, save);
        await page.goto('/');
        await setTheme(page, theme);
        if (vp.width <= 600) {
          await page.getByRole('navigation', { name: 'Game menu' }).getByRole('tab', { name: 'Boss' }).click();
        } else {
          await page.getByRole('tab', { name: 'Boss' }).click();
        }
        await expect(page.getByRole('tabpanel', { name: 'Boss' })).toBeVisible();
        // Click fight
        const fightBtn = page.getByRole('button', { name: /Fight|Rematch/i });
        await expect(fightBtn).toBeVisible();
        await fightBtn.click();

        // Arena appears
        await expect(page.locator('.boss-arena')).toBeVisible();
        // Click skip fight to immediately reach victory & chest reveal
        const skipBtn = page.getByRole('button', { name: 'Skip fight' });
        await expect(skipBtn).toBeVisible();
        await skipBtn.click();

        // Chest reveal appears
        await expect(page.locator('.chest-reveal-scrim')).toBeVisible();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT_DIR, `chest-reveal-${vp.name}-${theme}.png`) });
      });

      test(`capture help tab at ${vp.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const save = mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'warrior' });
        await setSave(page, save);
        await page.goto('/');
        await setTheme(page, theme);
        if (vp.width <= 600) {
          await page.getByRole('navigation', { name: 'Game menu' }).getByRole('tab', { name: 'Help' }).click();
        } else {
          await page.getByRole('tab', { name: 'Help' }).click();
        }
        await expect(page.getByRole('tabpanel', { name: 'Help' })).toBeVisible();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(OUT_DIR, `help-tab-${vp.name}-${theme}.png`) });
      });
    }
  }
});
