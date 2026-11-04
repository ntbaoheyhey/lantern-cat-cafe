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
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await installT2LoopFixture(page);
      await page.clock.resume();
      // Existing entry hash, stocked test fixture; no live account or new route.
      await page.goto('/#landing');
      await expect(page.getByTestId('landing-hero')).toBeVisible();
      await expect(page.getByTestId('rail')).toHaveCount(0);
      await expect(page.getByTestId('landing-hero')).toContainText('ERC-1155');
      await expect(page.getByTestId('landing-hero')).not.toContainText(/ERC-721|Open source|Server-checked/);
      const backdrop = page.locator('.landing__backdrop');
      const scene = await backdrop.boundingBox();
      expect(scene!.width).toBeGreaterThanOrEqual(viewport.width);
      expect(scene!.height).toBeGreaterThanOrEqual(viewport.height);
      expect(scene!.height % 96).toBe(0);
      expect(await page.locator('body').evaluate(el => getComputedStyle(el).fontSize)).toBe('14px');
      await capture(page, 'landing', viewport.width, viewport.height);
      await page.getByTestId('landing-start').click();
      await expect(page.getByTestId('class-picker')).toBeVisible();
      await expect(page.getByRole('radio')).toHaveCount(3);
      const cardBox = await page.getByRole('radio').first().boundingBox();
      expect(cardBox!.height).toBeGreaterThan(viewport.height * .55);
      const startBox = await page.getByTestId('class-picker-choose-button').boundingBox();
      expect(startBox!.x).toBeGreaterThan(viewport.width / 2);
      expect(startBox!.y).toBeGreaterThan(viewport.height - 100);
      await capture(page, 'class', viewport.width, viewport.height);
      await page.getByTestId('class-picker-choose-button').click();
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
      const stageBox = await page.getByRole('region', { name: 'Game stage' }).boundingBox();
      const heroBox = await page.getByTestId('home-hero-card').boundingBox();
      const goalBox = await page.getByTestId('home-next-goal-card').boundingBox();
      expect(stageBox!.x).toBeGreaterThan(92);
      expect(stageBox!.x + stageBox!.width).toBeLessThan(heroBox!.x);
      expect(Math.abs(heroBox!.x - goalBox!.x)).toBeLessThan(1);
      expect(goalBox!.y).toBeGreaterThan(heroBox!.y + heroBox!.height);
      const raster = await page.locator('.v2-stage-art').first().boundingBox();
      expect(raster!.height % 96).toBe(0);
      expect(raster!.width).toBeLessThanOrEqual(stageBox!.width - 4);
      expect(raster!.height).toBeLessThanOrEqual(stageBox!.height - 4);
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
      const slots = bag.locator('.bag-slot');
      const gridBox = await bag.locator('.bag-grid').boundingBox();
      const eighth = await slots.nth(7).boundingBox();
      expect(Math.abs(gridBox!.x + gridBox!.width - eighth!.x - eighth!.width)).toBeLessThanOrEqual(4);
      const emptyBox = await bag.locator('.bag-slot.empty').first().boundingBox();
      const emptyTileBox = await bag.locator('.bag-tile.empty-tile').first().boundingBox();
      expect(Math.abs(emptyBox!.width - emptyTileBox!.width)).toBeLessThan(1);
      const sortBox = await bag.getByRole('combobox', { name: 'Sort bag' }).boundingBox();
      const bulkBox = await bag.getByRole('button', { name: 'Equip best', exact: true }).boundingBox();
      expect(Math.abs(sortBox!.y - bulkBox!.y)).toBeLessThanOrEqual(6);
      const detail = bag.getByRole('region', { name: 'Item detail' });
      const equipBox = await detail.getByRole('button', { name: 'Equip', exact: true }).boundingBox();
      const compareBox = await detail.locator('.compare').boundingBox();
      expect(equipBox!.y + equipBox!.height).toBeLessThan(compareBox!.y);
      expect(await bag.getByRole('button', { name: 'Equip best', exact: true }).evaluate(el => el.classList.contains('pixel-btn--secondary'))).toBe(true);
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
