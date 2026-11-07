// REFERENCE: tools/cardrpg-big2/ReviewStudio.tsx; docs/cardrpg3b/build.json.
// Exact-delivery functional evidence; run through with-timing-lock.mjs.
import { chromium } from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const artifact = '/tmp/cardrpg-big2-review-index.html';
const build = JSON.parse(await readFile('/tmp/cardrpg-big2-review-build.json', 'utf8'));
const out = 'reports/cardrpg-big2/review/evidence';
await mkdir(out, { recursive: true });
const rows = [], errors = [], requests = [];
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
 const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
 page.on('pageerror', error => errors.push(String(error)));
 page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
 await page.goto('file://' + artifact);
 await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
 const account = await page.evaluate(() => JSON.stringify(window.__depthReview.state));
 await page.getByRole('button', { name: 'Review studio', exact: true }).click();
 await page.getByRole('navigation', { name: 'Review panels' }).getByRole('button', { name: 'Before / after', exact: true }).click();
 await page.getByRole('heading', { name: 'Look closer', exact: true }).waitFor();
 await page.locator('.b2-studio-body select').waitFor();
 const count = await page.locator('.b2-studio-body select').locator('option').count();
 assert.equal(count, build.evidence.rows);
 for (let index = 0; index < count; index++) {
  await page.locator('.b2-studio-body select').selectOption(String(index));
  await page.waitForFunction(index => {
   const row = window.__b2Evidence[index], images = [...document.querySelectorAll('.b2-comparison img')];
   return images.length === [row.before, row.after].filter(Boolean).length && images.every(image => image.alt.startsWith(row.name + ' '));
  }, index);
  const row = await page.locator('.b2-comparison img').evaluateAll(async (images, index) => {
   await Promise.all(images.map(image => image.decode()));
   const evidence = window.__b2Evidence[index];
   return { index, name: evidence.name, owner: evidence.owner,
    expectedImages: [evidence.before, evidence.after].filter(Boolean).length,
    images: images.map(image => ({ width: image.naturalWidth, height: image.naturalHeight, alt: image.alt, localData: image.src.startsWith('data:image/') })) };
  }, index);
  assert.equal(row.images.length, row.expectedImages);
  assert.ok(row.images.length > 0 && row.images.every(image => image.width > 0 && image.height > 0 && image.localData));
  rows.push(row);
 }
 await page.screenshot({ path: `${out}/last-comparison.png` });
 await page.getByRole('button', { name: 'Return to cafe', exact: true }).click();
 assert.equal(await page.evaluate(() => JSON.stringify(window.__depthReview.state)), account);
 assert.deepEqual(errors, []); assert.deepEqual(requests, []);
 console.log(JSON.stringify({ comparisons: rows.length, images: rows.reduce((sum, row) => sum + row.images.length, 0), errors, requests }));
} finally {
 await browser.close();
 await writeFile(`${out}/checks.json`, JSON.stringify({ artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'), expectedRows: build.evidence.rows, rows, errors, requests }, null, 2));
}
