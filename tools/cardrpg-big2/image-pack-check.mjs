// REFERENCE: build.mjs; pack-images.py. Run under the shared browser lock.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '../..');
const receipt = JSON.parse(await readFile(process.env.BIG_PACK_RECEIPT || 'docs/cardrpg3b/build.json', 'utf8'));
const output = process.env.BIG_PACK_OUT || 'reports/cardrpg-big2/review/lossless-pack';
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const rows = [], errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(String(error)));
  for (const item of receipt.imagePacking.filter(row => row.selected)) {
    const original = 'data:image/png;base64,' + (await readFile(resolve(root, item.key))).toString('base64');
    const packed = 'data:image/webp;base64,' + (await readFile(item.packed)).toString('base64');
    const check = await page.evaluate(async ({ original, packed }) => {
      async function pixels(url) {
        const image = new Image(); image.src = url; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        return { width: image.width, height: image.height, pixels: context.getImageData(0, 0, image.width, image.height).data };
      }
      const a = await pixels(original), b = await pixels(packed);
      let differentChannels = 0, maxDelta = 0;
      for (let i = 0; i < a.pixels.length; i++) {
        const delta = Math.abs(a.pixels[i] - b.pixels[i]);
        if (delta) differentChannels++;
        maxDelta = Math.max(maxDelta, delta);
      }
      return { width: a.width, height: a.height, packedWidth: b.width, packedHeight: b.height, differentChannels, maxDelta };
    }, { original, packed });
    rows.push({ key: item.key, rgbaSha256: item.rgbaSha256, ...check });
    assert.equal(check.width, check.packedWidth); assert.equal(check.height, check.packedHeight);
    assert.equal(check.differentChannels, 0, item.key);
  }
  assert.ok(rows.length > 0); assert.deepEqual(errors, []);
} finally {
  await browser.close(); await mkdir(output, { recursive: true });
  await writeFile(`${output}/browser-pixels.json`, JSON.stringify({ artifactSha256: receipt.sha256, rows, errors }, null, 2));
}
console.log(JSON.stringify({ images: rows.length, differentChannels: 0, errors }));
