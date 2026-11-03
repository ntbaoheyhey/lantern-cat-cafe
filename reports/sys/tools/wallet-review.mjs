import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [root, dist, portText, output] = process.argv.slice(2);
const port = Number(portText), web = resolve(root, 'apps/web');
assert.ok(port >= 5173 && port <= 5299);
const require = createRequire(resolve(web, 'package.json'));
const { chromium, expect } = require('@playwright/test');
const { preview } = await import(pathToFileURL(require.resolve('vite')));
const provenance = JSON.parse(readFileSync('/Users/bao/taskbar-hero-ui-ledger/reports/ui/logs/axe-tool-provenance.json', 'utf8'));
const axe = readFileSync(provenance.path, 'utf8');
assert.equal(createHash('sha256').update(axe).digest('hex'), provenance.scriptSha256);
mkdirSync(output, { recursive: true });
const report = { head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), root, dist, port, cases: [] };
const save = () => writeFileSync(resolve(output, 'review.json'), JSON.stringify(report, null, 2) + '\n');
const server = await preview({ root: web, envDir: false, build: { outDir: dist }, preview: { port, strictPort: true } });
let browser;
try {
  browser = await chromium.launch();
  for (const width of [1280, 1600]) for (const screen of ['landing', 'home']) for (const state of ['nonce-502', 'wrong-network']) {
    const page = await browser.newPage({ viewport: { width, height: width === 1280 ? 720 : 900 } });
    const row = { width, screen, state, nonceCalls: 0, otherFunctionCalls: 0, errors: [] }; report.cases.push(row); save();
    page.on('pageerror', e => row.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !(m.location().url.endsWith('/auth-nonce') && m.text().includes('502'))) row.errors.push(m.text()); });
    await page.addInitScript(({ state }) => {
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
      window.__walletReviewCalls = [];
      window.ethereum = { isMetaMask: true, on() {}, removeListener() {}, async request({ method }) {
        window.__walletReviewCalls.push(method);
        if (['eth_accounts', 'eth_requestAccounts'].includes(method)) return ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8'];
        if (method === 'eth_chainId') return state === 'wrong-network' ? '0x1' : '0xa869';
        if (['wallet_requestPermissions', 'wallet_getPermissions'].includes(method)) return [{ parentCapability: 'eth_accounts' }];
        throw new Error('Forbidden synthetic wallet operation: ' + method);
      } };
    }, { state });
    await page.route('**/functions/v1/**', route => {
      if (route.request().url().endsWith('/auth-nonce')) row.nonceCalls++;
      else row.otherFunctionCalls++;
      return route.fulfill({ status: 502, contentType: 'text/plain', headers: { 'access-control-allow-origin': '*' }, body: 'Bad Gateway' });
    });
    await page.goto(`http://localhost:${port}/#landing`);
    if (screen === 'home') {
      await page.getByTestId('landing-start').click();
      await page.getByTestId('class-picker-choose-button').click();
      await page.getByTestId('class-picker-confirm-button').click();
      await expect(page.getByTestId('home-dashboard')).toBeVisible();
    }
    await page.getByRole('button', { name: 'Connect wallet', exact: true }).click();
    if (state === 'nonce-502') await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    const notice = page.getByRole('alert');
    await expect(notice).toContainText(state === 'nonce-502' ? 'Wallet sign-in is temporarily unavailable, guest play still works.' : 'Wrong network. Switch to Avalanche Fuji.');
    await expect(notice).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('button', { name: state === 'nonce-502' ? 'Sign in' : 'Switch to Fuji', exact: true })).toBeInViewport({ ratio: 1 });
    row.geometry = await notice.evaluate(el => {
      const r = el.getBoundingClientRect();
      const controls = [...document.querySelectorAll('[data-testid="landing-start"], .landing-footer a, .landing-footer button')].map(x => {
        const b = x.getBoundingClientRect(); const top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
        return { text: x.textContent, occluded: !!top && !x.contains(top) };
      });
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, clipped: el.scrollWidth > el.clientWidth + 1, documentOverflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight, controls };
    });
    assert.equal(row.geometry.clipped, false);
    assert.equal(row.geometry.documentOverflow, false);
    assert.deepEqual(row.geometry.controls.filter(x => x.occluded), []);
    await page.evaluate(axe);
    row.axe = await page.evaluate(async () => { const a = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }); return { violations: a.violations, incomplete: a.incomplete.map(x => ({ id: x.id, targets: x.nodes.map(n => n.target) })) }; });
    row.walletMethods = await page.evaluate(() => window.__walletReviewCalls);
    row.sessionWritten = await page.evaluate(() => sessionStorage.getItem('taskbar-hero.session') !== null);
    assert.equal(row.nonceCalls, state === 'nonce-502' ? 3 : 0);
    assert.equal(row.otherFunctionCalls, 0);
    assert.equal(row.sessionWritten, false);
    assert.equal(row.walletMethods.some(x => /sign|send/i.test(x)), false);
    await page.screenshot({ path: resolve(output, `${state}-${screen}-${width}.png`) });
    await notice.getByRole('button', { name: /^Dismiss / }).click();
    await expect(notice).toHaveCount(0);
    assert.deepEqual(row.errors, []);
    save(); await page.close();
  }
  report.complete = true; save();
  const failures = report.cases.filter(x => x.axe.violations.length);
  console.log(JSON.stringify(report.cases.map(x => ({ width: x.width, screen: x.screen, state: x.state, violations: x.axe.violations.map(v => v.id), errors: x.errors }))));
  assert.deepEqual(failures.map(x => ({ width: x.width, screen: x.screen, state: x.state, violations: x.axe.violations.map(v => v.id) })), []);
} finally { save(); await browser?.close(); await new Promise(ok => server.httpServer.close(ok)); }
