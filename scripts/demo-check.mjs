// Reproducible browser proof for the dedicated offline build, never a live service.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium, expect } = createRequire(resolve(root, 'apps/web/package.json'))('@playwright/test');
const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const base = option('--url', 'http://localhost:5199');
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname)) throw new Error('Demo checks allow loopback URLs only');
const out = resolve(option('--out', resolve(root, 'reports/demo/browser')));
const shots = args.includes('--shots') ? resolve(root, 'docs/demo/shots') : null;
mkdirSync(out, { recursive: true });
if (shots) mkdirSync(shots, { recursive: true });
const receipt = { startedAt: new Date().toISOString(), head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), base, deviceScaleFactor: 2, checks: [], screenshots: [], errors: [], externalRequests: [], walletRequests: 0 };
const saveKey = 'taskbar-hero:offline-candidate:1eefc3e:taskbar-hero:v2-demo:1';
const browser = await chromium.launch();
async function check(name, fn) {
  const start = performance.now();
  try { await fn(); receipt.checks.push({ name, status: 'PASS', ms: Math.round(performance.now() - start) }); console.log(`PASS ${name}`); }
  catch (error) { receipt.checks.push({ name, status: 'FAIL', message: error.message }); throw error; }
}
async function shot(page, name) {
  if (!shots) return;
  const bytes = await page.screenshot({ path: resolve(shots, `${name}.png`), animations: 'disabled' });
  const hotspots = [];
  for (const [id, to] of [['home', 0], ['bag', 1], ['forge', 2], ['map', 3], ['market', 4], ['help', 5]]) {
    const box = await page.getByTestId(`nav-${id}`).boundingBox();
    if (!box) throw new Error(`Missing capture hotspot: ${id}`);
    hotspots.push({ to, ...box });
  }
  receipt.screenshots.push({ file: `${name}.png`, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), viewport: page.viewportSize(), hotspots });
}
try {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
    const tag = `${viewport.width}x${viewport.height}`;
    const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && !['data:', 'blob:'].includes(url.protocol)) {
        receipt.externalRequests.push(url.href); return route.abort();
      }
      return route.continue();
    });
    await context.addInitScript(() => {
      // Mimic offline networking while permitting the local asset server.
      Object.defineProperty(navigator, 'onLine', { get: () => false });
      window.__demoWalletRequests = 0;
      window.ethereum = { isMetaMask: true, request: async () => { window.__demoWalletRequests++; throw new Error('Wallet must never be used'); }, on() {}, removeListener() {} };
      sessionStorage.setItem('taskbar-hero.session', JSON.stringify({ token: 'offline-test-only', playerId: 'ignored', wallet: '0x1111111111111111111111111111111111111111', expiresAt: Date.now() + 3600000 }));
      localStorage.setItem('taskbar-hero:v2-demo:1', 'legacy-save-must-not-change');
    });
    const page = await context.newPage();
    page.on('pageerror', error => receipt.errors.push(`${tag}: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') receipt.errors.push(`${tag}: ${message.text()}`); });
    await page.goto(base);
    await check(`${tag}: candidate identity and isolated guest`, async () => {
      await expect(page.getByLabel('Offline candidate demo')).toContainText('Candidate build (stack tip 1eefc3e), not live.');
      await expect(page.getByText('Offline guest · wallet disabled', { exact: true })).toBeVisible();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.locator('[data-sync-status]')).toHaveText('○Local');
      expect(await page.evaluate(() => localStorage.getItem('taskbar-hero:v2-demo:1'))).toBe('legacy-save-must-not-change');
    });
    const screens = [
      ['home', 'Home / Hunt', '.v2-stage canvas'], ['bag', 'Bag / Inventory', '[data-testid="bag-count"]'],
      ['forge', 'Forge', '[data-testid="craft-panel"]'], ['map', 'Boss / Map', '[aria-label="Chapter Map"]'],
      ['market', 'Market preview', '.market-gate'], ['help', 'Help', '.help-topic-list'],
    ];
    for (const [id, label, selector] of screens) {
      await check(`${tag}: ${label} renders`, async () => {
        await page.getByTestId(`nav-${id}`).click();
        await expect(page.locator(selector).first()).toBeVisible();
        await page.waitForTimeout(200);
        const geometry = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, viewportWidth: innerWidth, viewportHeight: innerHeight }));
        expect(geometry.width).toBeLessThanOrEqual(geometry.viewportWidth);
        expect(geometry.height).toBeLessThanOrEqual(geometry.viewportHeight);
      });
      if (id === 'bag') await check(`${tag}: inspect the documented Twig Sword item`, async () => {
        const item = page.getByRole('list', { name: 'Bag items' }).getByRole('button').first();
        await expect(item).toHaveAccessibleName(/Twig Sword/);
        await item.click();
        await expect(page.getByRole('region', { name: 'Item detail', exact: true }).getByRole('heading', { name: 'Twig Sword', exact: true })).toBeVisible();
      });
      if (viewport.width === 1440 || id === 'home') await shot(page, `${id === 'map' ? 'boss' : id}-${tag}`);
    }
    await check(`${tag}: documented Guide search finds Forge`, async () => {
      await page.getByRole('tab', { name: 'Guide', exact: true }).click();
      await page.getByRole('searchbox', { name: 'Search help' }).fill('Forge');
      await page.getByRole('complementary', { name: 'Help topics' }).getByRole('button', { name: 'Forge' }).click();
      await expect(page.getByRole('heading', { name: 'Forge', exact: true })).toBeVisible();
    });
    await check(`${tag}: offline chain reference and default-off previews`, async () => {
      await expect(page.getByRole('tab', { name: 'Feature samples', exact: true })).toHaveCount(0);
      await page.getByRole('tab', { name: 'On-chain proof', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Avalanche Fuji reference · offline' })).toBeVisible();
      await expect(page.getByText('0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D', { exact: true })).toBeVisible();
      await expect(page.getByText('0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Refresh proof' })).toHaveCount(0);
    });
    if (viewport.width === 1440) await shot(page, `proof-${tag}`);
    await check(`${tag}: crafting spends only local sample materials`, async () => {
      await page.getByTestId('nav-forge').click();
      await page.getByTestId('tab-craft').click();
      const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).state, saveKey);
      await page.getByRole('button', { name: 'Craft Common Weapon (Sword)', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm Craft', exact: true }).click();
      await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)).state.items.length, saveKey)).toBe(before.items.length + 1);
      expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).state.stacks.fish, saveKey)).toBeLessThan(before.stacks.fish);
    });
    await check(`${tag}: boss sample resolves using local rules`, async () => {
      await page.getByLabel('Demo scenario').selectOption('boss');
      await expect(page.getByRole('button', { name: 'Fight', exact: true })).toBeEnabled();
      await page.getByRole('button', { name: 'Fight', exact: true }).click();
      await expect(page.locator('.boss-arena canvas')).toBeVisible();
      await page.getByRole('button', { name: 'Skip fight' }).click();
      await expect(page.getByText('Victory!', { exact: true })).toBeVisible();
      expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).state.chapter, saveKey)).toBe(2);
    });
    // Leave any victory modal before the scenario toolbar is used again.
    await page.reload();
    await check(`${tag}: fresh guest chooses a class`, async () => {
      await page.getByLabel('Demo scenario').selectOption('fresh');
      await page.getByRole('button', { name: 'Play as guest', exact: true }).click();
      await page.getByRole('button', { name: 'Start Adventure as Warrior', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm', exact: true }).click();
      await expect(page.locator('.v2-stage canvas')).toBeVisible();
      await expect(page.getByLabel('Offline candidate demo')).toContainText('Guest progress');
    });
    if (viewport.width === 1280) await check(`${tag}: natural first reward without clock changes`, async () => {
      const start = performance.now();
      const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).state.stacks.fish ?? 0, saveKey);
      await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)).state.stacks.fish ?? 0, saveKey), { timeout: 36000, intervals: [500] }).toBeGreaterThan(before);
      receipt.firstRewardMs = Math.round(performance.now() - start);
    });
    await check(`${tag}: no wallet calls, no external requests, no console errors`, async () => {
      receipt.walletRequests += await page.evaluate(() => window.__demoWalletRequests);
      expect(receipt.walletRequests).toBe(0);
      expect(receipt.externalRequests).toEqual([]);
      expect(receipt.errors).toEqual([]);
    });
    await context.close();
  }
} catch (error) { console.error(error); process.exitCode = 1; }
finally {
  await browser.close();
  receipt.completedAt = new Date().toISOString();
  receipt.pass = process.exitCode !== 1;
  writeFileSync(resolve(out, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  if (shots && receipt.pass) writeFileSync(resolve(shots, 'manifest.json'), JSON.stringify({ head: receipt.head, source: 'pnpm demo; real Playwright captures; labeled local fixtures', deviceScaleFactor: 2, screenshots: receipt.screenshots }, null, 2) + '\n');
  console.log(`${receipt.checks.filter(item => item.status === 'PASS').length}/${receipt.checks.length} checks passed; ${receipt.screenshots.length} captures; receipt: ${resolve(out, 'receipt.json')}`);
}
