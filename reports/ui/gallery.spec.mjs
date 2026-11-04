import { createRequire } from 'node:module';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const { test, expect } = createRequire(resolve(root, 'apps/web/package.json'))('@playwright/test');
const manifest = JSON.parse(readFileSync(resolve(root, 'reports/ui/gallery-manifest.json'), 'utf8'));
// The gate supplies the existing verified audit tool; no app dependency is added.
const axeSource = readFileSync(process.env.UI_AXE_SOURCE, 'utf8');
if (createHash('sha256').update(axeSource).digest('hex') !== '880970c081707360e64f34cea25ff91892f5bc95675b0776925b9709dd8a68bb') throw new Error('Unexpected axe-core audit source');

for (const relative of ['reports/ui/gallery.html', 'docs/ui/demo/index.html', 'docs/ui/gallery/index.html']) {
  test(`${relative} is a standalone, complete and usable review`, async ({ page }, info) => {
    const errors = [], network = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
    const url = pathToFileURL(resolve(root, relative)).href;
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Taskbar Hero · Integrated candidate review');
    await expect(page.getByRole('table', { name: 'Card release index' }).locator('tbody tr')).toHaveCount(manifest.cards.length);
    await expect(page.locator('.capture')).toHaveCount(manifest.captures.length);
    await expect(page.getByLabel('Card', { exact: true })).toHaveValue('STACK');
    await expect(page.locator('.notice')).toContainText('NOT DEPLOYED');
    const journey = page.locator('section', { has: page.getByRole('heading', { name: 'Guest journey', exact: true }) });
    await expect(journey).toContainText(manifest.measurements.homeSeconds + ' seconds');
    await expect(journey).toContainText(manifest.measurements.earnSeconds + ' seconds');
    expect(manifest.measurements.timingRuns).toBeGreaterThanOrEqual(12);
    for (const video of await page.locator('video').all()) {
      await video.evaluate(async node => {
        node.load();
        if (node.readyState < 1) await new Promise((ok, fail) => {
          node.addEventListener('loadedmetadata', ok, { once: true });
          node.addEventListener('error', () => fail(new Error('Local recording failed to load')), { once: true });
        });
      });
      expect(await video.evaluate(node => node.duration)).toBeGreaterThan(0);
      await video.evaluate(node => node.play());
      await expect.poll(() => video.evaluate(node => node.currentTime)).toBeGreaterThan(0);
      await video.evaluate(node => node.pause());
    }
    for (const row of manifest.captures) {
      const file = resolve(root, row.path); expect(existsSync(file)).toBe(true);
      expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(row.sha256);
    }
    const localLinks = await page.locator('[href], img[src], source[src]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href') ?? node.getAttribute('src')).filter(Boolean));
    for (const link of localLinks) if (!/^(https?:|#)/.test(link)) expect(existsSync(fileURLToPath(new URL(link, url))), link).toBe(true);
    for (const card of ['STACK', 'CXR2', 'ART2', 'MOTION', 'PREVIEWS', 'FIRSTPLAY']) {
      await page.getByLabel('Card', { exact: true }).selectOption(card);
      for (const width of ['1280', '1600']) {
        await page.getByLabel('Viewport', { exact: true }).selectOption(width);
        const visible = page.locator('.capture:visible');
        expect(await visible.count()).toBeGreaterThan(0);
        expect(await visible.evaluateAll((nodes, { card, width }) => nodes.every(node => node.dataset.card === card && node.dataset.width === width), { card, width })).toBe(true);
        await visible.first().scrollIntoViewIfNeeded();
        await visible.first().locator('img').evaluate(image => image.decode());
        expect(await visible.first().locator('img').evaluate(image => image.naturalWidth)).toBe(Number(width));
      }
    }
    await page.getByRole('button', { name: 'Show all' }).click();
    await page.getByLabel('Find a screen or state').fill('not-a-real-screen');
    await expect(page.locator('.capture:visible')).toHaveCount(0);
    await page.getByRole('button', { name: 'Show all' }).click();
    await page.evaluate(() => scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    for (const control of await page.locator('button, input, select, video').all()) await expect(control).toHaveAccessibleName(/\S/);
    await page.addScriptTag({ content: axeSource });
    const accessibility = await page.evaluate(() => window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    }));
    await info.attach('standalone-wcag-aa', { body: JSON.stringify(accessibility, null, 2), contentType: 'application/json' });
    expect(accessibility.violations).toEqual([]);
    if (process.env.GALLERY_SCREENSHOTS) {
      mkdirSync(process.env.GALLERY_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: resolve(process.env.GALLERY_SCREENSHOTS, `${relative.replaceAll('/', '-')}-${page.viewportSize().width}-${info.repeatEachIndex}.png`) });
    }
    expect(errors).toEqual([]); expect(network).toEqual([]);
  });
}

test('the one-page card index links every report offline', async ({ page }) => {
  const errors = [], network = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  const url = pathToFileURL(resolve(root, 'reports/ui/cards/index.html')).href;
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('UI card index');
  await expect(page.locator('ol > li > a')).toHaveCount(manifest.cards.length);
  for (const href of await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))) {
    expect(existsSync(fileURLToPath(new URL(href, url))), href).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.addScriptTag({ content: axeSource });
  const accessibility = await page.evaluate(() => window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  }));
  expect(accessibility.violations).toEqual([]);
  expect(errors).toEqual([]); expect(network).toEqual([]);
});
