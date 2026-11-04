// Read-only browser release smoke. Fresh local guest state only; no wallet/signature.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const [checkout, site, output, rewardMode] = process.argv.slice(2);
const address = new URL(site);
assert.ok(address.origin === 'https://taskbarhero-eight.vercel.app' ||
  (['localhost', '127.0.0.1'].includes(address.hostname) && Number(address.port) >= 5300 && Number(address.port) <= 5399));
const { chromium, expect } = createRequire(resolve(checkout, 'apps/web/package.json'))('@playwright/test');
const out = resolve(output); mkdirSync(out, { recursive: true });
const report = { site: address.origin, observedAt: new Date().toISOString(), method: 'Fresh/saved guests, no signature or mutating API request', cases: [] };
const browser = await chromium.launch();
try {
  for (const width of [1280, 1600]) {
    const context = await browser.newContext({ viewport: { width, height: width * 9 / 16 } });
    const errors = [], blocked = [];
    const monitor = async ctx => {
      await ctx.route('**/*', async route => {
        const request = route.request();
        if (['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return route.continue();
        const url = new URL(request.url());
        const rpc = request.postDataJSON();
        const calls = Array.isArray(rpc) ? rpc : [rpc];
        const readMethods = new Set(['eth_chainId', 'eth_blockNumber', 'eth_getCode', 'eth_call', 'eth_getLogs', 'eth_getBlockByNumber', 'eth_getTransactionReceipt', 'eth_getBalance']);
        if (url.hostname === 'api.avax-test.network' && calls.every(call => readMethods.has(call?.method))) return route.continue();
        blocked.push(request.method() + ' ' + url.origin + url.pathname);
        return route.abort('blockedbyclient');
      });
    };
    await monitor(context);
    const page = await context.newPage();
    const recordErrors = target => {
      target.on('pageerror', error => errors.push(error.message));
      target.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    };
    recordErrors(page);
    await page.goto(address.origin + '/#landing');
    const help = page.getByRole('dialog', { name: 'How to play', exact: true });
    await expect(help).toBeVisible();
    await help.getByRole('button', { name: 'Start playing', exact: true }).click();
    await page.getByTestId('landing-start').click();
    await page.getByTestId('class-picker-choose-button').click();
    await page.getByTestId('class-picker-confirm-button').click();
    await expect(page.getByTestId('home-dashboard')).toBeVisible();
    const homeAt = Date.now();
    const row = { width, freshHome: true, errors, blocked };
    if (rewardMode === '--require-reward') {
      await expect(page.getByRole('heading', { name: 'Recent finds', exact: true })).toBeVisible({ timeout: 36000 });
      row.firstRewardSeconds = (Date.now() - homeAt) / 1000;
      assert.ok(row.firstRewardSeconds <= 36);
    }
    for (const route of ['forge', 'help', 'home']) {
      await page.getByTestId('nav-' + route).click();
      await expect(page.getByTestId('nav-' + route)).toHaveAttribute('aria-selected', 'true');
      assert.ok(await page.locator('#root').innerText());
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight), false);
    }
    await page.screenshot({ path: resolve(out, `fresh-${width}.png`) });
    const saved = await context.storageState(); await context.close();
    const returning = await browser.newContext({ viewport: { width, height: width * 9 / 16 }, storageState: saved });
    await monitor(returning);
    const again = await returning.newPage(); recordErrors(again);
    await again.goto(address.origin + '/#home');
    await expect(again.getByTestId('home-dashboard')).toBeVisible();
    await expect(again.getByTestId('class-picker')).toHaveCount(0);
    await again.screenshot({ path: resolve(out, `returning-${width}.png`) });
    row.returningHome = true;
    assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
    await returning.close(); report.cases.push(row);
  }
  report.passed = true;
} finally {
  await browser.close(); writeFileSync(resolve(out, 'receipt.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify(report));
