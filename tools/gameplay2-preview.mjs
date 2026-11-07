import { chromium, pinExistingFonts, root } from './visual-support.mjs';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
const out = resolve(root, 'reports/gameplay2/second-look'); mkdirSync(out, { recursive: true });
const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
try {
  await page.route('**/*', r => ['127.0.0.1', 'localhost'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.abort());
  await pinExistingFonts(page);
  await page.goto('http://127.0.0.1:5391/?demo&coach=off&adventure=1&adventureDebug=1#home');
  await page.getByTestId('class-picker-choose-button').click();
  await page.getByTestId('cafe-adventure').waitFor(); await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(out, 'patrol.png') });
  await page.evaluate(() => { window.__cafeDebug.advance(120); window.__cafeDebug.supplies(); });
  await page.getByRole('button', { name: 'Challenge boss' }).click();
  await page.screenshot({ path: resolve(out, 'boss.png') });
  await page.getByRole('button', { name: 'Dodge 1' }).click();
  await page.waitForTimeout(3500);
  await page.evaluate(() => window.__cafeDebug.advance(90));
  for (const name of ['Wardrobe', 'Workshop', 'Journal', 'Cafe']) {
    await page.getByRole('navigation', { name: 'Adventure pages' }).getByRole('button', { name, exact: true }).click();
    await page.getByRole('region', { name: `${name} page`, exact: true }).waitFor();
    await page.waitForTimeout(250);
    await page.screenshot({ path: resolve(out, name.toLowerCase() + '.png') });
  }
  writeFileSync(resolve(out, 'receipt.json'), JSON.stringify({ errors, text: await page.locator('[data-testid=cafe-adventure]').innerText() }, null, 2));
  console.log(JSON.stringify({ errors }));
} finally { await browser.close(); }
