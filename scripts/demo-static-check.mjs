import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium, expect } = createRequire(resolve(root, 'apps/web/package.json'))('@playwright/test');
const out = resolve(root, 'reports/demo/static');
mkdirSync(out, { recursive: true });
const file = pathToFileURL(resolve(root, 'docs/demo/taskbar-hero-demo/index.html')).href;
const report = { at: new Date().toISOString(), file, browserOffline: true, checks: [], errors: [], network: [] };
const browser = await chromium.launch();
async function check(name, action) {
  try { await action(); report.checks.push({ name, status: 'PASS' }); console.log(`PASS ${name}`); }
  catch (error) { report.checks.push({ name, status: 'FAIL', error: error.message }); throw error; }
}
try {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
    const tag = `${viewport.width}x${viewport.height}`;
    const context = await browser.newContext({ viewport, offline: true });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
    page.on('request', request => { if (/^https?:/.test(request.url())) report.network.push(request.url()); });
    await check(`${tag}: file:// opens with networking disabled`, async () => {
      await page.goto(file);
      await expect(page.locator('.candidate')).toContainText('Candidate build 1eefc3e, not live');
      await expect(page.getByText('Guided screenshots · not a playable game', { exact: true })).toBeVisible();
      await expect.poll(() => page.locator('#capture').evaluate(img => img.naturalWidth)).toBe(2880);
    });
    const names = ['Home', 'Bag', 'Forge', 'Boss', 'Market', 'Help', 'Fuji reference'];
    for (const [i, name] of names.entries()) await check(`${tag}: step ${i + 1} ${name}`, async () => {
      const button = page.getByRole('navigation', { name: 'Walkthrough steps' }).getByRole('button').nth(i);
      await button.click();
      await expect(button).toHaveAttribute('aria-current', 'step');
      await expect(page.locator('#capture')).toBeVisible();
      await expect.poll(() => page.locator('#capture').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      const bounds = await page.evaluate(() => ({ body: document.documentElement.scrollWidth, viewport: innerWidth }));
      expect(bounds.body).toBeLessThanOrEqual(bounds.viewport);
    });
    await check(`${tag}: keyboard Home, arrows, End and Previous`, async () => {
      await page.keyboard.press('Home'); await expect(page.locator('#step-count')).toContainText('01 / 07');
      await page.keyboard.press('ArrowRight'); await expect(page.locator('#step-count')).toContainText('02 / 07');
      await page.keyboard.press('ArrowLeft'); await expect(page.locator('#step-count')).toContainText('01 / 07');
      await page.keyboard.press('End'); await expect(page.locator('#step-count')).toContainText('07 / 07');
      await page.getByRole('button', { name: '← Previous', exact: true }).click(); await expect(page.locator('#step-count')).toContainText('06 / 07');
    });
    for (const [name, step] of [['Home', '01'], ['Bag', '02'], ['Forge', '03'], ['Boss', '04'], ['Market', '05'], ['Help', '06']]) await check(`${tag}: ${name} rail hotspot`, async () => {
      await page.getByRole('button', { name: `Go to ${name} screenshot`, exact: true }).click();
      await expect(page.locator('#step-count')).toContainText(`${step} / 07`);
    });
    await check(`${tag}: compact capture and native zoom dialog`, async () => {
      await page.keyboard.press('Home');
      await page.getByRole('button', { name: 'View 1280 × 720 capture', exact: true }).click();
      await expect.poll(() => page.locator('#capture').evaluate(img => img.naturalWidth)).toBe(2560);
      await page.getByRole('button', { name: 'Enlarge capture', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
      await page.getByRole('button', { name: 'View 1440 × 900 capture', exact: true }).click();
      await expect.poll(() => page.locator('#capture').evaluate(img => img.naturalWidth)).toBe(2880);
    });
    await page.screenshot({ path: resolve(out, `static-${tag}.png`) });
    await check(`${tag}: zero console errors and network requests`, async () => {
      expect(report.errors).toEqual([]); expect(report.network).toEqual([]);
    });
    await context.close();
  }
} catch (error) { console.error(error); process.exitCode = 1; }
finally {
  await browser.close(); report.pass = process.exitCode !== 1;
  writeFileSync(resolve(out, 'receipt.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.checks.filter(check => check.status === 'PASS').length}/${report.checks.length} static checks passed.`);
}
