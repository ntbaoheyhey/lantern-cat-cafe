import { expect, test, type Locator, type Page } from './support/test';

const TAB_NAMES = ['Hero', 'Inventory', 'Boss', 'Forge', 'Market'];

async function tabTo(page: Page, target: Locator): Promise<void> {
  // Use real keyboard navigation so a removed tab stop cannot pass via focus().
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

async function openPanel(page: Page): Promise<void> {
  await page.goto('/?demo');
  await page.getByRole('button', { name: 'Start playing' }).click();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
}

for (const width of [390, 1280]) {
  test.describe(`Accessibility at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test('How to play traps Tab in both directions and Escape returns focus to Menu', async ({ page }) => {
      await page.goto('/?demo');
      const dialog = page.getByRole('dialog', { name: 'How to play' });
      const first = dialog.getByRole('button', { name: 'Close help' });
      const last = dialog.getByRole('button', { name: 'Start playing' });
      await expect(dialog).toBeVisible();
      await expect(last).toBeFocused();

      // Cross both boundaries twice to catch traps that only work once.
      for (let cycle = 0; cycle < 2; cycle++) {
        await page.keyboard.press('Tab');
        await expect(first).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(last).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(first).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(last).toBeFocused();
      }

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeFocused();
    });

    test('every tab is reachable with Tab and activates with Enter and Space', async ({ page }) => {
      await page.goto('/?demo');
      await expect(page.getByRole('button', { name: 'Start playing' })).toBeFocused();
      await page.keyboard.press('Escape');
      const menu = page.getByRole('button', { name: 'Menu', exact: true });
      await expect(menu).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('tab')).toHaveCount(TAB_NAMES.length);

      for (const key of ['Enter', 'Space']) {
        // Start on a different tab so activating Hero also proves a change.
        for (const name of ['Market', ...TAB_NAMES]) {
          const tab = page.getByRole('tab', { name, exact: true });
          await tabTo(page, tab);
          await expect(tab).toBeFocused();
          await page.keyboard.press(key);
          await expect(tab).toHaveAttribute('aria-selected', 'true');
          await expect(page.getByRole('tab', { selected: true })).toHaveCount(1);
          await expect(page.getByRole('tabpanel', { name, exact: true })).toBeVisible();
        }
      }
    });

    test('buttons and links have accessible names on onboarding and every tab', async ({ page }) => {
      await page.goto('/?demo');
      await expect(page.getByRole('dialog', { name: 'How to play' })).toBeVisible();
      await expectNamedControls(page);
      await page.keyboard.press('Escape');
      await expectNamedControls(page);
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
      for (const name of TAB_NAMES) {
        await page.getByRole('tab', { name, exact: true }).click();
        await expect(page.getByRole('tabpanel', { name, exact: true })).toBeVisible();
        await expectNamedControls(page);
      }
    });

    test('primary Forge text and background have at least 4.5:1 contrast', async ({ page }) => {
      await openPanel(page);
      await page.getByRole('tab', { name: 'Forge', exact: true }).click();
      const forge = page.getByRole('button', { name: 'Forge', exact: true });
      await expect(forge).toBeVisible();
      const colors = await forge.evaluate((element) => {
        const style = getComputedStyle(element);
        return { text: style.color, background: style.backgroundColor };
      });
      const luminance = (color: string) => {
        // Computed sRGB values, not theme literals: changes to CSS are tested.
        const channels = color.match(/[\d.]+/g)?.map(Number);
        expect(channels, `Expected an opaque computed RGB color: ${color}`).toBeDefined();
        expect(channels!.length).toBeGreaterThanOrEqual(3);
        if (channels!.length === 4) expect(channels![3]).toBe(1);
        const linear = channels!.slice(0, 3).map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
      };
      const text = luminance(colors.text);
      const background = luminance(colors.background);
      const ratio = (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
      expect(ratio, JSON.stringify(colors)).toBeGreaterThanOrEqual(4.5);
    });

    test('reduced motion leaves no running CSS animations on the Forge tab', async ({ page }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openPanel(page);
      await page.getByRole('tab', { name: 'Forge', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Forge', exact: true })).toBeVisible();
      // Reduced motion permits a brief entrance fade. Check the settled tab,
      // including pseudo-elements, while rejecting persistent CSS animations.
      const runningAnimations = () => page.evaluate(() => document.getAnimations()
        .filter((animation) => animation instanceof CSSAnimation && animation.playState === 'running')
        .map((animation) => ({
          name: (animation as CSSAnimation).animationName,
          target: (animation.effect as KeyframeEffect | null)?.target?.nodeName,
        })));
      await expect.poll(runningAnimations).toEqual([]);
      const path = testInfo.outputPath(`a11y-forge-${width}.png`);
      if (process.env.SCREENSHOTS === '1') {
        await page.screenshot({ path, fullPage: true });
        await testInfo.attach(`Forge at ${width}px with reduced motion`, { path, contentType: 'image/png' });
      }
    });
  });
}
