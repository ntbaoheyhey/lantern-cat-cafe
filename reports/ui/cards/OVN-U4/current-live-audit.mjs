import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = '/Users/bao/taskbar-hero-single';
const out = resolve('/Users/bao/taskbar-hero-ui-ledger/reports/ui/cards/OVN-U4/current-live');
const require = createRequire(resolve(root, 'apps/web/package.json'));
const { chromium, expect } = require('@playwright/test');
const axeProof = JSON.parse(readFileSync('/Users/bao/taskbar-hero-ui-ledger/reports/ui/logs/axe-tool-provenance.json', 'utf8'));
const axe = readFileSync(axeProof.path, 'utf8');
const site = 'https://taskbarhero-eight.vercel.app';
mkdirSync(out, { recursive: true });
const report = { site, at: new Date().toISOString(), methodology: 'fresh isolated Chromium profiles; real clock; no fixture save or manual claim for first reward; guest persistence reused in a second profile; no wallet signature/transaction; nonce endpoint never probed by this audit', runs: [], defects: [] };
const save = () => writeFileSync(resolve(out, 'audit.json'), JSON.stringify(report, null, 2) + '\n');
const browser = await chromium.launch();
try {
 for (const width of [1280, 1600]) {
  const viewport = { width, height: width === 1280 ? 720 : 900 };
  const context = await browser.newContext({ viewport });
  await context.route('**/*', async route => {
    const request = route.request();
    if (['GET','HEAD','OPTIONS'].includes(request.method())) return route.continue();
    let body; try { body = request.postDataJSON(); } catch {}
    const methods = (Array.isArray(body) ? body : [body]).map(x => x?.method);
    if (new URL(request.url()).origin === 'https://api.avax-test.network' && methods.every(x => ['eth_chainId','eth_call','eth_blockNumber','eth_getCode','eth_getBalance','eth_getLogs'].includes(x))) return route.continue();
    return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  const row = { width, errors: [], rpcReads: [], otherPosts: [], screens: [], timings: {}, checks: [] }; report.runs.push(row); save();
  page.on('pageerror', error => row.errors.push(error.message));
  let phase = 'product';
  page.on('console', message => { if (message.type() === 'error') row.errors.push({ phase, text: message.text(), location: message.location().url }); });
  page.on('request', request => {
   if (['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return;
   const u = new URL(request.url());
   let body; try { body = request.postDataJSON(); } catch {}
   const methods = (Array.isArray(body) ? body : [body]).map(x => x?.method);
   const readOnly = u.origin === 'https://api.avax-test.network' && methods.every(x => ['eth_chainId','eth_call','eth_blockNumber','eth_getCode','eth_getBalance','eth_getLogs'].includes(x));
   (readOnly ? row.rpcReads : row.otherPosts).push({ method: request.method(), origin: u.origin, path: u.pathname, rpcMethods: methods });
  });
  async function capture(name) {
   await page.evaluate(() => document.fonts.ready);
   const overflow = await page.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight }));
   const screenshot = `${name}-${width}.png`;
   await page.screenshot({ path: resolve(out, screenshot) });
   row.screens.push({ name, screenshot, overflow });
   if (overflow.x || overflow.y) report.defects.push({ severity: 'medium', width, state: name, description: 'Document overflow', screenshot });
   save();
  }
  await page.goto(site + '/#landing');
  await page.getByRole('button', { name: 'Start playing', exact: true }).click();
  await expect(page.getByTestId('landing-hero')).toBeVisible();
  const html = await (await page.request.get(site)).text();
  row.liveAssets = [...html.matchAll(/(?:src|href)="([^"<>]*\/assets\/[^"<>]+)"/g)].map(match => match[1]);
  await capture('landing');
  const start = performance.now();
  await page.getByTestId('landing-start').click();
  await expect(page.getByTestId('class-picker')).toBeVisible();
  await capture('class');
  await page.getByTestId('class-picker-choose-button').click();
  await page.getByTestId('class-picker-confirm-button').click();
  await expect(page.getByTestId('home-dashboard')).toBeVisible();
  row.timings.homeSeconds = (performance.now() - start) / 1000;
  const before = await page.getByTestId('hud-gold').textContent();
  await expect(page.getByTestId('hud-gold')).not.toHaveText(before, { timeout: 36_000 });
  row.timings.firstNaturalRewardSeconds = (performance.now() - start) / 1000;
  row.timings.target36Seconds = row.timings.firstNaturalRewardSeconds <= 36;
  if (!row.timings.target36Seconds) report.defects.push({ severity: 'medium', width, state: 'first-reward', description: 'First natural reward exceeded 36 seconds' });
  await capture('first-reward');
  phase = 'axe';
  await page.evaluate(axe);
  const contrast = await page.evaluate(async () => { const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }); return { violations: result.violations, incomplete: result.incomplete.map(row => ({ id: row.id, targets: row.nodes.map(n => n.target) })) }; });
  phase = 'product';
  row.axe = contrast;
  for (const violation of contrast.violations) report.defects.push({ severity: 'medium', width, state: 'first-reward', description: violation.id, targets: violation.nodes.map(node => node.target), screenshot: `first-reward-${width}.png` });
  for (const name of ['home', 'bag', 'map', 'forge', 'market', 'hero', 'help']) {
   await page.getByTestId('nav-' + name).click();
   await expect(page.getByTestId('nav-' + name)).toHaveAttribute('aria-selected', 'true');
   await capture(name);
   if (name === 'forge') for (const tab of ['salvage', 'relic', 'craft']) { await page.getByTestId('tab-' + tab).click(); await capture('forge-' + tab); }
  }
  await page.getByRole('tab', { name: 'On-chain proof', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Avalanche Fuji on-chain proof' })).toBeVisible();
  await page.waitForTimeout(1500); await capture('chain-proof');
  await context.setOffline(true); await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await capture('offline');
  row.checks.push({ name: 'offline text', passed: await page.getByText(/offline/i).first().isVisible() });
  await context.setOffline(false); await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.getByTestId('nav-home').click();
  const storage = await context.storageState();
  const returning = await browser.newContext({ viewport, storageState: storage });
  const rp = await returning.newPage();
  await rp.goto(site + '/#hero');
  await expect(rp.getByRole('region', { name: 'Character' })).toBeVisible();
  await rp.evaluate(() => { location.hash = 'landing'; });
  await expect(rp.getByTestId('landing-hero')).toBeVisible();
  await rp.getByTestId('landing-start').click();
  await expect(rp.getByTestId('home-dashboard')).toBeVisible();
  await rp.screenshot({ path: resolve(out, `returning-guest-${width}.png`) });
  row.checks.push({ name: 'saved guest Hero -> Landing -> guest -> Home', passed: true });
  row.checks.push({ name: 'no mutating requests', passed: row.otherPosts.length === 0 });
  row.checks.push({ name: 'product console/page errors', passed: row.errors.every(error => error.phase === 'axe') });
  save(); await returning.close(); await context.close();
 }
 report.complete = true; save();
} finally { await browser.close(); save(); }
console.log(JSON.stringify({ complete: report.complete, runs: report.runs.map(row => ({ width: row.width, timings: row.timings, checks: row.checks, errors: row.errors, rpcReads: row.rpcReads, otherPosts: row.otherPosts })), defects: report.defects }));
