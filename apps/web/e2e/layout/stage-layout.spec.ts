import { expect, test, type Locator, type Page } from '../support/test';
import fs from 'node:fs';
import { stageHeight, stageZoom } from '../../src/layout/metrics';
import path from 'node:path';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';
// Read the exported key without importing the browser adapter and its wallet/JSON dependencies.
const MOCK_V2_STORAGE_KEY = fs.readFileSync(path.resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

// These specs run against the VITE_GAME_V2=1 build (see playwright.config.ts).
// Screenshots overwrite committed images, so they are only written on request: SCREENSHOTS=1 [SCREENSHOT_DIR=...].
const writeScreenshots = process.env.SCREENSHOTS === '1';
const outDir = process.env.SCREENSHOT_DIR ?? path.resolve(process.cwd(), '../../screenshots/v13');
if (writeScreenshots) fs.mkdirSync(outDir, { recursive: true });

const TAB_NAMES = ['Inventory', 'Boss', 'Forge', 'Market', 'Help'];
const VIEWPORTS = [
  { name: '320', width: 320, height: 568 },
  { name: '390', width: 390, height: 844 },
  { name: '1280', width: 1280, height: 800 },
];

test.beforeEach(async ({ page }, testInfo) => {
  const save = testInfo.title.startsWith('v2 class choice') ? null : mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'warrior' });
  await page.addInitScript(({ key, save }) => {
    if (save === null) window.localStorage.removeItem(key);
    else if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, save);
    window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key: MOCK_V2_STORAGE_KEY, save });
});

async function noHorizontalScroll(page: Page): Promise<void> {
  const o = await page.evaluate(() => ({
    doc: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
    body: [document.body.scrollWidth, document.body.clientWidth],
  }));
  expect(o.doc[0]).toBeLessThanOrEqual(o.doc[1]!);
  expect(o.body[0]).toBeLessThanOrEqual(o.body[1]!);
}

async function tabTo(page: Page, target: Locator): Promise<void> {
  // Real keyboard navigation, so a removed tab stop cannot pass via focus().
  for (let step = 0; step < 60; step++) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  await expect(target).toBeFocused();
}

async function expectNamedControls(page: Page): Promise<void> {
  const controls = page.locator('button, a[href], [role="button"], [role="link"]');
  expect(await controls.count()).toBeGreaterThan(0);
  for (const control of await controls.all()) {
    if (await control.isVisible()) await expect(control).toHaveAccessibleName(/\S/);
  }
}

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  expect(b).not.toBeNull();
  return b!;
}

for (const vp of VIEWPORTS) {
  for (const reduced of [false, true]) {
    test(`stage layout at ${vp.name}px${reduced ? ' with reduced motion' : ''}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      await expect(page.getByRole('heading', { level: 1, name: 'Taskbar Hero' })).toBeVisible();
      await expect(page.getByLabel('Currencies and keys')).toBeVisible();
      await expect(page.getByTestId('next-hint')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Mini mode' })).toBeVisible();
      await expect(page.getByRole('region', { name: 'Character' })).toBeVisible();
      await expect(page.getByTestId('character-power')).toBeVisible();

      const stage = page.getByRole('region', { name: 'Game stage' });
      await expect(stage).toBeVisible();
      await expect(stage.locator('canvas')).toHaveCount(1);
      const s = await box(stage);
      if (vp.width >= 1024) {
        // U3 reserves room for the panel: clamp(200px, 40vh, 360px).
        expect(Math.abs(s.height - Math.min(360, Math.max(200, vp.height * 0.4)))).toBeLessThanOrEqual(1);
        expect(s.width).toBe(Math.min(vp.width, 1440));
      } else {
        // Phone: 16:9.
        expect(Math.abs(s.height / s.width - 9 / 16)).toBeLessThan(0.01);
      }
      // The scene is zoomed by a whole number, not stretched: canvas height is a multiple of 96.
      const c = await box(stage.locator('canvas'));
      expect(c.height % 96).toBeLessThan(0.5);
      // Renderer zoom remains based on the logical 60vh scene; the U3 container
      // deliberately crops sky above it. Feet must stay on the container floor.
      expect(c.height).toBe(96 * stageZoom(vp.width, stageHeight(vp.width, vp.height)));
      expect(Math.abs(c.y + c.height - (s.y + s.height))).toBeLessThanOrEqual(1);
      expect(c.width).toBeLessThanOrEqual(s.width);

      await noHorizontalScroll(page);
      if (writeScreenshots) {
        await page.waitForTimeout(400); // let the scene draw a few frames
        await page.screenshot({ path: path.join(outDir, `stage-${vp.name}${reduced ? '-reduced' : ''}.png`) });
      }

      if (vp.width <= 600) {
        await page.getByRole('tab', { name: 'Inventory', exact: true }).click();
        await expect(page.getByRole('tabpanel', { name: 'Inventory' })).toBeVisible();
        await noHorizontalScroll(page);
        if (writeScreenshots) {
          await page.waitForTimeout(250);
          await page.screenshot({ path: path.join(outDir, `sheet-${vp.name}${reduced ? '-reduced' : ''}.png`) });
        }
      } else if (writeScreenshots) {
        await page.getByRole('tab', { name: 'Forge', exact: true }).click();
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(outDir, `tabs-${vp.name}${reduced ? '-reduced' : ''}.png`) });
      }
    });
  }
}

test.describe('desktop tabs', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('shows Inventory, Boss, Forge, Market and Help; every tab is reachable by keyboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('tab')).toHaveCount(TAB_NAMES.length);
    expect(await page.getByRole('tab').allTextContents()).toEqual(TAB_NAMES);

    for (const key of ['Enter', 'Space']) {
      for (const name of ['Market', ...TAB_NAMES]) {
        const tab = page.getByRole('tab', { name, exact: true });
        await tabTo(page, tab);
        await expect(tab).toBeFocused();
        await page.keyboard.press(key);
        await expect(tab).toHaveAttribute('aria-selected', 'true');
        await expect(page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { selected: true })).toHaveCount(1);
        await expect(page.getByRole('tabpanel', { name, exact: true })).toBeVisible();
      }
    }
  });

  test('arrow keys move focus along the tabs', async ({ page }) => {
    await page.goto('/');
    const first = page.getByRole('tab', { name: 'Inventory', exact: true });
    await first.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Boss', exact: true })).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'Help', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(first).toBeFocused();
  });

  test('buttons and links have accessible names on every tab', async ({ page }) => {
    await page.goto('/');
    await expectNamedControls(page);
    for (const name of TAB_NAMES) {
      await page.getByRole('tab', { name, exact: true }).click();
      await expect(page.getByRole('tabpanel', { name, exact: true })).toBeVisible();
      await expectNamedControls(page);
    }
  });

  test('the next-step chip opens the tab it points to', async ({ page }) => {
    await page.goto('/');
    const chip = page.getByTestId('next-hint').getByRole('button');
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { selected: true })).toHaveCount(1);
  });
});

test.describe('phone bottom sheet', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens from the bottom nav, covers at most 60% of the screen and closes again', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Game menu' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('tab')).toHaveCount(TAB_NAMES.length);
    await expect(page.getByRole('tabpanel')).toBeHidden();

    for (const name of TAB_NAMES) {
      await nav.getByRole('tab', { name, exact: true }).click();
      const panel = page.getByRole('tabpanel', { name, exact: true });
      await expect(panel).toBeVisible();
      const sheet = await box(page.locator('.v2-sheet'));
      const navBox = await box(nav);
      // Sheet plus nav stay within 60% of the viewport.
      expect(navBox.y + navBox.height - sheet.y).toBeLessThanOrEqual(844 * 0.6 + 1);
      await noHorizontalScroll(page);
    }

    // Tapping the open tab again closes the sheet.
    await nav.getByRole('tab', { name: 'Help', exact: true }).click();
    await expect(page.getByRole('tabpanel')).toBeHidden();

    // Escape and the close button also close it, and focus returns to the nav.
    await nav.getByRole('tab', { name: 'Boss', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tabpanel')).toBeHidden();
    await expect(nav.getByRole('tab', { name: 'Boss', exact: true })).toBeFocused();
    await nav.getByRole('tab', { name: 'Forge', exact: true }).click();
    await page.getByRole('button', { name: 'Close panel' }).click();
    await expect(page.getByRole('tabpanel')).toBeHidden();
  });

  test('every nav tab is reachable by keyboard', async ({ page }) => {
    await page.goto('/');
    for (const name of TAB_NAMES) {
      const tab = page.getByRole('tab', { name, exact: true });
      await tabTo(page, tab);
      await page.keyboard.press('Enter');
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('Enter'); // close again so the next tab starts from a closed sheet
      await expect(tab).toHaveAttribute('aria-selected', 'false');
    }
  });

  test('the sheet does not hide the stage', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Inventory', exact: true }).click();
    const stage = await box(page.getByRole('region', { name: 'Game stage' }));
    const sheet = await box(page.locator('.v2-sheet'));
    // The sheet may overlap the page below the stage, but the stage top stays on screen.
    expect(stage.y).toBeGreaterThanOrEqual(0);
    expect(sheet.y).toBeGreaterThan(0);
  });
});

test.describe('Mini mode', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('switches to the classic 96 px strip, is remembered, and switches back', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Game stage' })).toBeVisible();
    await page.getByRole('button', { name: 'Mini mode' }).click();

    const strip = page.getByRole('region', { name: 'Taskbar strip' });
    await expect(strip).toBeVisible();
    await expect(page.getByRole('region', { name: 'Game stage' })).toHaveCount(0);
    expect((await box(strip)).height).toBe(96);
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('region', { name: 'Taskbar strip' })).toBeVisible();

    await page.getByRole('button', { name: 'Stage', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Game stage' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('region', { name: 'Game stage' })).toBeVisible();
  });

  test('works when localStorage throws', async ({ page }) => {
    await page.addInitScript(() => {
      const fail = () => {
        throw new Error('blocked');
      };
      Storage.prototype.getItem = fail;
      Storage.prototype.setItem = fail;
    });
    await page.goto('/');
    // The How to play dialog opens when its "seen" flag cannot be read.
    await page.getByRole('button', { name: 'Start playing' }).click();
    await expect(page.getByRole('region', { name: 'Game stage' })).toBeVisible();
    await page.getByRole('button', { name: 'Mini mode' }).click();
    await expect(page.getByRole('region', { name: 'Taskbar strip' })).toBeVisible();
  });
});


for (const width of [390, 1280]) {
  test(`v2 class choice and timed claim at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 720 });
    const nowMs = Date.now();
    await page.clock.install({ time: nowMs });
    await page.goto('/');
    await expect(page.getByTestId('class-picker')).toBeVisible();
    await page.getByTestId('class-picker-choose-button').click();
    await page.getByTestId('class-picker-confirm-button').click();
    await expect(page.getByTestId('class-picker')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Game stage' }).locator('canvas')).toBeVisible();
    const progress = page.getByRole('group', { name: /^Chapter / });
    const before = await progress.textContent();
    await page.clock.fastForward(10 * 60 * 1000);
    await expect(progress).not.toHaveText(before!);
    await expect(page.getByLabel('Currencies and keys')).toContainText('Fish');
    await noHorizontalScroll(page);
    expect(errors).toEqual([]);
    await page.evaluate(() => window.scrollTo(0, 0));
    if (writeScreenshots) await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR ?? path.resolve(process.cwd(), '../../reports/v16-stage'), `stage-${width}.png`) });
  });
}
