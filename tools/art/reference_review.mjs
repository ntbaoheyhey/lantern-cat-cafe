// ART1 local original-reference inspection only; never the app's e2e or UI match gate.
// Uses the existing workspace Playwright dependency. Blocks external fonts/resources.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(resolve(root, 'apps/web/package.json'));
const { chromium } = require('@playwright/test');
const out = resolve(root, 'reports/scorecard/art1/references');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [name, source, screens] of [
    ['redesign', 'reports/ui-redesign/index.html', ['landing', 'class', 'stage', 'bag', 'map', 'forge', 'market', 'char', 'help', 'states']],
    ['rune-demo', 'docs/proposals/rune-skill-system/demo/index.html', ['skills', 'passives', 'runes', 'drops', 'stages', 'gear', 'pets', 'hub', 'quests', 'codex', 'planner', 'notes']],
  ]) {
    for (const width of [1280, 1600]) {
      const page = await browser.newPage({ viewport: { width: width + 80, height: width * 9 / 16 + 240 }, reducedMotion: 'reduce' });
      await page.route(/^https?:/, (route) => route.fulfill({ status: 200, body: '', contentType: 'text/css' }));
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(pathToFileURL(resolve(root, source)).href);
      await page.locator(`#size [data-w="${width}"]`).click();
      const captures = [];
      for (const screen of screens) {
        if (name === 'redesign') await page.locator(`#tabs [data-k="${screen}"]`).click();
        else await page.locator(`[data-act="go"][data-k="${screen}"]`).first().click();
        // Only the reference wrapper is unscaled for exact native-size captures.
        await page.evaluate((w) => {
          const vp = document.getElementById('vp');
          vp.style.width = w + 'px';
          vp.style.maxWidth = 'none';
          const app = vp.querySelector('.app, #app');
          app.style.transform = 'none';
        }, width);
        const app = page.locator(name === 'redesign' ? '#vp > .app' : '#app');
        const size = await app.evaluate((element) => ({ width: element.offsetWidth, height: element.offsetHeight, svg: element.querySelectorAll('svg').length }));
        if (size.width !== width || size.height !== width * 9 / 16) throw new Error('reference native dimensions mismatch');
        const bytes = await app.screenshot({ animations: 'disabled' });
        captures.push({ screen, image: bytes.toString('base64') });
        results.push({ reference: source, screen, ...size, pageErrors: [...errors], externalResources: 'blocked; system font fallback' });
        console.log(`${name} ${width}x${width * 9 / 16} ${screen}: ${size.svg} SVGs, pageErrors=${errors.length}`);
      }
      await page.close();
      for (let start = 0; start < captures.length; start += 6) {
        const group = captures.slice(start, start + 6);
        const sheet = await browser.newPage({ viewport: { width: 960, height: Math.ceil(group.length / 3) * 204 } });
        await sheet.setContent(`<html><body style="margin:0;background:#1a1220;color:#fff3e0;font:14px monospace;display:grid;grid-template-columns:repeat(3,320px)">${group.map(c => `<div style="height:204px"><div style="height:24px;padding-left:6px">${name} ${width} · ${c.screen}</div><img width="320" height="180" src="data:image/png;base64,${c.image}"/></div>`).join('')}</body></html>`);
        await sheet.locator('img').evaluateAll((images) => Promise.all(images.map(image => image.decode())));
        const file = resolve(out, `${name}-${width}-${start / 6 + 1}.png`);
        const bytes = await sheet.screenshot({ path: file });
        if (bytes.length >= 200_000) throw new Error('reference contact sheet exceeds 200 KB');
        await sheet.close();
      }
    }
  }
  writeFileSync(resolve(out, 'inspection.json'), JSON.stringify(results, null, 2) + '\n');
  if (results.some(r => r.pageErrors.length)) throw new Error('reference page errors recorded');
  console.log(`Inspected ${results.length} reference views. Eight contact sheets; no app runtime gate executed.`);
} finally {
  await browser.close();
}
