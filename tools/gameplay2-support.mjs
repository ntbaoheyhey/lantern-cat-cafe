import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, web, requireWeb, chromium, pinExistingFonts } from './visual-support.mjs';
export { root, chromium };
export async function sampleData() {
  const { createServer } = await import(requireWeb.resolve('vite'));
  const vite = await createServer({ configFile: false, root, envDir: false, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  try {
    const game = await vite.ssrLoadModule('/packages/game-rules/client/cafe.ts');
    const { CONFIG } = await vite.ssrLoadModule('/packages/game-rules/src/config.ts');
    const { mockV2Save } = await vite.ssrLoadModule('/apps/web/src/api/mockV2Fixtures.ts');
    const key = readFileSync(resolve(web, 'src/api/MockGameApiV2.ts'), 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)[1];
    return { game, C: CONFIG.cafe, key, main: mockV2Save('fresh', { nowMs: Date.now(), classId: 'warrior' }) };
  } finally { await vite.close(); }
}
export async function openSample(browser, data, { base = 'http://127.0.0.1:5391', width = 1280, height = 720, state, away = 0, motion = 'reduce', debug = false } = {}) {
  if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw Error('Loopback only');
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: motion });
  page.setDefaultTimeout(8000);
  const evidence = { width, height, errors: [], writes: [] };
  page.on('pageerror', e => evidence.errors.push(e.message));
  page.on('request', r => { if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method())) evidence.writes.push(r.method() + ' ' + new URL(r.url()).pathname); });
  await page.route('**/*', r => ['localhost', '127.0.0.1'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.abort());
  await pinExistingFonts(page);
  await page.addInitScript(({ key, main, state, away }) => {
    if (!sessionStorage.getItem('sample-fixture-loaded')) {
      localStorage.setItem(key, JSON.stringify({ ...main, lastClaimMs: Date.now() }));
      localStorage.setItem('taskbar-hero:cafe-sample:1', JSON.stringify({ state, lastSeen: Date.now() - away }));
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
      sessionStorage.setItem('sample-fixture-loaded', '1');
    }
  }, { key: data.key, main: data.main, state: state ?? data.game.createCafe(11), away });
  await page.goto(`${base}/?demo&coach=off&adventure=1${debug ? '&adventureDebug=1' : ''}#home`);
  await page.getByTestId('cafe-adventure').waitFor();
  await page.evaluate(() => document.fonts.ready);
  return { page, evidence };
}
export const sampleNav = (page, name) => page.getByRole('navigation', { name: 'Adventure pages' }).getByRole('button', { name, exact: true }).click();
