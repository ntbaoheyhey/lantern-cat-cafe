import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { requireWeb, web } from '../visual-support.mjs';
const { createServer } = await import(requireWeb.resolve('vite'));
const server = await createServer({ root: web, configFile: resolve(web, 'vite.config.ts'), envDir: false,
  server: { host: '127.0.0.1', port: 0 } });
await server.listen();
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const errors = [], results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 600 } });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(server.resolvedUrls.local[0] + '?demo&squad=1&cardrpg2=1');
  await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
  await page.getByRole('button', { name: 'Skip lesson' }).click();
  await page.getByRole('button', { name: /Tangled Cafe/ }).click();
  await page.locator('.dp-node:enabled').first().click();
  await page.waitForFunction(() => window.__depthScene?.ready);
  await page.getByRole('button', { name: /Door knock/ }).click();
  await page.getByRole('button', { name: 'Play card →' }).click();
  const before = await page.evaluate(() => ({ choices: window.__depthReview.battle.choices, hp: window.__depthReview.battle.actors.map(a => a.hp) }));
  await page.reload();
  await page.waitForFunction(() => window.__depthScene?.ready);
  const after = await page.evaluate(() => ({ choices: window.__depthReview.battle.choices, hp: window.__depthReview.battle.actors.map(a => a.hp) }));
  assert.deepEqual(after, before);
  results.push({ check: 'Active battle localStorage reload', pass: true, savedActions: after.choices.length });
  await page.getByRole('button', { name: 'Leave table' }).focus();
  await page.keyboard.press('Space');
  await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
  results.push({ check: 'Focused battle button activates with Space', pass: true });
  await page.getByRole('button', { name: 'Save & settings', exact: false }).click();
  await page.getByRole('button', { name: 'Export save code' }).click();
  const code = await page.getByLabel('Save code', { exact: true }).inputValue();
  const account = await page.evaluate(() => JSON.stringify(window.__depthReview.state));
  await page.getByLabel('Save code', { exact: true }).fill(code.replace('mochi', 'corrupt'));
  await page.getByRole('button', { name: 'Import save code' }).click();
  assert.equal(await page.evaluate(() => window.__depthReview.error), true);
  assert.equal(await page.evaluate(() => JSON.stringify(window.__depthReview.state)), account);
  results.push({ check: 'Corrupt import preserves account and exposes error', pass: true });
  await page.screenshot({ path: 'reports/cardrpg-depth/browser/app-save.png' });
} finally {
  await browser.close();
  await server.close();
  await mkdir('reports/cardrpg-depth/browser', { recursive: true });
  await writeFile('reports/cardrpg-depth/browser/app-check.json', JSON.stringify({ date: new Date().toISOString(), results, errors }, null, 2));
}
assert.deepEqual(errors, []); console.log(JSON.stringify(results));
