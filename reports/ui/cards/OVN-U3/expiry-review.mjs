import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [root, dist, portText, output] = process.argv.slice(2);
const port = Number(portText), web = resolve(root, 'apps/web');
assert.ok(port >= 5300 && port <= 5399);
const require = createRequire(resolve(web, 'package.json'));
const { chromium, expect } = require('@playwright/test');
const { preview } = await import(pathToFileURL(require.resolve('vite')));
const provenance = JSON.parse(readFileSync('/Users/bao/taskbar-hero-ui-ledger/reports/ui/logs/axe-tool-provenance.json', 'utf8'));
const axe = readFileSync(provenance.path, 'utf8');
assert.equal(createHash('sha256').update(axe).digest('hex'), provenance.scriptSha256);
const fontSource = readFileSync(resolve(web, 'e2e/support/visual-fonts.ts'), 'utf8');
const fonts = Function('return ' + fontSource.match(/const fonts = (\[[\s\S]*?\n\]);/)[1])();
mkdirSync(output, { recursive: true });
const report = { head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), root, cases: [] };
const save = () => writeFileSync(resolve(output, 'review.json'), JSON.stringify(report, null, 2) + '\n');
const server = await preview({ root: web, envDir: false, build: { outDir: dist }, preview: { port, strictPort: true } });
let browser;
try {
  browser = await chromium.launch();
  for (const width of [1280, 1600]) {
    const page = await browser.newPage({ viewport: { width, height: width === 1280 ? 720 : 900 } });
    const row = { width, errors: [], writes: [], scans: [] }; report.cases.push(row);
    page.on('pageerror', e => row.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !(m.location().url.endsWith('/v2-state') && m.text().includes('401'))) row.errors.push(m.text()); });
    page.on('request', req => { if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method()) && !req.url().endsWith('/v2-state')) row.writes.push(req.url()); });
    for (const font of fonts) {
      const response = await page.request.get(font.url); assert.equal(response.ok(), true);
      const body = await response.body(); assert.equal(createHash('sha256').update(body).digest('hex'), font.sha256);
      await page.route(font.url, route => route.fulfill({ contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' }, body }));
    }
    const css = fonts.flatMap(f => f.weights.map(w => `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${w};font-display:swap;src:url('${f.url}') format('woff2');}`)).join('\n');
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: css }));
    await page.route('**/functions/v1/**', route => route.fulfill({ status: 401, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"error":"unauthenticated"}' }));
    await page.addInitScript(() => {
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
      sessionStorage.setItem('taskbar-hero.session', JSON.stringify({ token: 'browser-local-only', playerId: 'browser-local-only', wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', expiresAt: Date.now() + 60000 }));
    });
    await page.goto(`http://localhost:${port}/#home`);
    const notice = page.getByTestId('session-expired-notice');
    await expect(notice).toBeVisible(); await expect(notice).toHaveAttribute('aria-live', 'polite');
    async function capture(label) {
      await expect(notice).toBeInViewport({ ratio: 1 });
      const geometry = await page.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight }));
      assert.deepEqual(geometry, { x: false, y: false });
      await page.evaluate(axe);
      const scan = await page.evaluate(async () => { const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }); return { violations: r.violations, incomplete: r.incomplete.map(x => x.id) }; });
      row.scans.push({ label, ...scan }); save();
      await page.screenshot({ path: resolve(output, `${label}-${width}.png`) });
      assert.deepEqual(scan.violations, []);
    }
    await expect(page.getByTestId('class-picker-choose-button')).toBeInViewport({ ratio: 1 });
    await capture('expired-class');
    await page.getByTestId('class-picker-choose-button').focus();
    await page.keyboard.press('Enter');
    const confirm = page.getByTestId('class-picker-confirm-button'); await expect(confirm).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(confirm).toHaveCount(0);
    await expect(page.getByTestId('class-picker-choose-button')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(confirm).toBeVisible(); await confirm.focus(); await page.keyboard.press('Enter');
    await expect(page.getByTestId('home-dashboard')).toBeVisible();
    await capture('expired-home');
    await page.context().setOffline(true); await page.evaluate(() => dispatchEvent(new Event('offline')));
    await expect(page.getByText(/offline/i).first()).toBeVisible();
    await expect(notice).toBeVisible(); await capture('expired-offline');
    assert.deepEqual(row.errors, []); assert.deepEqual(row.writes, []);
    row.keyboardEnterEscapeFocus = true; save(); await page.close();
  }
  report.complete = true; save(); console.log('PASS expiry class/Home/offline geometry, WCAG AA, keyboard Enter/Escape/focus, polite live region, zero errors/writes at both sizes');
} finally { save(); await browser?.close(); await new Promise(ok => server.httpServer.close(ok)); }
