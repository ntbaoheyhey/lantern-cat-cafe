import { expect, test } from '../support/test';
import { expectArtPaint } from '../support/art-ready';
import fs from 'node:fs';
import path from 'node:path';

for (const width of [1280, 1600]) for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`Conditional samples stay labelled, read-only and bounded ${width} ${reducedMotion}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1280 ? 720 : 900 });
    await page.emulateMedia({ reducedMotion });
    const errors: string[] = [], writes: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.method()); });
    await page.addInitScript(() => {
      const storageWrites: string[] = [];
      Object.assign(window, { __sampleWrites: storageWrites });
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) { storageWrites.push(key); set.call(this, key, value); };
    });
    await page.goto('/feature-fixture/e2e/fixtures/feature-samples.html');
    await expect(page.getByRole('region', { name: 'Future feature samples' })).toBeVisible();
    const tabs = page.getByRole('tablist', { name: 'Sample categories' });
    await tabs.getByRole('tab', { name: 'Runes' }).focus();
    for (const [index, category] of ['Runes', 'Companions', 'Skills'].entries()) {
      if (index) await page.keyboard.press('ArrowRight');
      await expect(tabs.getByRole('tab', { name: category })).toBeFocused();
      await expect(tabs.getByRole('tab', { name: category })).toHaveAttribute('aria-selected', 'true');
      const panel = page.getByRole('tabpanel');
      const list = panel.getByRole('list');
      await expect(list.getByRole('button')).toHaveCount([5, 12, 7][index]!);
      for (const entry of await list.getByRole('button').all()) await expect(entry).toContainText('Sample');
      await list.getByRole('button').last().click();
      await expect(panel.getByText('Unavailable in this run')).toBeVisible();
      if (category === 'Skills') {
        await page.getByLabel('Sample rank').selectOption('3');
        await expect(panel).toContainText('11% of maximum HP');
      }
      await expectArtPaint(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight)).toBe(false);
      const clipped = await page.locator('.feature-sample-detail :is(button, select, dd):visible').evaluateAll(nodes => nodes.filter(node => {
        const rect = node.getBoundingClientRect();
        return node.scrollWidth > node.clientWidth + 1 || rect.right > innerWidth || rect.bottom > innerHeight || rect.x < 0;
      }).map(node => node.textContent));
      expect(clipped).toEqual([]);
      for (const control of await panel.locator('button:visible, select:visible').all()) await expect(control).toHaveAccessibleName(/\S/);
      if (process.env.PREVIEWS_SCREENSHOTS) {
        fs.mkdirSync(process.env.PREVIEWS_SCREENSHOTS, { recursive: true });
        await page.screenshot({ path: path.join(process.env.PREVIEWS_SCREENSHOTS, `${category.toLowerCase()}-${width}-${reducedMotion}.png`) });
      }
      await tabs.getByRole('tab', { name: category }).focus();
    }
    await page.keyboard.press('Home');
    await expect(tabs.getByRole('tab', { name: 'Runes' })).toBeFocused();
    expect(await page.evaluate(() => (window as Window & { __sampleWrites?: string[] }).__sampleWrites)).toEqual([]);
    expect(writes).toEqual([]); expect(errors).toEqual([]);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Common rune socket Sample', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });
}

test('Conditional samples have no nodes or image requests when the shared flag is off', async ({ page }) => {
  const art: string[] = [];
  page.on('request', request => { if (request.url().includes('/ui-art2/')) art.push(request.url()); });
  await page.goto('/feature-fixture/e2e/fixtures/feature-samples.html?off');
  await expect(page.getByRole('heading', { name: 'Taskbar Hero', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Future feature samples' })).toHaveCount(0);
  await expect(page.locator('[data-art2]')).toHaveCount(0);
  expect(art).toEqual([]);
});
