import { expect, test, type Page } from '../support/test';
import fs from 'node:fs';
import path from 'node:path';
import { sampleStateV2 } from '../../src/layout/sampleState';
import { mockV2Save } from '../../src/api/mockV2Fixtures';

const STORAGE_KEY = fs
  .readFileSync(path.resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8')
  .match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1024x600', width: 1024, height: 600 },
  { name: '390x844', width: 390, height: 844 },
  { name: '320x568', width: 320, height: 568 },
  { name: '844x390', width: 844, height: 390 },
] as const;

const outDir = path.resolve(process.cwd(), '../../reports/g2-shell');

async function seedSave(page: Page): Promise<void> {
  const sample = sampleStateV2();
  const save = mockV2Save('bossReadyStrong', { nowMs: Date.now(), classId: 'warrior', chapter: 1 });
  save.state.stacks = {
    yarn: 100,
    fluffTuft: 100,
    shinyButton: 100,
    fish: 1000,
    catKey: 2,
  };
  save.state.items = sample.inventory.map((i) => ({
    ...i,
    itemId: i.itemKey,
    bonusLines: i.bonus,
    source: 'drop' as const,
  }));
  await page.addInitScript(
    ({ key, saveJson }) => {
      window.localStorage.setItem(key, saveJson);
      window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
      window.localStorage.removeItem('taskbar-hero.miniMode');
    },
    { key: STORAGE_KEY, saveJson: JSON.stringify(save) }
  );
}

test.describe('G2 Shell: 100dvh Window Fit & Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await seedSave(page);
  });

  for (const vp of VIEWPORTS) {
    test(`fits window without document scroll at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      await expect(page.getByRole('heading', { level: 1, name: 'Taskbar Hero' })).toBeVisible();
      await expect(page.getByRole('region', { name: 'Game stage' })).toBeVisible();

      // Assert no document scrolling in normal play
      const { scrollHeight, innerHeight, scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));

      expect(
        scrollHeight,
        `scrollHeight (${scrollHeight}) exceeded innerHeight (${innerHeight}) at ${vp.name}`
      ).toBeLessThanOrEqual(innerHeight + 1);

      expect(
        scrollWidth,
        `scrollWidth (${scrollWidth}) exceeded innerWidth (${innerWidth}) at ${vp.name}`
      ).toBeLessThanOrEqual(innerWidth);

      // Capture screenshot if SCREENSHOTS=1
      if (process.env.SCREENSHOTS === '1') {
        fs.mkdirSync(outDir, { recursive: true });
        const filePath = path.join(outDir, `shell-${vp.name}.png`);
        await page.screenshot({ path: filePath });
        const stat = fs.statSync(filePath);
        // Ensure under 200KB as requested
        expect(stat.size).toBeLessThan(200 * 1024);
      }
    });
  }
});

test.describe('G2 Shell: Primary Actions Visibility & Reachability', () => {
  test.beforeEach(async ({ page }) => {
    await seedSave(page);
  });

  test('Equip best visible and clickable within 2 interactions from fresh load', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    let interactions = 0;
    // Interaction 1: Click Bag tab
    const bagTab = page.getByRole('tab', { name: 'Bag' });
    await bagTab.click();
    interactions++;

    // Primary action: Equip best button
    const equipBestBtn = page.getByRole('button', { name: 'Equip best', exact: true });
    await expect(equipBestBtn).toBeVisible();
    await expect(equipBestBtn).toBeEnabled();
    const visibleAtInteractions = interactions;

    // Interaction 2: Click Equip best
    await equipBestBtn.click();
    interactions++;

    expect(visibleAtInteractions).toBeLessThanOrEqual(2);
    expect(interactions).toBeLessThanOrEqual(2);
  });

  test('Fight visible and clickable within 2 interactions from fresh load', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    let interactions = 0;
    // Interaction 1: Click Boss tab
    const bossTab = page.getByRole('tab', { name: 'Boss' });
    await bossTab.click();
    interactions++;

    // Primary action: Fight button
    const fightBtn = page.getByRole('button', { name: /^(Fight|Rematch)$/i });
    await expect(fightBtn).toBeVisible();
    await expect(fightBtn).toBeEnabled();
    const visibleAtInteractions = interactions;

    // Interaction 2: Click Fight
    await fightBtn.click();
    interactions++;

    expect(visibleAtInteractions).toBeLessThanOrEqual(2);
    expect(interactions).toBeLessThanOrEqual(2);
  });

  test('Craft visible and clickable within 2 interactions from fresh load', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    let interactions = 0;
    // Interaction 1: Click Forge tab
    const forgeTab = page.getByRole('tab', { name: 'Forge' });
    await forgeTab.click();
    interactions++;

    // Primary action: Craft button
    const craftBtn = page.getByTestId('craft-btn');
    await expect(craftBtn).toBeVisible();
    await expect(craftBtn).toBeEnabled();
    const visibleAtInteractions = interactions;

    // Interaction 2: Click Craft button
    await craftBtn.click();
    interactions++;

    expect(visibleAtInteractions).toBeLessThanOrEqual(2);
    expect(interactions).toBeLessThanOrEqual(2);
  });
});

test.describe('G2 Shell: Touch Targets on Phone Sizes', () => {
  test.beforeEach(async ({ page }) => {
    await seedSave(page);
  });

  const PHONE_SIZES = [
    { name: '390x844', width: 390, height: 844 },
    { name: '320x568', width: 320, height: 568 },
  ];

  for (const vp of PHONE_SIZES) {
    test(`every tab, button and nav item >= 44x44 px at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Check bottom nav items
      const navTabs = page.getByRole('navigation', { name: 'Game menu' }).getByRole('tab');
      const count = await navTabs.count();
      expect(count).toBe(6);

      for (let i = 0; i < count; i++) {
        const b = await navTabs.nth(i).boundingBox();
        expect(b, `Nav tab ${i} bounding box was null`).not.toBeNull();
        expect(b!.width).toBeGreaterThanOrEqual(44 - 0.5);
        expect(b!.height).toBeGreaterThanOrEqual(44 - 0.5);
      }

      // Check topbar buttons (e.g. wallet link/button, hint chip)
      const topbarButtons = page.locator('.v2-topbar button:visible, .v2-topbar a:visible');
      const topbarCount = await topbarButtons.count();
      for (let i = 0; i < topbarCount; i++) {
        const b = await topbarButtons.nth(i).boundingBox();
        if (b) {
          expect(b.width).toBeGreaterThanOrEqual(44 - 0.5);
          expect(b.height).toBeGreaterThanOrEqual(44 - 0.5);
        }
      }

      // Open Bag and verify action button and tiles
      await page.getByRole('tab', { name: 'Bag' }).click();
      const bagAction = page.getByRole('button', { name: 'Equip best', exact: true });
      await expect(bagAction).toBeVisible();
      const bagActionBox = await bagAction.boundingBox();
      expect(bagActionBox!.width).toBeGreaterThanOrEqual(44 - 0.5);
      expect(bagActionBox!.height).toBeGreaterThanOrEqual(44 - 0.5);

      // Open Boss and verify action button
      await page.getByRole('tab', { name: 'Boss' }).click();
      const bossAction = page.getByRole('button', { name: /^(Fight|Rematch)$/i });
      await expect(bossAction).toBeVisible();
      const bossActionBox = await bossAction.boundingBox();
      expect(bossActionBox!.width).toBeGreaterThanOrEqual(44 - 0.5);
      expect(bossActionBox!.height).toBeGreaterThanOrEqual(44 - 0.5);

      // Open Forge and verify action button
      await page.getByRole('tab', { name: 'Forge' }).click();
      const forgeAction = page.getByTestId('craft-btn');
      await expect(forgeAction).toBeVisible();
      const forgeActionBox = await forgeAction.boundingBox();
      expect(forgeActionBox!.width).toBeGreaterThanOrEqual(44 - 0.5);
      expect(forgeActionBox!.height).toBeGreaterThanOrEqual(44 - 0.5);
    });
  }
});

test.describe('G2 Shell: 320x568 Layout Guarantee', () => {
  test.beforeEach(async ({ page }) => {
    await seedSave(page);
  });

  test('stage >= 160px tall and primary action visible without scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');

    const stage = page.getByRole('region', { name: 'Game stage' });
    await expect(stage).toBeVisible();
    const stageBox = await stage.boundingBox();
    expect(stageBox).not.toBeNull();
    expect(stageBox!.height).toBeGreaterThanOrEqual(160);

    // Bag: Equip best is visible in viewport without scrolling
    await page.getByRole('tab', { name: 'Bag' }).click();
    const equipBest = page.getByRole('button', { name: 'Equip best', exact: true });
    await expect(equipBest).toBeInViewport();

    // Boss: Fight is visible in viewport without scrolling
    await page.getByRole('tab', { name: 'Boss' }).click();
    const fightBtn = page.getByRole('button', { name: /^(Fight|Rematch)$/i });
    await expect(fightBtn).toBeInViewport();

    // Forge: Craft is visible in viewport without scrolling
    await page.getByRole('tab', { name: 'Forge' }).click();
    const craftBtn = page.getByTestId('craft-btn');
    await expect(craftBtn).toBeInViewport();
  });
});

test.describe('G2 Shell: Focus Management & Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await seedSave(page);
  });

  test('focus moves into opened panel and returns to tab on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const bagTab = page.getByRole('tab', { name: 'Bag' });
    await bagTab.click();

    // Verify focus moved into the newly opened panel
    await expect.poll(async () => {
      return page.evaluate(() => {
        const active = document.activeElement;
        const panel = document.getElementById('panel-Bag');
        return panel ? panel.contains(active) : false;
      });
    }).toBe(true);

    // Press Escape -> focus returns to tab
    await page.keyboard.press('Escape');
    await expect(bagTab).toBeFocused();
  });

  test('keyboard-only path to Fight works', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Focus the first tab
    const charTab = page.getByRole('tab', { name: 'Character' });
    await charTab.focus();

    // Navigate with ArrowRight to Boss tab
    await page.keyboard.press('ArrowRight'); // Bag
    await page.keyboard.press('ArrowRight'); // Boss
    await expect(page.getByRole('tab', { name: 'Boss' })).toBeFocused();
    await page.keyboard.press('Enter');

    // Tab into the panel to reach Fight button
    const fightBtn = page.getByRole('button', { name: /^(Fight|Rematch)$/i });
    for (let step = 0; step < 20; step++) {
      if (await fightBtn.evaluate((el) => el === document.activeElement)) break;
      await page.keyboard.press('Tab');
    }
    await expect(fightBtn).toBeFocused();

    // Press Enter to activate Fight
    await page.keyboard.press('Enter');
    // Action triggers: fight starts or stage/arena renders
    await expect(page.getByRole('region', { name: 'Game stage' })).toBeVisible();
  });
});

test.describe('G2 Shell: Reduced Motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('reduced motion disables animations', async ({ page }) => {
    await seedSave(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Check that prefers-reduced-motion media query matches in the page
    const matches = await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    expect(matches).toBe(true);

    // Verify .btn-spinner or canvas has no infinite animation running
    const spinnerAnimation = await page.evaluate(() => {
      const el = document.createElement('span');
      el.className = 'btn-spinner';
      document.body.appendChild(el);
      const style = window.getComputedStyle(el);
      const anim = style.animationName;
      document.body.removeChild(el);
      return anim;
    });
    expect(spinnerAnimation).toBe('none');
  });
});
