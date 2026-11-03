import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const [root, url, out] = process.argv.slice(2);
const require = createRequire(resolve(root, 'apps/web/package.json'));
const { chromium, expect } = require('@playwright/test');
const { layoutFindings } = await import(pathToFileURL(resolve(root, 'apps/web/tools/layout-findings.mjs')));
const provenance = JSON.parse(readFileSync('/Users/bao/taskbar-hero-ui-ledger/reports/ui/logs/axe-tool-provenance.json', 'utf8'));
const axe = readFileSync(provenance.path, 'utf8');
if (createHash('sha256').update(axe).digest('hex') !== provenance.scriptSha256) throw new Error('Axe provenance mismatch');
mkdirSync(out, { recursive: true });
const report = { at: new Date().toISOString(), url, root, cases: [] };
const save = () => writeFileSync(resolve(out, 'wallet.json'), JSON.stringify(report, null, 2) + '\n');
const browser = await chromium.launch();
try {
 for (const width of [1280, 1600]) for (const state of ['landing', 'home']) {
  const page = await browser.newPage({ viewport: { width, height: width === 1280 ? 720 : 900 } });
  const result = { width, state, requests: 0, signatureRequests: 0, consoleErrors: [], pageErrors: [] }; report.cases.push(result);save();
  page.on('pageerror', error => result.pageErrors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error' && !msg.location().url.endsWith('/auth-nonce')) result.consoleErrors.push(msg.text()); });
  await page.addInitScript(() => {
   localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
   const listeners = {};
   window.__walletAudit = { signRequests: 0 };
   window.ethereum = {
    isMetaMask: true,
    on: (event, callback) => { (listeners[event] ??= []).push(callback); },
    removeListener: (event, callback) => { listeners[event] = (listeners[event] ?? []).filter(x => x !== callback); },
    request: async ({ method }) => {
     if (method === 'eth_accounts' || method === 'eth_requestAccounts') return ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8'];
     if (method === 'eth_chainId') return '0xa869';
     if (method === 'wallet_requestPermissions' || method === 'wallet_getPermissions') return [{ parentCapability: 'eth_accounts' }];
     if (method === 'personal_sign' || method === 'eth_sign' || method.startsWith('eth_send')) { window.__walletAudit.signRequests++; throw new Error('No signing/transactions allowed in audit'); }
     throw new Error('Unexpected synthetic wallet method: ' + method);
    },
   };
  });
  await page.route('**/functions/v1/auth-nonce', route => { result.requests++; return route.fulfill({ status: 502, contentType: 'text/plain', headers: { 'access-control-allow-origin': '*' }, body: 'Bad Gateway' }); });
  await page.goto(url + '/#landing');
  if (state === 'home') {
   await page.getByTestId('landing-start').click();
   await page.getByTestId('class-picker-choose-button').click();
   await page.getByTestId('class-picker-confirm-button').click();
   await expect(page.getByTestId('home-dashboard')).toBeVisible();
  }
  const group = page.getByRole('group', { name: 'Wallet' });
  const connect = page.getByRole('button', { name: 'Connect wallet', exact: true });
  if (await connect.count()) await connect.click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const message = page.getByText('Wallet sign-in is temporarily unavailable, guest play still works.', { exact: true });
  await expect(message).toBeVisible();
  await expect(group).toBeVisible();
  result.message = await message.textContent();
  result.layout = await page.evaluate(layoutFindings);
  result.clipping = await message.evaluate(element => { const r = element.getBoundingClientRect(); return { scroll: element.scrollWidth > element.clientWidth + 1, x: r.x, y: r.y, right: r.right, bottom: r.bottom, viewport: { width: innerWidth, height: innerHeight } }; });
  await page.evaluate(axe);
  result.axe = await page.evaluate(async () => { const a = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }); return { violations: a.violations, incomplete: a.incomplete.map(x => x.id) }; });
  result.signatureRequests = await page.evaluate(() => window.__walletAudit.signRequests);
  result.sessionWritten = await page.evaluate(() => sessionStorage.getItem('taskbar-hero.session') !== null);
  await page.screenshot({ path: resolve(out, `nonce-502-${state}-${width}.png`) });save();
  await page.close();
 }
 report.complete = true;save();
} finally { await browser.close();save(); }
console.log(JSON.stringify(report.cases.map(row => ({ width: row.width, state: row.state, requests: row.requests, clipping: row.clipping, layout: row.layout, violations: row.axe?.violations.map(x => x.id), errors: row.consoleErrors }))));
