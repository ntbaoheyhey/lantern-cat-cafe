// Local-only fixture setup shared by visual stills, animation evidence and audits.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
export const root = resolve(import.meta.dirname, '..');
export const web = resolve(root, 'apps/web');
export const requireWeb = createRequire(resolve(web, 'package.json'));
export const { chromium } = requireWeb('@playwright/test');
export const now = Date.UTC(2026, 10, 4, 11, 30);
export const screens = ['home', 'inventory', 'boss', 'forge', 'market', 'upgrade', 'relic', 'forge-reveal'];
let fontCache;
export async function pinExistingFonts(page) {
  if (!fontCache) {
    // Same version/hash as the repository's accepted visual-font fixture. No art download.
    const source = readFileSync(resolve(web, 'e2e/support/visual-fonts.ts'), 'utf8');
    const fonts = [...source.matchAll(/family: '([^']+)', weights: \[([^\]]+)\],[\s\S]*?url: '([^']+)',[\s\S]*?sha256: '([^']+)'/g)];
    fontCache = await Promise.all(fonts.map(async ([,family,weights,url,hash]) => {
      if (!url.startsWith('https://fonts.gstatic.com/s/')) throw new Error('Unexpected font source');
      const response = await fetch(url); if (!response.ok) throw new Error('Font unavailable: '+family);
      const body = Buffer.from(await response.arrayBuffer());
      if (createHash('sha256').update(body).digest('hex') !== hash) throw new Error('Font identity changed: '+family);
      return { family, weights: weights.split(',').map(Number), url, body };
    }));
    if (fontCache.length !== 3) throw new Error('Expected three existing pinned fonts');
  }
  for (const f of fontCache) await page.route(f.url, r => r.fulfill({ contentType: 'font/woff2', headers: {'access-control-allow-origin':'*'}, body:f.body }));
  const css = fontCache.flatMap(f=>f.weights.map(w=>`@font-face{font-family:'${f.family}';font-style:normal;font-weight:${w};font-display:swap;src:url('${f.url}') format('woff2');}`)).join('\n');
  await page.route('https://fonts.googleapis.com/**', r=>r.fulfill({contentType:'text/css',body:css}));
}
export async function fixtureData() {
  const { createServer } = await import(requireWeb.resolve('vite'));
  const vite = await createServer({ configFile: false, root: web, envDir: false, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  try {
    const { mockV2Save } = await vite.ssrLoadModule('/src/api/mockV2Fixtures.ts');
    const { sampleStateV2 } = await vite.ssrLoadModule('/src/layout/sampleState.ts');
    const saves = Object.fromEntries(['midGame', 'forgeRich', 'bossReadyStrong', 'bossReadyWeak'].map(k => [k, mockV2Save(k, { nowMs: now, classId: 'warrior' })]));
    const bag = structuredClone(saves.midGame);
    bag.state.items = sampleStateV2().inventory.map(i => ({ ...i, itemId: i.itemKey, bonusLines: i.bonus, source: 'drop' }));
    saves.bag = bag;
    saves.home = structuredClone(saves.midGame); Object.assign(saves.home.state, { chapter: 1, round: 3, kills: 2 });
    return { key: readFileSync(resolve(web, 'src/api/MockGameApiV2.ts'), 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)[1], saves };
  } finally { await vite.close(); }
}
export async function openView(browser, data, { base, screen, width = 1280, height = 720, motion = screen === 'boss' ? 'no-preference' : 'reduce', clock = true, chapter }) {
  if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Visual tools only accept loopback URLs');
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: motion });
  page.setDefaultTimeout(15000);
  const evidence = { screen, width, height, errors: [], writes: [], blocked: [] };
  page.on('pageerror', e => evidence.errors.push(e.message));
  page.on('request', r => { if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method())) evidence.writes.push(r.method() + ' ' + new URL(r.url()).pathname); });
  await page.route('**/*', r => {
    const url = new URL(r.request().url());
    if (['localhost', '127.0.0.1'].includes(url.hostname)) return r.continue();
    evidence.blocked.push(url.origin); return r.abort();
  });
  await pinExistingFonts(page);
  if (clock) { await page.clock.install({ time: now }); await page.clock.pauseAt(now); }
  const save = structuredClone(data.saves[screen === 'home' ? 'home' : screen === 'boss' ? 'bossReadyWeak' : screen.startsWith('forge') ? 'forgeRich' : 'bag']);
  if (chapter) save.state.chapter = chapter;
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(key, JSON.stringify(save)); localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    let seed = 1404; Math.random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
  }, { key: data.key, save });
  const hash = { home: 'home', inventory: 'bag', boss: 'map', forge: 'forge', market: 'market', upgrade: 'bag', relic: 'forge', 'forge-reveal': 'forge', hero: 'hero' }[screen];
  if (!hash) throw new Error('Unknown capture screen: ' + screen);
  await page.goto(['market', 'relic'].includes(screen) ? `${base}${process.env.VISUAL_FIXTURES ?? ''}/e2e/fixtures/market-view.html` : `${base}/?demo#${hash}`);
  await page.waitForTimeout(500); if (clock) await page.clock.runFor(1500);
  await page.evaluate(() => document.fonts.ready);
  if (screen === 'home') { await page.waitForSelector('.v2-stage-canvas canvas'); await page.waitForTimeout(250); if (clock) await page.clock.runFor(3100); }
  if (screen === 'upgrade') await page.getByRole('list', { name: 'Bag items' }).getByRole('button').first().click();
  if (screen === 'relic') await page.locator('[data-testid=listing-11] button').first().click();
  if (screen === 'boss') {
    await page.getByRole('button', { name: 'Fight', exact: true }).click();
    await page.waitForSelector('.boss-arena-canvas canvas'); await page.waitForTimeout(300); if (clock) await page.clock.runFor(400);
  }
  if (screen === 'forge-reveal') {
    await page.getByTestId('craft-btn').click(); await page.getByTestId('craft-confirm-btn').click({ force: true });
    await page.getByTestId('craft-result').waitFor(); if (clock) await page.clock.runFor(200);
  }
  if (clock) await page.clock.runFor(250);
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
  return { page, evidence };
}
