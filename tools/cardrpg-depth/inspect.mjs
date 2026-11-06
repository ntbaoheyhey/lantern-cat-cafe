import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const errors = [];
await mkdir('reports/cardrpg-depth/browser', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  await page.goto('file://' + resolve('docs/cardrpg2/index.html'));
  await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
  await page.screenshot({ path: 'reports/cardrpg-depth/browser/first-hub.png' });
  await page.getByRole('button', { name: 'Try the practice table' }).click();
  await page.waitForFunction(() => window.__depthScene?.ready || window.__depthReview?.sceneError);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'reports/cardrpg-depth/browser/first-battle.png' });
  console.log(JSON.stringify({ errors, scene: await page.evaluate(() => ({ error: window.__depthReview.sceneError, ready: window.__depthScene?.ready, actors: window.__depthReview.battle.actors.length, stats: window.__depthScene?.stats })) }));
} finally { await browser.close(); await writeFile('reports/cardrpg-depth/browser/first-errors.json', JSON.stringify(errors)); }
