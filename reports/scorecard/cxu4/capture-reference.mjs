import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync, inflateSync } from 'node:zlib';
const root = process.cwd(), out = resolve(root, 'reports/scorecard/cxu4');
const { chromium } = createRequire(resolve(root, 'apps/web/package.json'))('@playwright/test');
function compress(raw) {
  const chunks = [], data = [];
  for (let offset = 8; offset < raw.length;) {
    const length = raw.readUInt32BE(offset), chunk = raw.subarray(offset, offset + length + 12);
    if (chunk.toString('ascii', 4, 8) === 'IDAT') data.push(chunk.subarray(8, -4)); else chunks.push(chunk);
    offset += length + 12;
  }
  const zipped = deflateSync(inflateSync(Buffer.concat(data)), { level: 9 });
  const idat = Buffer.alloc(zipped.length + 12); idat.writeUInt32BE(zipped.length); idat.write('IDAT', 4);
  zipped.copy(idat, 8); idat.writeUInt32BE(crc32(idat.subarray(4, -4)), idat.length - 4);
  const end = chunks.pop();
  return Buffer.concat([raw.subarray(0, 8), ...chunks, idat, end]);
}
if (process.env.SCREENSHOTS !== '1') throw new Error('SCREENSHOTS=1 required');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const width of [1280, 1600]) for (const screen of ['char', 'help', 'states']) {
    const height = width * 9 / 16, page = await browser.newPage({ viewport: { width, height } });
    await page.goto(pathToFileURL(resolve(root, 'reports/ui-redesign/index.html')).href + '#' + screen);
    await page.locator('[data-w="' + width + '"]').click();
    await page.evaluate(() => {
      const app = document.querySelector('.app');
      for (const style of document.body.querySelectorAll('style, link[rel=stylesheet]')) document.head.append(style);
      const symbols = [...document.querySelectorAll('svg')].filter(svg => svg.querySelector('symbol'));
      document.body.replaceChildren(...symbols, app);
      Object.assign(app.style, { position: 'absolute', left: '0', top: '0', transform: 'none' });
      document.body.style.margin = '0';
    });
    await page.evaluate(() => document.fonts.ready);
    const bytes = compress(await page.screenshot());
    if (bytes.length >= 200 * 1024) throw new Error('Screenshot budget exceeded');
    const name = 'reference-' + screen + '-' + width + '.png';
    writeFileSync(resolve(out, name), bytes);
    console.log(name + ': ' + bytes.length + ' bytes, ' + width + 'x' + height);
    await page.close();
  }
} finally { await browser.close(); }
