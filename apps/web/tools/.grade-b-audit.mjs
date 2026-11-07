// Wallet-free audit. Run from apps/web (paths also work from other directories).
// Usage: SCREENSHOTS=1 node tools/ui-audit.mjs [outDir] [fixture] [--signed-in] [--mobile] [--strict]
// Desktop: 1280x720 + 1600x900. --mobile adds 390x844 measurements only.
// Demo fixtures: fresh|bossReadyStrong|bossReadyWeak|forgeRich|bagNearFull|midGame.
// --signed-in uses loopback-only PGlite, never a live account. Fixtures: fresh|stocked|strong|weak|equip.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createNetServer } from 'node:net';
import { chromium } from '@playwright/test';
import { createServer, build, preview } from 'vite';
import { layoutFindings } from './layout-findings.mjs';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flags = new Set(['--signed-in', '--mobile', '--strict']);
for (const arg of args) if (arg.startsWith('--') && !flags.has(arg)) throw new Error(`Unknown option: ${arg}`);
const positional = args.filter(arg => !arg.startsWith('--'));
const out = resolve(positional[0] ?? resolve(webRoot, '../../reports/ui-audit'));
const signedIn = args.includes('--signed-in');
const kind = positional[1] ?? (signedIn ? 'stocked' : 'bossReadyStrong');
const manifest = JSON.parse(readFileSync(new URL('./screen-manifest.json', import.meta.url), 'utf8'));
const sizes = [...manifest.viewports, ...(args.includes('--mobile') ? [{ width: 390, height: 844 }] : [])];
const port = 4434, apiPort = 4433;
const base = `http://localhost:${port}`;
const key = readFileSync(resolve(webRoot, 'src/api/MockGameApiV2.ts'), 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)[1];
mkdirSync(out, { recursive: true });

// Refuse stale/foreign servers; close only resources this invocation owns.
async function requireFreePort(port) {
  const socket = createNetServer();
  await new Promise((ok, fail) => { socket.once('error', fail); socket.listen(port, ok); });
  await new Promise(ok => socket.close(ok));
}
let server, local, browser;
const report = { fixture: kind, signedIn, viewports: sizes, screens: [] };
let closing;
const close = () => closing ??= (async () => {
  await browser?.close();
  if (server?.close) await server.close();
  else if (server?.httpServer) await new Promise(ok => server.httpServer.close(ok));
  await local?.close();
})();
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void close().finally(() => process.exit(1)); });
try {
  await requireFreePort(port);
  let session = null;
  if (signedIn) {
    await requireFreePort(apiPort);
    const { startLocalServer } = await import('../../../scripts/local-server.mjs');
    local = await startLocalServer({ port: apiPort, webPort: port });
    process.env.VITE_GAME_V2 = '1';
    process.env.VITE_SUPABASE_URL = `http://127.0.0.1:${apiPort}`;
    process.env.VITE_SUPABASE_ANON_KEY = 'local-test-public-key';
    const outDir = 'dist/ui-audit-signed-in';
    await build({ root: webRoot, envDir: false, build: { outDir } });
    server = await preview({ root: webRoot, envDir: false, build: { outDir }, preview: { port, strictPort: true } });
    const res = await fetch(`http://127.0.0.1:${apiPort}/__test/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind }) });
    if (!res.ok) throw new Error(`Local fixture ${kind}: HTTP ${res.status}`);
    session = await res.json();
  } else {
    process.env.VITE_GAME_V2 = '1';
    process.env.VITE_SUPABASE_URL = '';
    process.env.VITE_SUPABASE_ANON_KEY = '';
    server = await createServer({ root: webRoot, envDir: false, server: { port, strictPort: true } });
    await server.listen();
  }
  const executablePath = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
  for (const size of sizes) {
    const context = await browser.newContext({ viewport: size });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await page.addInitScript(sess => {
        localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
        if (sess) sessionStorage.setItem('taskbar-hero.session', JSON.stringify(sess));
      }, session);
      await page.goto(base);
      if (!signedIn) {
        const save = await page.evaluate(async kind => {
          const fixtures = await import('/src/api/mockV2Fixtures.ts');
          return fixtures.mockV2SaveJson(kind, { nowMs: Date.now(), classId: 'warrior' });
        }, kind);
        await page.evaluate(([k, s]) => localStorage.setItem(k, s), [key, save]);
        await page.reload();
      }
      await page.locator('[data-testid="rail"], [data-game-v2="stage-v2-enabled"]').first().waitFor();
      await page.locator('[data-testid="hud"], [aria-label="Cat status"]').first().waitFor();
      await page.waitForTimeout(600);
      const contract = await page.getByTestId(manifest.shell.railTestId).count() > 0;
      for (const screen of manifest.screens) {
        const missing = [];
        if (contract) {
          const nav = page.getByTestId(manifest.shell.railTestId).getByTestId(screen.navTestId);
          if (await nav.count()) await nav.click(); else missing.push(screen.navTestId);
        } else if (screen.legacyTab) {
          let tab = page.getByRole('tab', { name: screen.label.split(' / ')[0], exact: true }).first();
          if (!(await tab.count())) tab = page.getByRole('tab', { name: screen.legacyTab, exact: true }).first();
          if (await tab.count()) await tab.click(); else missing.push(`tab: ${screen.label} / ${screen.legacyTab}`);
        }
        if (screen.subnavTestId) {
          const sub = page.getByTestId(screen.subnavTestId);
          if (await sub.count()) await sub.click(); else missing.push(screen.subnavTestId);
        }
        await page.waitForTimeout(600);
        const root = contract ? page.getByTestId(screen.screenTestId) : page.locator('body');
        for (const selector of screen.required) if (!await root.locator(selector).filter({ visible: true }).first().isVisible()) missing.push(selector);
        const findings = await page.evaluate(layoutFindings);
        const item = { viewport: `${size.width}x${size.height}`, screen: screen.id, navigation: contract ? 'rail' : 'legacy baseline', ...findings, missingRequired: missing, consoleErrors: [...new Set(errors.splice(0))] };
        if (process.env.SCREENSHOTS === '1' && screen.screenshot && size.width >= 1280) {
          item.screenshot = `${screen.id}-${size.width}x${size.height}.png`;
          await page.screenshot({ path: resolve(out, item.screenshot) });
        }
        report.screens.push(item);
        console.log(`${item.viewport} ${screen.id} (${item.navigation}): document-scroll=${findings.documentScroll ? 'document scrolls' : '[]'}; horizontal-overflow=${JSON.stringify(findings.horizontalOverflow)}; element-overlap=${JSON.stringify(findings.elementOverlap)}; missing=${JSON.stringify(missing)}; console-errors=${JSON.stringify(item.consoleErrors)}`);
      }
    } finally { await context.close(); }
  }
  writeFileSync(resolve(out, 'findings.json'), `${JSON.stringify(report, null, 2)}\n`);
  const count = report.screens.filter(s => s.documentScroll || s.horizontalOverflow.length || s.elementOverlap.length || s.missingRequired.length || s.consoleErrors.length).length;
  console.log(`${report.screens.length} screens audited; ${count} with findings. JSON: ${resolve(out, 'findings.json')}`);
  if (args.includes('--strict') && count) process.exitCode = 1;
} finally { await close(); }
