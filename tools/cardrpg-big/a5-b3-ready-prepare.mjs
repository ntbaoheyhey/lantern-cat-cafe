// REFERENCE: A5 B3. Supplemental ready-state capture; never rerun the timed battle.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = 'reports/cardrpg-big/a5/b3/closure/day7-x1';
const bytes = await readFile(root + '/checks.json'), original = JSON.parse(bytes);
const browser = await chromium.launch({ channel: 'chromium', headless: true, args: ['--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [], remote = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('request', request => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
try {
  await page.goto('file://' + original.artifact);
  await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor({ timeout: 120000 });
  await page.getByRole('navigation', { name: 'Cafe screens' }).getByRole('button', { name: 'Save & settings', exact: true }).click();
  await page.getByLabel('Save code', { exact: true }).fill(await readFile('reports/cardrpg-big/a5/e1/rules/earned-loss.save', 'utf8'));
  await page.getByRole('button', { name: 'Import save code', exact: true }).click();
  await page.getByRole('button', { name: 'Apply and retry route', exact: true }).click();
  await page.getByRole('button', { name: 'Fight', exact: true }).waitFor({ timeout: 30000 });
  const state = await page.evaluate(() => ({ state: window.__depthReview.state, battle: window.__depthReview.battle }));
  assert.deepEqual(state.battle.initial, original.applied.battle.initial);
  assert.deepEqual(state.state.v4.plan, original.applied.state.v4.plan);
  assert.equal(state.battle.choices.length, 0, 'No battle action may run in this capture');
  const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth));
  assert.equal(overflow, 0); assert.deepEqual(errors, []); assert.deepEqual(remote, []);
  const path = root + '/retry-prepare-ready.png';
  await page.screenshot({ path });
  await writeFile(root + '/ready-prepare.json', JSON.stringify({
    method: 'Original retry-prepare.png caught the lazy-loading placeholder. This supplemental UI-only pass waits for Fight. Exact original battle setup and plan; no Fight click, new timing or gameplay sample.',
    sourceReceiptSha256: createHash('sha256').update(bytes).digest('hex'),
    artifactSha256: createHash('sha256').update(await readFile(original.artifact)).digest('hex'),
    path, overflow, errors, remote, battleActions: state.battle.choices.length,
  }, null, 2));
  console.log(JSON.stringify({ path, overflow, battleActions: 0 }));
} finally { await browser.close(); }
