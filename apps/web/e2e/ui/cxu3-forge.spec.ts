import { expect, test, type Page } from '../support/test';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import fs from 'node:fs';
import path from 'node:path';
const storageKey = fs.readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

async function geometry(page: Page) {
  expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight }))).toEqual({ x: false, y: false });
  const clipped = await page.locator('.forge-panel button:visible, .forge-panel input:visible').evaluateAll(elements => elements.filter(element => {
    const rect = element.getBoundingClientRect();
    if (rect.x < 0 || rect.y < 0 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1) return true;
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
      if (/(hidden|clip|auto|scroll)/.test(style.overflowY) && (rect.y < bounds.y - 1 || rect.bottom > bounds.bottom + 1)) return true;
      if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (rect.x < bounds.x - 1 || rect.right > bounds.right + 1)) return true;
    }
    return false;
  }).map(element => element.textContent || element.getAttribute('aria-label')));
  expect(clipped).toEqual([]);
}
async function screenshot(page: Page, name: string) {
  if (!process.env.CXU3_SCREENSHOTS) return;
  await page.locator('.forge-panel').evaluate(root => Promise.all(root.getAnimations({ subtree: true }).filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))));
  const dir = path.resolve(process.env.CXU3_SCREENSHOTS); fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, name + '.png') });
}
for (const size of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`CXU3 Forge costs, confirmation, one-shot reveal and tabs ${size.width} ${reducedMotion}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.setViewportSize(size); await page.emulateMedia({ reducedMotion });
      const save = mockV2Save('forgeRich', { nowMs: Date.now(), classId: 'warrior' });
      await page.addInitScript(({ key, save }) => { localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); }, { key: storageKey, save: JSON.stringify(save) });
      await page.goto('/'); await page.getByRole('tab', { name: 'Forge', exact: true }).click();
      await expect(page.getByTestId('craft-panel')).toBeVisible(); await page.evaluate(() => document.fonts.ready);
      await expect(page.getByTestId('cost-yarn')).toContainText(`${save.state.stacks.yarn} / 10`);
      await expect(page.getByTestId('cost-fluffTuft')).toContainText(`${save.state.stacks.fluffTuft} / 4`);
      await expect(page.getByTestId('cost-fish')).toContainText(`${save.state.stacks.fish} / 50`);
      await expect(page.getByRole('table', { name: 'Crafting chances' })).toContainText('Common gear100'); await geometry(page);
      for (const quality of ['common', 'uncommon', 'rare', 'epic', 'legendary']) {
        const option = page.getByTestId('rarity-' + quality); await option.click();
        const measured = await option.evaluate(button => {
          const text = getComputedStyle(button.querySelector('.forge-option-name')!).color;
          const background = getComputedStyle(button).backgroundColor;
          const luminance = (rgb: string) => rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => value / 255)
            .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
            .reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i]!, 0);
          const a = luminance(text), b = luminance(background);
          return { text, background, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
        });
        expect(measured.ratio, `${quality}: ${JSON.stringify(measured)}`).toBeGreaterThanOrEqual(4.5);
        // Read the original SVG fill as well: improving text must not recolour existing art.
        if (quality === 'rare' || quality === 'epic') {
          const fill = await option.locator('svg[data-frame] path').evaluateAll((paths, rarity) => {
            const colored = paths.find(path => path.getAttribute('style')?.includes(`--rarity-${rarity},`));
            return colored ? getComputedStyle(colored).fill : null;
          }, quality);
          expect(fill).toBe(quality === 'rare' ? 'rgb(74, 168, 255)' : 'rgb(187, 116, 255)');
        }
      }
      await page.getByTestId('rarity-legendary').click(); await expect(page.getByTestId('craft-btn')).toBeDisabled();
      await expect(page.getByRole('table', { name: 'Crafting chances' })).toContainText('Legendary gear100');
      await page.getByTestId('rarity-common').click(); await page.getByTestId('slot-helmet').click();
      const animations = await page.evaluateHandle(() => {
        const count = { starts: 0, ends: 0 };
        document.addEventListener('animationstart', event => { if (event.animationName === 'motion-forge-reveal') count.starts++; });
        document.addEventListener('animationend', event => { if (event.animationName === 'motion-forge-reveal') count.ends++; });
        return count;
      });
      await page.getByTestId('craft-btn').focus(); await page.keyboard.press('Enter');
      await expect(page.getByTestId('craft-confirm-box')).toContainText('Common Helmet'); await geometry(page);
      expect(await page.getByTestId('craft-cancel-btn').evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe(await page.getByTestId('craft-confirm-btn').evaluate(node => getComputedStyle(node).backgroundColor));
      const contrast = await page.getByTestId('craft-cancel-btn').evaluate(node => {
        const style = getComputedStyle(node);
        const luminance = (rgb: string) => rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0);
        const light = luminance(style.color), dark = luminance(style.backgroundColor);
        return (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      await screenshot(page, `craft-confirm-${size.width}-${reducedMotion}`);
      await page.getByTestId('craft-cancel-btn').click(); await expect(page.getByTestId('craft-confirm-box')).toHaveCount(0);
      await page.getByTestId('craft-btn').click(); await page.getByTestId('craft-confirm-btn').click();
      await expect(page.getByTestId('craft-result')).toContainText('Crafted: Common');
      const reveal = await page.getByTestId('forge-in-place-reveal').elementHandle();
      if (reducedMotion === 'reduce') await expect(page.getByTestId('forge-in-place-reveal')).toHaveCSS('animation-name', 'none');
      else await expect.poll(() => animations.evaluate(count => count.ends)).toBe(1);
      await geometry(page); await screenshot(page, `craft-result-${size.width}-${reducedMotion}`);
      await page.evaluate(() => window.__g1Loop.claimNow());
      expect(await reveal!.evaluate(node => node === document.querySelector('[data-testid="forge-in-place-reveal"]'))).toBe(true);
      expect(await animations.evaluate(count => count.starts)).toBe(reducedMotion === 'reduce' ? 0 : 1);
      await page.getByTestId('slot-boots').click(); await page.getByTestId('craft-btn').click(); await page.getByTestId('craft-confirm-btn').click();
      await expect(page.getByTestId('craft-result')).toContainText('Crafted: Common');
      if (reducedMotion === 'no-preference') await expect.poll(() => animations.evaluate(count => count.ends)).toBe(2);
      expect(await reveal!.evaluate(node => node.isConnected)).toBe(false);
      await page.getByTestId('tab-salvage').click(); await expect(page.getByTestId('salvage-panel')).toBeVisible();
      await expect(page.getByTestId('salvage-check-fx:forgeRich:0')).toBeDisabled();
      await expect(page.getByTestId('salvage-check-fx:forgeRich:4')).toBeDisabled();
      await page.getByTestId('salvage-check-fx:forgeRich:1').check();
      await expect(page.getByTestId('salvage-btn')).toBeEnabled(); await screenshot(page, `salvage-${size.width}-${reducedMotion}`);
      await page.getByTestId('tab-relic').click(); await expect(page.getByTestId('relic-panel')).toBeVisible();
      await expect(page.getByTestId('relic-forge-btn')).toBeDisabled(); await geometry(page);
      await screenshot(page, `relic-${size.width}-${reducedMotion}`);
      expect(errors).toEqual([]); await animations.dispose(); await reveal!.dispose();
    });
  }
}


test('CXU3 preserves the compact Forge action without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const save = mockV2Save('forgeRich', { nowMs: Date.now() });
  await page.addInitScript(({ key, save }) => { localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); }, { key: storageKey, save: JSON.stringify(save) });
  await page.goto('/'); await page.getByRole('tab', { name: 'Forge', exact: true }).click();
  await expect(page.getByTestId('craft-btn')).toBeInViewport({ ratio: 1 });
  await page.getByTestId('craft-btn').click();
  await expect(page.getByTestId('craft-confirm-btn')).toBeInViewport({ ratio: 1 });
  await expect(page.getByTestId('craft-cancel-btn')).toBeInViewport({ ratio: 1 });
});
