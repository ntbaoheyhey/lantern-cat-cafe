import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';

const STORAGE_KEY = 'taskbar-hero:v2-demo:1';
const QA1_DIR = path.resolve(process.cwd(), '../../reports/qa-v2-1');
if (!fs.existsSync(QA1_DIR)) {
  fs.mkdirSync(QA1_DIR, { recursive: true });
}

async function noHorizontalScroll(page: Page): Promise<void> {
  const o = await page.evaluate(() => ({
    doc: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
    body: [document.body.scrollWidth, document.body.clientWidth],
  }));
  expect(o.doc[0]).toBeLessThanOrEqual(o.doc[1]!);
  expect(o.body[0]).toBeLessThanOrEqual(o.body[1]!);
}

test.describe('QA1 Verification: Local v2 Demo Build', () => {
  test('Step 1: Initial Load & Class Selection at 390px', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.setViewportSize({ width: 390, height: 844 });

    // Clear storage for fresh first-run
    await page.addInitScript(({ key }) => {
      window.localStorage.removeItem(key);
      window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key: STORAGE_KEY });

    await page.goto('/');
    const classPicker = page.getByTestId('class-picker');
    await expect(classPicker).toBeVisible();

    // Verify all 7 classes are present
    const radios = page.getByRole('radio');
    expect(await radios.count()).toBe(7);

    await page.screenshot({ path: path.join(QA1_DIR, 'qa1-01-classpicker-390.png') });

    // Select Warrior and confirm
    await page.getByTestId('class-picker-choose-button').click();
    await page.getByTestId('class-picker-confirm-button').click();

    // Modal closes
    await expect(classPicker).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Game stage' })).toBeVisible();
    await noHorizontalScroll(page);
    expect(consoleErrors).toEqual([]);
  });

  test('Step 2 & 3: Stage, HUD & Ambient Idle at 1280px', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.setViewportSize({ width: 1280, height: 720 });
    const save = mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'warrior' });
    await page.addInitScript(({ key, s }) => {
      window.localStorage.setItem(key, s);
      window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key: STORAGE_KEY, s: save });

    await page.goto('/');

    // Check HUD bar elements
    await expect(page.getByLabel('Currencies and keys')).toBeVisible();
    await expect(page.getByTestId('next-hint')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Character' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Game stage' }).locator('canvas')).toBeVisible();

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(QA1_DIR, 'qa1-02-hud-stage-1280.png') });

    await noHorizontalScroll(page);
    expect(consoleErrors).toEqual([]);
  });

  test('Step 4: Bag & Character Panel at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const save = mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'warrior' });
    await page.addInitScript(({ key, s }) => {
      window.localStorage.setItem(key, s);
      window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key: STORAGE_KEY, s: save });

    await page.goto('/');
    await page.getByRole('tab', { name: 'Inventory' }).click();

    await expect(page.getByRole('tabpanel', { name: 'Inventory' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Equip best' })).toBeVisible();

    // Check 9 equipment slots in Character panel
    const slotNames = ['Weapon', 'Helmet', 'Armor', 'Gloves', 'Boots', 'Collar', 'Earring', 'Ring', 'Charm'];
    for (const name of slotNames) {
      await expect(page.getByRole('button', { name: new RegExp(`^${name}:`, 'i') })).toBeVisible();
    }

    await page.screenshot({ path: path.join(QA1_DIR, 'qa1-06-bag-equip-1280.png') });
    await noHorizontalScroll(page);
  });

  test('Step 5: Boss Gate States & Cooldown at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const now = Date.now();
    // midGame has chapter 2, round 5 -> not_reached state
    const save = mockV2SaveJson('midGame', { nowMs: now, classId: 'warrior' });
    const parsed = JSON.parse(save);
    // Put on 45s loss cooldown
    parsed.state.bossCooldownUntil = Math.floor(now / 1000) + 45;

    await page.addInitScript(({ key, s }) => {
      window.localStorage.setItem(key, s);
      window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key: STORAGE_KEY, s: JSON.stringify(parsed) });

    await page.goto('/');
    await page.getByRole('navigation', { name: 'Game menu' }).getByRole('tab', { name: 'Boss' }).click();

    await expect(page.getByRole('tabpanel', { name: 'Boss' })).toBeVisible();
    // Shows Catnap cooldown
    await expect(page.locator('.boss-gate-panel')).toContainText(/Catnap/i);

    await page.screenshot({ path: path.join(QA1_DIR, 'qa1-03-boss-gate-cooldown-390.png') });
    await noHorizontalScroll(page);
  });

  test('Step 5b: Chapter Map at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const save = mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'warrior' });
    await page.addInitScript(({ key, s }) => {
      window.localStorage.setItem(key, s);
      window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key: STORAGE_KEY, s: save });

    await page.goto('/');
    await page.getByRole('navigation', { name: 'Game menu' }).getByRole('tab', { name: 'Boss' }).click();

    await expect(page.getByRole('navigation', { name: 'Chapter Map' })).toBeVisible();
    await page.screenshot({ path: path.join(QA1_DIR, 'qa1-09-chapter-map-390.png') });
    await noHorizontalScroll(page);
  });

  test('Step 6: Boss Battle Victory & Chest Reveal at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const save = mockV2SaveJson('bossReadyStrong', { nowMs: Date.now(), classId: 'warrior' });
    await page.addInitScript(({ key, s }) => {
      window.localStorage.setItem(key, s);
      window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key: STORAGE_KEY, s: save });

    await page.goto('/');
    await page.getByRole('tab', { name: 'Boss' }).click();

    const fightBtn = page.getByRole('button', { name: /^Fight/i });
    await expect(fightBtn).toBeVisible();
    await fightBtn.click();

    // Arena opens
    await expect(page.locator('.boss-arena')).toBeVisible();
    await page.screenshot({ path: path.join(QA1_DIR, 'qa1-07-arena-fight-1280.png') });

    // Skip fight
    await page.getByRole('button', { name: 'Skip fight' }).click();

    // Victory chest opens
    await expect(page.locator('.chest-reveal-scrim')).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(QA1_DIR, 'qa1-04-boss-win-chest-1280.png') });
    await noHorizontalScroll(page);
  });

  test('Step 8: The Forge Crafting at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const save = mockV2SaveJson('forgeRich', { nowMs: Date.now(), classId: 'warrior' });
    await page.addInitScript(({ key, s }) => {
      window.localStorage.setItem(key, s);
      window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key: STORAGE_KEY, s: save });

    await page.goto('/');
    await page.getByRole('navigation', { name: 'Game menu' }).getByRole('tab', { name: 'Forge' }).click();

    await expect(page.getByRole('tabpanel', { name: 'Forge' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Craft/i })).toBeVisible();

    await page.screenshot({ path: path.join(QA1_DIR, 'qa1-05-forge-craft-390.png') });
    await noHorizontalScroll(page);
  });

  test('Step 11: Mini Mode Toggle & Persistence at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const save = mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'warrior' });
    await page.addInitScript(({ key, s }) => {
      window.localStorage.setItem(key, s);
      window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key: STORAGE_KEY, s: save });

    await page.goto('/');
    await page.getByRole('button', { name: 'Mini mode' }).click();

    // Collapses to 96px strip
    const strip = page.getByRole('region', { name: 'Taskbar strip' });
    await expect(strip).toBeVisible();
    await page.screenshot({ path: path.join(QA1_DIR, 'qa1-08-minimode-strip-1280.png') });

    // Reload persists mini mode
    await page.reload();
    await expect(page.getByRole('region', { name: 'Taskbar strip' })).toBeVisible();

    // Toggle back to stage
    await page.getByRole('button', { name: 'Stage' }).click();
    await expect(page.getByRole('region', { name: 'Game stage' })).toBeVisible();
    await noHorizontalScroll(page);
  });

  test('Step 12: In-Game Help Tab at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const save = mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'warrior' });
    await page.addInitScript(({ key, s }) => {
      window.localStorage.setItem(key, s);
      window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key: STORAGE_KEY, s: save });

    await page.goto('/');
    await page.getByRole('tab', { name: 'Help' }).click();

    await expect(page.getByRole('tabpanel', { name: 'Help' })).toBeVisible();
    await expect(page.getByText(/Mochi the cat naps/i)).toBeVisible();

    await page.screenshot({ path: path.join(QA1_DIR, 'qa1-10-help-tab-1280.png') });
    await noHorizontalScroll(page);
  });
});
