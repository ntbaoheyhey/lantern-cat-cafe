// Read-only UI proof for the named live site or a loopback production preview.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../../../apps/web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const base = new URL(process.argv[2] ?? 'https://taskbarhero-eight.vercel.app');
if (!['localhost', '127.0.0.1', 'taskbarhero-eight.vercel.app'].includes(base.hostname)) throw new Error('Unexpected smoke target');
const out = resolve(process.argv[3] ?? fileURLToPath(new URL('./live', import.meta.url)));
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [], blockedWrites = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.hostname.endsWith('.supabase.co') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        blockedWrites.push(`${request.method()} ${url.pathname}`);
        return route.abort();
      }
      return route.continue();
    });
    const started = Date.now();
    let failure = null;
    try {
      await page.goto(base.href, { waitUntil: 'networkidle' });
      if (process.env.SCREENSHOTS === '1') await page.screenshot({ path: resolve(out, `entry-${viewport.width}.png`), animations: 'disabled' });
      for (const name of ['Play as guest', 'Start playing']) {
        const button = page.getByRole('button', { name, exact: true });
        if (await button.isVisible()) await button.click();
      }
      const start = page.getByRole('button', { name: 'Start Adventure as Warrior', exact: true });
      if (await start.isVisible()) await start.click();
      const confirmation = page.getByRole('region', { name: 'Confirm class switch', exact: true });
      if (await confirmation.isVisible()) await confirmation.getByRole('button', { name: 'Confirm', exact: true }).click();
      await page.locator('canvas:visible').first().waitFor();
      if (process.env.SCREENSHOTS === '1') await page.screenshot({ path: resolve(out, `home-${viewport.width}.png`), animations: 'disabled' });
    } catch (error) { failure = error.message; }
    const item = {
      target: base.origin, viewport, loadAndGuestMs: Date.now() - started,
      version: await page.locator('[data-game-v2="stage-v2-enabled"]').count() ? 'v2' : 'classic',
      visibleCanvases: await page.locator('canvas:visible').count(),
      headings: await page.getByRole('heading').allTextContents(),
      errors, blockedWrites, failure,
    };
    results.push(item);
    await page.close();
  }
} finally { await browser.close(); }
writeFileSync(resolve(out, 'results.json'), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
if (results.some(result => result.failure || result.errors.length || result.blockedWrites.length || result.visibleCanvases !== 1)) process.exitCode = 1;
