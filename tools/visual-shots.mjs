// Usage: VISUAL_SIZES=1280x720,1440x900,1920x1080 node tools/visual-shots.mjs after http://127.0.0.1:5380
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, chromium, screens, fixtureData, openView } from './visual-support.mjs';
const phase = process.argv[2] ?? 'after', base = process.argv[3] ?? 'http://127.0.0.1:5380';
if (!['before', 'after'].includes(phase)) throw new Error('Phase must be before or after');
const out = resolve(root, 'docs/visual/img'); mkdirSync(out, { recursive: true });
const data = await fixtureData(), browser = await chromium.launch(), receipt = [];
try {
  for (const [width, height] of (process.env.VISUAL_SIZES ?? '1280x720,1440x900,1920x1080').split(',').map(v => v.split('x').map(Number))) {
    for (const screen of process.env.VISUAL_SCREENS?.split(',') ?? screens) {
      const { page, evidence } = await openView(browser, data, { base, screen, width, height });
      await page.screenshot({ path: resolve(out, `${phase}-${screen}-${width}.png`), animations: 'disabled' });
      evidence.overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      evidence.imagesDecoded = await page.locator('img').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0));
      receipt.push(evidence); await page.close();
    }
  }
} finally { await browser.close(); }
const path = resolve(root, `reports/visual/${phase}-captures.json`);
const previous = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [];
const merged = previous.filter(r => !receipt.some(n => n.screen === r.screen && n.width === r.width));
writeFileSync(path, '[\n' + [...merged, ...receipt].map(r => '  ' + JSON.stringify(r)).join(',\n') + '\n]\n');
if (receipt.some(r => r.errors.length || r.writes.length || r.overflow || !r.imagesDecoded)) process.exitCode = 1;
console.log(JSON.stringify(receipt));
