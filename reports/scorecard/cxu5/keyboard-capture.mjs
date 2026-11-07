import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = process.cwd(), web = resolve(root, 'apps/web');
const require = createRequire(`${web}/package.json`);
const { chromium } = require('@playwright/test');
const { createServer } = await import(require.resolve('vite'));
process.env.VITE_GAME_V2 = '1'; process.env.VITE_SUPABASE_URL = ''; process.env.VITE_SUPABASE_ANON_KEY = '';
const server = await createServer({ root: web, envDir: false, server: { port: 4370, strictPort: true } });
let browser;
const report = [];
try {
 await server.listen();
 const { mockV2Save } = await server.ssrLoadModule('/src/api/mockV2Fixtures.ts');
 const key = readFileSync(`${web}/src/api/MockGameApiV2.ts`, 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)[1];
 browser = await chromium.launch({ args: ['--no-sandbox'] });
 for (const size of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  for (const [chapter, keys] of [[1, 1], [1, 0], [5, 0]]) {
   const context = await browser.newContext({ viewport: size, reducedMotion: 'reduce' });
   const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
   const save = mockV2Save('bossReadyStrong', { nowMs: Date.now(), chapter }); save.state.stacks.catKey = keys;
   for (let prior = 1; prior < chapter; prior++) save.state.bossClears[prior] = { wins: 1 };
   await page.addInitScript(({ key, save }) => { localStorage.setItem(key, JSON.stringify(save)); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); }, { key, save });
   await page.goto('http://localhost:4370/');
   await page.locator('.v2-shell').waitFor();
   const trail = [];
   async function tabTo(selector) {
    for (let step = 0; step < 50; step++) {
     await page.keyboard.press('Tab');
     const focused = await page.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim().slice(0, 100) }));
     trail.push(focused);
     if (await page.locator(selector).evaluateAll(nodes => nodes.some(node => node === document.activeElement))) return;
    }
    throw Error(`Keyboard could not reach ${selector}`);
   }
   await tabTo('[data-testid="nav-home"]');
   await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
   await page.keyboard.press('Enter');
   await page.getByRole('region', { name: 'Boss Gate' }).waitFor(); await page.evaluate(() => document.fonts.ready);
   if (await page.getByTestId('nav-map').getAttribute('aria-selected') !== 'true') throw Error('Map did not activate');
   await tabTo(`.v2-chapter-map [data-chapter="${chapter}"]`); await page.keyboard.press('Enter');
   if (chapter === 1) {
    await page.keyboard.press('Tab');
    if (await page.locator('.v2-chapter-map [data-chapter="2"]').evaluate(node => node !== document.activeElement)) throw Error('Chapter keyboard order changed');
    await page.keyboard.press('Enter'); await page.keyboard.press('Space');
    if (await page.locator('.boss-gate-boss-name').textContent() !== 'Yarn Giant') throw Error('Locked chapter selected');
   }
   await tabTo('.boss-chapter-btn[aria-current="true"]'); await page.keyboard.press('Enter');
   const bounds = await page.locator('.boss-map-sidebar').evaluate(el => ({ bottom: el.getBoundingClientRect().bottom, viewport: innerHeight }));
   if (bounds.bottom > bounds.viewport) throw Error(`Clipped sidebar ${JSON.stringify(bounds)}`);
   if (errors.length) throw Error(errors.join('\n'));
   if (process.env.SCREENSHOTS === '1') await page.screenshot({ path: `${root}/reports/scorecard/cxu5/${keys ? 'map' : `map-no-key-ch${chapter}`}-${size.width}.png` });
   report.push({ size, chapter, keys, keyboardSteps: trail, bounds, consoleErrors: errors });
   await context.close();
  }
 }
 writeFileSync(`${root}/reports/scorecard/cxu5/keyboard-capture.json`, JSON.stringify(report, null, 2));
 console.log(`PASS ${report.length} keyboard-only Map visits and geometry checks`);
} finally { await browser?.close(); await server.close(); }
