// REFERENCE: tools/cardrpg-big/offline.tsx; reports/cardrpg-big/memory/PROMPT.md F7
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const output = process.env.BIG_WRAPPER_OUT || 'reports/cardrpg-big/integration/delivery/wrapper';
const sha256 = createHash('sha256').update(await readFile(artifact)).digest('hex');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const rows = [];
try {
  for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [], requests = [], captures = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
    await page.goto('file://' + artifact);
    await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor({ timeout: 120000 });
    const account = await page.evaluate(() => JSON.stringify(window.__depthReview.state));
    const shot = async name => {
      await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      await page.screenshot({ path: `${output}/${width}-${name}.png` });
      captures.push(name);
    };
    const header = await page.locator('.cr-topbar').evaluate(element => {
      const box = e => e.getBoundingClientRect().toJSON();
      return { bounds: box(element), content: box(document.querySelector('.cr-content')),
        items: [...element.children].filter(e => e.getClientRects().length).map(e => ({
          label: e.textContent, bounds: box(e),
        })), overflow: document.documentElement.scrollWidth - innerWidth };
    });
    assert.equal(header.overflow, 0);
    for (const { bounds } of header.items) {
      assert(bounds.left >= header.bounds.left && bounds.right <= header.bounds.right, 'Header item escapes horizontally');
      assert(bounds.top >= header.bounds.top && bounds.bottom <= header.bounds.bottom, 'Header item escapes vertically');
      assert(bounds.bottom <= header.content.top, 'Header item covers game content');
    }
    for (let i = 0; i < header.items.length; i++) for (let j = i + 1; j < header.items.length; j++) {
      const a = header.items[i].bounds, b = header.items[j].bounds;
      assert(Math.min(a.right, b.right) <= Math.max(a.left, b.left)
        || Math.min(a.bottom, b.bottom) <= Math.max(a.top, b.top), 'Header controls overlap');
    }
    await page.waitForFunction(() => window.__depthPreviewScene?.ready);
    await shot('home');
    await page.getByRole('button', { name: 'Review studio', exact: true }).click();
    await page.waitForFunction(() => window.__depthScene?.ready && window.__depthScene.renderer.info.render.calls > 0,
      null, { timeout: 120000 });
    assert.equal(await page.getByLabel('Gallery unit', { exact: true }).locator('option').count(), 25);
    assert.equal(await page.evaluate(() => !!window.__depthPreviewScene), false, 'Home scene must unmount before gallery');
    assert.equal(await page.evaluate(() => document.querySelector('.cr-sidebar').inert), true);
    await shot('studio');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Review studio', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => JSON.stringify(window.__depthReview.state)), account);
    assert.equal(await page.evaluate(() => window.__depthReview.screen), 'hub');
    assert.equal(await page.evaluate(() => !!window.__b2Gallery), false);
    assert.equal(await page.evaluate(() => document.querySelector('.cr-sidebar').inert), false);
    await page.getByRole('button', { name: 'Mechanics lab', exact: true }).click();
    const toggles = page.locator('.b2-lab input[type=checkbox]');
    assert.equal(await toggles.count(), 4);
    for (const toggle of await toggles.all()) assert.equal(await toggle.isChecked(), false);
    await shot('mechanics-defaults');
    await toggles.first().check();
    await toggles.nth(1).check();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Mechanics lab', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => JSON.stringify(window.__depthReview.state)), account);
    await page.getByRole('button', { name: 'Mechanics lab', exact: true }).click();
    for (const toggle of await toggles.all()) assert.equal(await toggle.isChecked(), false, 'Each isolated lab starts off');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Feel lab', exact: true }).click();
    await page.getByRole('button', { name: 'Brief checklist', exact: true }).click();
    assert.equal(await page.locator('.dp-brief-list > li').count(), 12);
    await shot('brief');
    await page.getByRole('button', { name: 'Return to cafe', exact: true }).click();
    assert.equal(await page.evaluate(() => JSON.stringify(window.__depthReview.state)), account);
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, []);
    rows.push({ width, height, header, captures, errors, requests, accountRestored: true,
      isolatedDefaultsRestored: true, homeSceneUnmounted: true });
    await writeFile(`${output}/checks.json`, JSON.stringify({ artifact, sha256, rows }, null, 2));
    console.log(JSON.stringify({ width, captures: captures.length, errors, requests }));
    await page.close();
  }
} finally { await browser.close(); }
