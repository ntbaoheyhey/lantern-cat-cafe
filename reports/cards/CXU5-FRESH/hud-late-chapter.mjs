import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
const root = '/private/tmp/tbh-t008-cxu5';
const out = '/private/tmp/tbh-t001-ledger/reports/cards/CXU5-FRESH/hud-late-chapter';
const { chromium, expect } = createRequire(root + '/apps/web/package.json')('@playwright/test');
const { createServer } = await import(pathToFileURL(root + '/apps/web/node_modules/vite/dist/node/index.js'));
Object.assign(process.env, { VITE_GAME_V2: '1', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' });
const server = await createServer({ root: root + '/apps/web', envDir: false, server: { port: 4760, strictPort: true } });
await mkdir(out, { recursive: true });
let browser;
const results = [];
try {
  await server.listen(); browser = await chromium.launch({ headless: true });
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); const errors = [];
    await page.clock.install({ time: Date.now() });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('http://localhost:4760/');
    await page.evaluate(async () => {
      const { mockV2SaveJson } = await import('/src/api/mockV2Fixtures.ts');
      const { MOCK_V2_STORAGE_KEY } = await import('/src/api/MockGameApiV2.ts');
      const save = JSON.parse(mockV2SaveJson('bossReadyStrong', { nowMs: Date.now(), chapter: 5 }));
      for (let i = 1; i < 5; i++) save.state.bossClears[i] = { wins: 1 };
      save.state.stacks.catKey = 3;
      localStorage.setItem(MOCK_V2_STORAGE_KEY, JSON.stringify(save));
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    });
    await page.reload(); await page.getByRole('tab', { name: 'Map', exact: true }).click();
    await page.evaluate(() => document.fonts.ready);
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /^(Fight|Rematch)$/ }).click();
      await expect(page.getByText(/^(Victory!|Defeat\. Your key was kept\.)$/)).toBeVisible();
      const dialog = page.getByRole('dialog');
      if (await dialog.count()) await dialog.getByRole('button').last().click();
      else await page.getByRole('button', { name: 'Back to exploring', exact: true }).click();
      await expect(page.getByRole('region', { name: 'Past runs' }).getByRole('listitem')).toHaveCount(i + 1);
      if (i < 2) await page.clock.fastForward(61_000);
    }
    await expect(page.getByRole('button', { name: /^(Fight|Rematch)$/ })).toBeInViewport();
    await page.screenshot({ path: out + '/' + viewport.width + '.png' });
    const bounds = await page.locator('.boss-map-sidebar').evaluate(el => ({ bottom: el.getBoundingClientRect().bottom, height: innerHeight, scrollHeight: document.documentElement.scrollHeight }));
    const hud = await page.locator('.shell-hud').evaluate(el => Object.fromEntries(['.hud-left','.hud-right','.hud-power-chip','.v2-sync-status-slot','.hud-wallet-slot'].map(selector => { const r = el.querySelector(selector).getBoundingClientRect(); return [selector, {left:r.left,right:r.right,top:r.top,bottom:r.bottom}]; })));
    const result = { viewport, bounds, hud, errors, runs: await page.getByRole('region', { name: 'Past runs' }).innerText() };
    results.push(result); await writeFile(out + '/results.json', JSON.stringify(results, null, 2));
    console.log(JSON.stringify(result));
    assert.ok(hud['.hud-power-chip'].right <= hud['.v2-sync-status-slot'].left, 'Power overlaps sync status'); assert.ok(bounds.bottom <= bounds.height); assert.equal(bounds.scrollHeight, bounds.height); assert.deepEqual(errors, []);
    await ctx.close();
  }
} finally { await browser?.close(); await server.close(); }
