import { expect, test, type Page } from '../support/test';
import { resolve } from 'node:path';
import { installT2LoopFixture } from '../support/t2-loop-fixture';
import { layoutFindings } from '../../tools/layout-findings.mjs';

async function capture(page: Page, screen: string, width: number, height: number) {
  await page.evaluate(() => document.fonts.ready);
  const findings = await page.evaluate(layoutFindings);
  expect(findings.documentScroll, `${screen}: document scroll`).toBe(false);
  expect(findings.horizontalOverflow, `${screen}: overflow`).toEqual([]);
  expect(findings.elementOverlap, `${screen}: overlap`).toEqual([]);
  if (process.env.SCREENSHOTS === '1') {
    await page.screenshot({ path: resolve(process.env.SCREENSHOT_DIR ?? '../../reports/redesign/CXR1/screens', `${screen}-${width}x${height}.png`) });
  }
}

for (const viewport of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  test.describe(`merged redesign journey ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });
    test('guest landing to class, Home, populated Bag and equip', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await installT2LoopFixture(page);
      await page.clock.resume();
      // Existing entry hash, stocked test fixture; no live account or new route.
      await page.goto('/#landing');
      await expect(page.getByTestId('landing-hero')).toBeVisible();
      await expect(page.getByTestId('rail')).toHaveCount(0);
      await capture(page, 'landing', viewport.width, viewport.height);
      await page.getByTestId('landing-start').click();
      await expect(page.getByTestId('class-picker')).toBeVisible();
      await expect(page.getByRole('radio')).toHaveCount(3);
      await capture(page, 'class', viewport.width, viewport.height);
      await page.getByTestId('class-picker-choose-button').click();
      await page.getByTestId('class-picker-confirm-button').click();
      await expect(page.getByRole('tabpanel', { name: 'Home', exact: true })).toBeVisible();
      const before = await page.getByTestId('hud-level').textContent();
      await page.clock.fastForward(10 * 60_000);
      await expect(page.getByTestId('hud-level')).not.toHaveText(before!);
      const canvas = page.getByRole('region', { name: 'Game stage' }).locator('canvas');
      await expect.poll(() => canvas.evaluateAll(nodes => nodes.length === 1 && (() => {
        const c = nodes[0] as HTMLCanvasElement;
        const pixels = c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data;
        return !!pixels?.some((value, index) => index % 4 === 3 && value > 0);
      })())).toBe(true);
      await capture(page, 'home', viewport.width, viewport.height);

      await page.getByTestId('nav-bag').click();
      const bag = page.getByTestId('bag-screen');
      await expect(bag).toBeVisible();
      const count = await page.getByTestId('bag-count').textContent();
      const weapons = bag.getByRole('button', { name: 'Weapons', exact: true });
      await weapons.click();
      await expect(weapons).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('bag-count')).toHaveText(count!);
      await bag.getByRole('button', { name: 'All', exact: true }).click();
      const cards = bag.getByRole('list', { name: 'Bag items' }).getByRole('button');
      expect(await cards.count()).toBeGreaterThan(0);
      await cards.first().click();
      await expect(bag.getByRole('region', { name: 'Item detail' }).getByRole('heading', { level: 3 }).first()).toBeVisible();
      const columns = await bag.locator('.bag-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      expect(columns).toBe(8);
      await capture(page, 'bag', viewport.width, viewport.height);
      await expect(bag.getByRole('button', { name: 'Equip best', exact: true })).toBeEnabled();
      await bag.getByRole('button', { name: 'Equip best', exact: true }).click();
      await expect(bag.getByTestId('block-reason-equip-best')).toHaveText('Best gear already equipped');
      await page.reload();
      await expect(page.getByRole('tabpanel', { name: 'Home', exact: true })).toBeVisible();
      await page.getByTestId('nav-bag').click();
      await expect(bag.getByTestId('block-reason-equip-best')).toHaveText('Best gear already equipped');
      expect(errors).toEqual([]);
    });
  });
}
