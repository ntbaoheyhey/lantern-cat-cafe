// Double-clickable file smoke: public UI, real compiled core, no server or persistence.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, chromium } from './squad-support.mjs';
const browser = await chromium.launch(), rows = [];
const file = pathToFileURL(resolve(root, 'docs/squad/index.html')).href;
try {
  for (const [width, height] of [[1280,720], [1440,900], [1920,1080]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [], external = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (!/^(file:|data:|blob:)/.test(r.url())) external.push(r.url()); });
    await page.addInitScript(() => {
      window.__storageCalls = [];
      for (const method of ['setItem', 'removeItem', 'clear']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (...args) {
          window.__storageCalls.push({ method, key: args[0] });
          return original.apply(this, args);
        };
      }
    });
    await page.goto(file + '#play');
    await page.locator('canvas').waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.contract').count(), 21);
    assert.equal(await page.locator('#local').count(), 1);
    assert(await page.getByText('Self-review: 7.9/10 overall', { exact: false }).count() === 1);
    assert.equal(await page.locator('.sq-debug').count(), 0);
    assert.equal(await page.evaluate(() => '__squadReview' in window), false);
    await page.locator('#play').evaluate(e => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
    const geometry = await page.evaluate(() => ({
      arena: document.querySelector('canvas').getBoundingClientRect().toJSON(),
      ultimates: [...document.querySelectorAll('.sq-ultimate')].map(e => e.getBoundingClientRect().toJSON()),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    assert.equal(geometry.overflow, false);
    assert(geometry.arena.top >= 0 && geometry.arena.bottom <= height, JSON.stringify(geometry));
    assert(geometry.ultimates.every(r => r.top >= 0 && r.bottom <= height), JSON.stringify(geometry));
    const decodedImages = await page.evaluate(async () => {
      const images = [...document.images];
      for (const i of images) i.loading = 'eager';
      await Promise.all(images.map(i => i.decode()));
      return images.length;
    });
    const outcomes = [];
    if (width === 1280) {
      // Clock acceleration is disclosed; separate fresh-eyes runs use normal wall time.
      await page.clock.install();
      for (const encounter of ['patrol', 'boss']) {
        if (encounter === 'boss') await page.getByRole('button', { name: 'Yarn Giant', exact: true }).click();
        await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
        await page.clock.runFor(1000);
        await page.clock.fastForward(180000);
        await page.clock.runFor(100);
        const result = page.getByRole('region', { name: 'Encounter result', exact: true });
        await result.waitFor();
        const text = await result.innerText();
        assert(text.includes('The cafe is safe for tonight.'));
        outcomes.push({ encounter, text });
      }
    }
    const writes = await page.evaluate(() => window.__storageCalls);
    assert.deepEqual(errors, []); assert.deepEqual(external, []); assert.deepEqual(writes, []);
    rows.push({ width, height, geometry, decodedImages, outcomes, errors, external, writes });
    await page.close();
  }
} finally { await browser.close(); }
const build = JSON.parse(readFileSync(resolve(root, 'reports/squad/demo-build.json'), 'utf8'));
writeFileSync(resolve(root, 'reports/squad/demo-check.json'), JSON.stringify({
  runtimeSha: build.sha, htmlSha256: build.sha256,
  method: 'file://, default-off debug, public UI; patrol/boss completion uses Playwright foreground clock acceleration. No network or persistence.', rows,
}, null, 2) + '\n');
console.log(JSON.stringify({ views: rows.length, completed: rows.flatMap(r => r.outcomes).length, externalRequests: 0, storageWrites: 0 }));
