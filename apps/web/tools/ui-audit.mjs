// Wallet-free UI audit. Runs the Vite DEV server (never a production build) in demo mode:
// no Supabase env, so the app uses MockGameApiV2 backed by localStorage. Nothing leaves the browser.
// Usage: node tools/ui-audit.mjs [outDir] [fixture] [--signed-in]
//   demo fixture: fresh|bossReadyStrong|bossReadyWeak|forgeRich|bagNearFull|midGame
//   --signed-in : starts scripts/local-server.mjs (loopback PGlite running the real Edge Function logic) and a
//                 flag-on build pointed at it, then injects a locally minted session. fixture: fresh|stocked|strong|weak|equip.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('@playwright/test');

const out = resolve(process.argv[2] ?? '../../reports/ui-audit');
const signedIn = process.argv.includes('--signed-in');
const kind = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : signedIn ? 'stocked' : 'bossReadyStrong';
const apiBase = 'http://127.0.0.1:4176';
const port = signedIn ? 4175 : 5199, base = `http://localhost:${port}`;
const key = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)[1];
mkdirSync(out, { recursive: true });

const procs = [];
const run = (cmd, args, env) => procs.push(spawn(cmd, args, { env: { ...process.env, ...env }, stdio: 'ignore' }));
if (signedIn) {
  run('node', ['../../scripts/local-server.mjs']);
  run('node', ['e2e/support/server-build.mjs']);
} else {
  run('npx', ['-y', 'pnpm@10.28.0', 'exec', 'vite', '--port', String(port), '--strictPort'],
    { VITE_GAME_V2: '1', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' });
}
const stop = () => procs.forEach(p => p.kill('SIGTERM'));
process.on('exit', stop);
const waitFor = async url => { for (let i = 0; i < 240; i++) { try { if ((await fetch(url)).ok) return; } catch {} await new Promise(r => setTimeout(r, 500)); } throw new Error(`timeout ${url}`); };
if (signedIn) await waitFor(`${apiBase}/health`);
await waitFor(base);
let session = null;
if (signedIn) {
  const res = await fetch(`${apiBase}/__test/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind }) });
  session = await res.json();
}

// Save JSON is built in the page-free way: the fixture builder is TS, so ask Vite to serve it.
const execPath = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ ...(execPath ? { executablePath: execPath } : {}), args: ['--no-sandbox'] });
const sizes = [[1280, 720], [1600, 900], [390, 844], [320, 568], [844, 390]];
const tabs = ['Home', 'Bag', 'Map', 'Forge', 'Market', 'Hero', 'Help'];
const report = [];
for (const [w, h] of sizes) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.addInitScript(([sess]) => {
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    if (sess) sessionStorage.setItem('taskbar-hero.session', JSON.stringify(sess));
  }, [session]);
  await page.goto(`${base}/`);
  // Seed fixture through the dev server so TypeScript fixtures work without a build step.
  if (!signedIn) {
  const save = await page.evaluate(async ({ kind }) => {
    const m = await import('/src/api/mockV2Fixtures.ts');
    return m.mockV2SaveJson(kind, { nowMs: Date.now(), classId: 'warrior' });
  }, { kind });
  await page.evaluate(([k, s]) => localStorage.setItem(k, s), [key, save]);
  await page.reload();
  }
  await page.waitForTimeout(2500);
  if (w === 1280 || w === 1600 || (w === 390 && h === 844)) {
    await page.screenshot({ path: `${out}/home-${w}x${h}.png` });
  }
  for (const t of tabs) {
    let tab = page.getByRole('tab', { name: t, exact: true }).first();
    if (!(await tab.count())) {
      const alias = t === 'Hero' ? 'Character' : t === 'Map' ? 'Boss' : t;
      tab = page.getByRole('tab', { name: alias, exact: true }).first();
    }
    if (!(await tab.count())) { report.push(`${w}x${h} missing tab ${t}`); continue; }
    await tab.click(); await page.waitForTimeout(600);
    const shouldScreenshot = ((w === 1280 || w === 1600) && t !== 'Forge') || (w === 390 && h === 844 && ['Home', 'Bag', 'Map', 'Hero'].includes(t));
    if (shouldScreenshot) {
      await page.screenshot({ path: `${out}/${t.toLowerCase()}-${w}x${h}.png` });
    }
    if (t === 'Forge') for (const sub of ['craft', 'salvage', 'relic']) {
      const s = page.getByTestId(`tab-${sub}`);
      if (await s.count()) {
        await s.click(); await page.waitForTimeout(400);
        if (w === 1280 || w === 1600 || (w === 390 && h === 844 && (sub === 'relic' || sub === 'craft'))) {
          await page.screenshot({ path: `${out}/forge-${sub}-${w}x${h}.png` });
        }
      }
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight);
    if (overflow) report.push(`${w}x${h} ${t}: document scrolls`);
  }
  if (errors.length) report.push(`${w}x${h} console errors: ${[...new Set(errors)].slice(0, 5).join(' | ')}`);
}
await browser.close(); stop();
console.log(report.length ? report.join('\n') : 'no automatic findings');
