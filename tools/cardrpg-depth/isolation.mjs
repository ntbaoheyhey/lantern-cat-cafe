import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { pinExistingFonts } from '../visual-support.mjs';
import assert from 'node:assert/strict';
const require = createRequire(resolve('apps/web/package.json'));
const { build } = await import(require.resolve('vite'));
Object.assign(process.env, { VITE_GAME_V2: '1', VITE_ALLOW_MOCK_AUTH: '1', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' });
const out = 'reports/cardrpg-depth/isolation';
await mkdir(out, { recursive: true });
const servers = [], rows = [], errors = [];
const roots = { before: '/Users/bao/taskbar-hero-cardrpg-int/apps/web', after: resolve('apps/web') };
try {
  for (const [name, root] of Object.entries(roots)) {
    const dist = `/tmp/cardrpg-depth-flag-${name}`;
    await build({ root, envDir: false, build: { outDir: dist, emptyOutDir: true }, logLevel: 'error' });
    const server = createServer(async (request, response) => {
      try {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        const bytes = await readFile(dist + (pathname === '/' ? '/index.html' : pathname));
        response.setHeader('Content-Type', pathname.endsWith('.js') ? 'text/javascript' : pathname.endsWith('.css') ? 'text/css' : pathname.endsWith('.woff2') ? 'font/woff2' : pathname.endsWith('.png') ? 'image/png' : 'text/html');
        response.end(bytes);
      } catch { response.statusCode = 404; response.end(); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    servers.push({ name, server, port: server.address().port });
  }
  const browser = await chromium.launch();
  try {
    for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
      const captures = [];
      for (const { name, port } of servers) {
        const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
        page.on('pageerror', e => errors.push(String(e)));
        await pinExistingFonts(page);
        await page.addInitScript(() => { let seed = 123; Math.random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296); });
        await page.clock.install({ time: new Date('2026-11-06T12:00:00Z') });
        await page.clock.pauseAt(new Date('2026-11-06T12:00:00Z'));
        await page.goto(`http://127.0.0.1:${port}/?demo&coach=off#home`);
        await page.waitForTimeout(1200);
        await page.clock.runFor(1800);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('.dp-app,.cr-app,.t3-shell').count(), 0);
        const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name));
        assert.deepEqual(resources.filter(url => /cardrpg|turn3d|\.glb/.test(url)), []);
        captures.push(await page.screenshot({ path: `${out}/${width}-${name}.png` }));
        await page.close();
      }
      rows.push({ width, height, pixelIdentical: captures[0].equals(captures[1]) });
    }
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${servers[1].port}/?demo&cardrpg2=1`);
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('.dp-app').count(), 0);
    await page.close();
  } finally { await browser.close(); }
} finally {
  for (const { server } of servers) await new Promise(resolve => server.close(resolve));
  await writeFile(`${out}/check.json`, JSON.stringify({ date: new Date().toISOString(), base: '7ff71ff69bd271c554ec4f407e1cb7fefbef8099', method: 'Production builds, fresh identical seeded contexts, pinned fonts and clocks, reduced motion, all flags off. PNG byte equality and lazy-resource absence.', rows, errors }, null, 2));
}
assert.deepEqual(errors, []); assert.ok(rows.length === 3 && rows.every(r => r.pixelIdentical));
console.log(JSON.stringify(rows));
