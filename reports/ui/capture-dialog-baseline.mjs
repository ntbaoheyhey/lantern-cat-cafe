// Local-only, read-only browser evidence for CXR2's pre-repair state.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const root = process.cwd(), web = resolve(root, 'apps/web');
const require = createRequire(resolve(web, 'package.json'));
const { createServer, preview } = require('vite');
const { chromium, expect } = require('@playwright/test');
const out = resolve(root, 'screenshots/ui-2026-11-03/cxr2-before-final');
mkdirSync(out, { recursive: true });
Object.assign(process.env, { VITE_GAME_V2: '1', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' });
const loader = await createServer({ root: web, envDir: false, server: { middlewareMode: true, hmr: { port: 5361 } } });
const { mockV2SaveJson } = await loader.ssrLoadModule('/src/api/mockV2Fixtures.ts');
await loader.close();
const server = await preview({ root: web, envDir: false, build: { outDir: 'dist/ui-before-16f940f' }, preview: { port: 5360, strictPort: true } });
const key = readFileSync(resolve(web, 'src/api/MockGameApiV2.ts'), 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)[1];
let browser;
const screenshots = [];
try {
  browser = await chromium.launch();
  for (const width of [1280, 1600]) {
    let context = await browser.newContext({ viewport: { width, height: width * 9 / 16 }, reducedMotion: 'reduce' });
    let page = await context.newPage();
    const snap = async name => {
      await page.evaluate(() => document.fonts.ready);
      const path = resolve(out, `${name}-${width}.png`); await page.screenshot({ path }); screenshots.push(path);
    };
    await page.goto('http://localhost:5360/#landing');
    await expect(page.getByRole('dialog', { name: 'How to play' })).toBeVisible(); await snap('first-help');
    await page.getByRole('button', { name: 'Start playing' }).click(); await snap('landing');
    await page.getByTestId('landing-start').click(); await expect(page.getByTestId('class-picker')).toBeVisible(); await snap('class');
    const now = Date.now();
    const save = mockV2SaveJson('bossReadyStrong', { nowMs: now - 3600000, classId: 'warrior' });
    await context.close();
    context = await browser.newContext({ viewport: { width, height: width * 9 / 16 }, reducedMotion: 'reduce' });
    page = await context.newPage();
    await page.addInitScript(({ key, save, now }) => { localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); localStorage.setItem('taskbar-hero:v2-last-visit', String(now - 3600000)); }, { key, save, now });
    await page.clock.install({ time: now }); await page.goto('http://localhost:5360/#home');
    await expect(page.locator('.v2-stage-canvas canvas')).toBeVisible();
    await page.clock.fastForward(30000);
    const welcome = page.getByRole('dialog', { name: 'Welcome back!' });
    await expect(welcome).toBeVisible(); await snap('welcome'); await page.keyboard.press('Escape');
    await page.getByRole('tab', { name: 'Map', exact: true }).click(); await page.getByRole('button', { name: 'Fight', exact: true }).click();
    const chest = page.getByRole('dialog', { name: 'First clear chest!' }); await expect(chest).toBeVisible(); await snap('chest');
    await context.close();
  }
  writeFileSync(resolve(out, 'source.json'), JSON.stringify({ head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), screenshots, source: 'Local guest fixtures; no live wallet or backend journey.' }, null, 2) + '\n');
  console.log(`Captured ${screenshots.length} baseline views.`);
} finally { await browser?.close(); await new Promise(done => server.httpServer.close(done)); }
