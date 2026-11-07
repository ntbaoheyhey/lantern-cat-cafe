import { expect, test, type Locator, type Page } from '../support/test';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { installT2LoopFixture } from '../support/t2-loop-fixture';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';
import { layoutFindings } from '../../tools/layout-findings.mjs';

const key = readFileSync(resolve('src/api/MockGameApiV2.ts'), 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
async function tabTo(page: Page, target: Locator) {
  for (let step = 0; step < 60; step++) {
    if (await target.evaluate(el => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Keyboard could not reach the target within one bounded tab walk');
}
async function capture(page: Page, id: string, width: number, height: number) {
  await page.evaluate(() => document.fonts.ready);
  const findings = await page.evaluate(layoutFindings);
  expect(findings.documentScroll, id).toBe(false);
  expect(findings.horizontalOverflow, id).toEqual([]);
  expect(findings.elementOverlap, id).toEqual([]);
  if (process.env.SCREENSHOTS === '1') await page.screenshot({ path: resolve(process.env.SCREENSHOT_DIR ?? '../../reports/redesign/CXR2/screens', `${id}-${width}x${height}.png`) });
}

for (const viewport of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  test.describe(`redesign polish ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('entry, dashboard and Bag keep the approved desktop geometry and truthful copy', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await installT2LoopFixture(page);
      await page.clock.resume();
      await page.goto('/#landing');
      const landing = page.getByTestId('landing-hero');
      await expect(landing).toBeVisible();
      await expect(landing).toContainText('ERC-1155');
      await expect(landing).not.toContainText('ERC-721');
      await expect(landing.getByRole('link', { name: /Repository/ })).toHaveAttribute('href', 'https://github.com/ntbaoheyhey/taskbar-hero');
      const backdrop = await landing.locator('.landing__backdrop').boundingBox();
      expect(backdrop!.height).toBeGreaterThanOrEqual(viewport.height - 1);
      expect(backdrop!.width).toBeGreaterThanOrEqual(viewport.width - 1);
      const cat = await landing.locator('.landing__cat-item').boundingBox();
      expect(cat!.y + cat!.height / 2).toBeLessThan(viewport.height * .65);
      await capture(page, 'landing', viewport.width, viewport.height);

      await tabTo(page, page.getByTestId('landing-start'));
      await page.keyboard.press('Enter');
      const cards = page.getByRole('radio');
      await expect(cards).toHaveCount(3);
      await page.evaluate(() => document.fonts.ready);
      const first = await cards.first().boundingBox();
      expect(first!.x).toBeCloseTo(40, 0);
      expect(first!.height).toBeGreaterThan(viewport.height * .45);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const beforeHover = await cards.first().boundingBox();
      await cards.first().hover();
      expect(await cards.first().boundingBox()).toEqual(beforeHover);
      await page.mouse.move(0, 0);
      await capture(page, 'class', viewport.width, viewport.height);
      await tabTo(page, page.getByTestId('class-picker-choose-button'));
      await page.keyboard.press('Enter');
      await tabTo(page, page.getByTestId('class-picker-confirm-button'));
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('home-dashboard')).toBeVisible();
      const level = await page.getByTestId('hud-level').textContent();
      await page.clock.fastForward(10 * 60_000);
      await expect(page.getByTestId('hud-level')).not.toHaveText(level!);
      await expect(page.getByRole('region', { name: 'Game stage' }).locator('canvas')).toBeVisible();
      await expect.poll(() => page.getByRole('region', { name: 'Game stage' }).locator('canvas').evaluateAll(nodes => {
        if (nodes.length !== 1) return false;
        const c = nodes[0] as HTMLCanvasElement;
        return !!c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data.some((value, index) => index % 4 === 3 && value > 0);
      })).toBe(true);
      const geometry = await page.evaluate(() => {
        const stage = document.querySelector('[aria-label="Game stage"]')!.getBoundingClientRect();
        const hero = document.querySelector('[data-testid="hero-card"]')?.getBoundingClientRect()
          ?? document.querySelector('.home-col--left .home-card')!.getBoundingClientRect();
        const art = document.querySelector('.v2-stage-art')!.getBoundingClientRect();
        const hint = document.querySelector('.v2-hint-btn') as HTMLElement;
        return { stage: { x: stage.x, right: stage.right, width: stage.width, height: stage.height }, hero: { x: hero.x, width: hero.width }, art: { width: art.width, height: art.height }, clippedHint: hint.scrollWidth > hint.clientWidth || hint.scrollHeight > hint.clientHeight };
      });
      expect(geometry.hero.x).toBeGreaterThan(geometry.stage.right);
      expect(geometry.hero.width).toBeCloseTo(330, 0);
      expect(geometry.stage.x).toBeCloseTo(108, 0);
      expect(geometry.art.width).toBeLessThanOrEqual(geometry.stage.width - 4);
      expect(geometry.art.height).toBeLessThanOrEqual(geometry.stage.height - 4);
      expect(geometry.clippedHint).toBe(false);
      const primaryActions = await page.getByRole('tabpanel', { name: 'Home', exact: true }).getByRole('button').evaluateAll(buttons => buttons.filter(button => getComputedStyle(button).backgroundColor === 'rgb(255, 184, 107)').length);
      expect(primaryActions).toBe(1);
      await capture(page, 'home', viewport.width, viewport.height);

      await page.getByTestId('nav-bag').click();
      const bag = page.getByTestId('bag-screen');
      await bag.getByRole('list', { name: 'Bag items' }).getByRole('button').first().click();
      const grid = await bag.locator('.bag-grid').evaluate(el => {
        const style = getComputedStyle(el);
        const widths = style.gridTemplateColumns.split(' ').map(Number.parseFloat);
        return { widths, available: el.clientWidth, gap: parseFloat(style.columnGap) };
      });
      expect(grid.widths).toHaveLength(8);
      expect(grid.widths[0]).toBeGreaterThan(56);
      expect(Math.abs(grid.widths.reduce((sum, width) => sum + width, 0) + grid.gap * 7 - grid.available)).toBeLessThan(2);
      const detail = bag.getByRole('region', { name: 'Item detail' });
      const actions = await detail.locator('.detail-actions').boundingBox();
      const compare = await detail.locator('.compare').boundingBox();
      expect(actions!.y + actions!.height).toBeLessThan(compare!.y);
      const actionRows = await detail.locator('.detail-actions > button').evaluateAll(buttons => new Set(buttons.map(button => Math.round(button.getBoundingClientRect().top))).size);
      expect(actionRows).toBe(1);
      expect(compare!.y + compare!.height).toBeLessThanOrEqual(viewport.height - 8);
      const bagPrimaries = await bag.getByRole('button').evaluateAll(buttons => buttons.filter(button => getComputedStyle(button).backgroundColor === 'rgb(255, 184, 107)').map(button => button.textContent?.trim()));
      expect(bagPrimaries).toEqual(['Equip']);
      await capture(page, 'bag', viewport.width, viewport.height);
      expect(errors).toEqual([]);
    });

    test('keyboard traverses all seven rail screens and the three Forge states', async ({ page }) => {
      await page.addInitScript(({ key, save }) => {
        localStorage.setItem(key, save);
        localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
      }, { key, save: mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'warrior' }) });
      await page.goto('/');
      await tabTo(page, page.getByTestId('nav-home'));
      const destinations = [['home', 'Home'], ['bag', 'Bag'], ['map', 'Map'], ['forge', 'Forge'], ['market', 'Market'], ['hero', 'Hero'], ['help', 'Help']];
      for (let index = 0; index < destinations.length; index++) {
        const [id, label] = destinations[index]!;
        if (index > 0) await page.keyboard.press('ArrowDown');
        const nav = page.getByTestId(`nav-${id}`);
        await expect(nav).toBeFocused();
        await expect(nav).toHaveAttribute('aria-current', 'page');
        await expect(page.getByRole('tabpanel', { name: label!, exact: true })).toBeVisible();
        expect(await nav.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
        if (id === 'forge') {
          for (const mode of ['craft', 'salvage', 'relic']) {
            const tab = page.getByTestId(`tab-${mode}`);
            await tabTo(page, tab);
            await page.keyboard.press('Enter');
            await expect(page.getByTestId(`${mode}-panel`)).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(nav).toBeFocused();
          }
        }
      }
    });
  });
}
