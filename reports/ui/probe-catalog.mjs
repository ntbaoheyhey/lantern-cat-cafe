import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
const root = process.cwd(), web = resolve(root, 'apps/web');
const require = createRequire(resolve(web, 'package.json'));
const { preview } = require('vite');
const { chromium, expect } = require('@playwright/test');
const out = resolve(root, 'screenshots/ui-2026-11-03/catalog-diagnostic-rare'); mkdirSync(out, { recursive: true });
const server = await preview({ root: web, envDir: false, build: { outDir: 'dist-v2/catalog-diagnostic-1e31e37' }, preview: { port: 5362, strictPort: true } });
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('taskbar-hero.howToPlaySeen', '1'));
  await page.goto('http://localhost:5362/#landing');
  await page.getByTestId('landing-start').click();
  await expect(page.getByTestId('class-picker')).toBeVisible();
  await page.getByTestId('class-picker-choose-button').click();
  if (await page.getByTestId('class-picker-confirm-button').isVisible()) await page.getByTestId('class-picker-confirm-button').click();
  await page.getByRole('tab', { name: 'Help', exact: true }).click();
  await page.getByRole('tab', { name: 'Catalog preview', exact: true }).click();
  await page.getByRole('switch', { name: 'Catalog preview' }).click();
  await page.getByLabel('Preview quality', { exact: true }).selectOption('rare');
  await page.getByLabel('Preview item level', { exact: true }).selectOption('6');
  await page.evaluate(() => document.fonts.ready);
  const details = await page.locator('[data-original-art]').evaluateAll(async nodes => {
    await Promise.all(nodes.map(async node => { const img = new Image(); img.src = getComputedStyle(node).backgroundImage.slice(5, -2); await img.decode(); }));
    return nodes.map(node => { const s = getComputedStyle(node), b = node.getBoundingClientRect(); return {
      id: node.dataset.originalArt, width: b.width, height: b.height, x: b.x, y: b.y,
      image: s.backgroundImage, position: s.backgroundPosition, size: s.backgroundSize,
      opacity: s.opacity, visibility: s.visibility, display: s.display, clip: s.clipPath,
    }; });
  });
  await page.screenshot({ path: resolve(out, 'loaded-catalog.png') });
  await page.locator('[data-original-art]').first().screenshot({ path: resolve(out, 'first-icon.png') });
  await page.locator('.original-framed-art [data-original-art]').screenshot({ path: resolve(out, 'selected-icon.png') });
  writeFileSync(resolve(out, 'computed.json'), JSON.stringify(details, null, 2) + '\n');
  console.log(JSON.stringify(details.slice(0, 2), null, 2));
} finally { await browser?.close(); await new Promise(done => server.httpServer.close(done)); }
