// Measures live eight-enemy presentation callbacks separately from browser RAF cadence.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, root } from './visual-support.mjs';
const base = process.env.SQUAD_URL ?? 'http://127.0.0.1:5392';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local previews only');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let sceneUrl;
  page.on('request', request => { if (request.url().includes('/src/squad/SquadScene.ts')) sceneUrl = request.url(); });
  await page.route('**/*', route => ['127.0.0.1', 'localhost', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.goto(`${base}/?demo&coach=off#squad`);
  await page.locator('.squad-canvas canvas').waitFor();
  assert(sceneUrl, 'Squad scene module must be loaded');
  await page.evaluate(async moduleUrl => {
    // Use the module actually loaded by Vite, including its current HMR timestamp.
    const { SquadScene } = await import(moduleUrl);
    const update = SquadScene.prototype.update;
    const profile = window.squadProfile = { updateMs: [], renderMs: [], frameMs: [], maxEnemies: 0, started: performance.now() };
    let attached = false, renderStart = 0, lastFrame = 0;
    SquadScene.prototype.update = function (...args) {
      if (!attached) {
        attached = true;
        this.sys.game.events.on('prerender', () => { renderStart = performance.now(); });
        this.sys.game.events.on('postrender', () => { profile.renderMs.push(performance.now() - renderStart); });
      }
      const start = performance.now();
      if (lastFrame) profile.frameMs.push(start - lastFrame);
      lastFrame = start;
      profile.maxEnemies = Math.max(profile.maxEnemies, this.bridge.read().battle.actors.filter(a => a.side === 'enemy' && a.hp > 0).length);
      update.apply(this, args);
      profile.updateMs.push(performance.now() - start);
    };
  }, sceneUrl);
  // Phaser stores sceneUpdate during boot, so recreate the canvas after instrumentation.
  await page.evaluate(() => { window.location.hash = 'home'; });
  await page.locator('.squad-canvas canvas').waitFor({ state: 'detached' });
  await page.evaluate(() => { window.location.hash = 'squad'; });
  await page.locator('.squad-canvas canvas').waitFor();
  await page.getByLabel('Encounter', { exact: true }).selectOption('crowd');
  await page.getByRole('button', { name: 'Begin patrol', exact: true }).click();
  await page.waitForTimeout(6000);
  const report = await page.evaluate(() => {
    const p = window.squadProfile;
    const summarize = values => {
      const sorted = [...values].sort((a, b) => a - b);
      return { samples: sorted.length, meanMs: values.reduce((n, x) => n + x, 0) / values.length, p95Ms: sorted[Math.floor(sorted.length * .95)], maxMs: sorted.at(-1) };
    };
    return { viewport: '1440x900', maxEnemies: p.maxEnemies, sampleMs: performance.now() - p.started, sceneUpdate: summarize(p.updateMs), canvasRender: summarize(p.renderMs), sceneFrameInterval: summarize(p.frameMs), note: 'Headless Chromium on this host, 30 FPS presenter target. CPU callback wall time and Phaser render event interval; excludes GPU/compositor work and battery consumption. Not a player usability or endurance test.' };
  });
  assert.equal(report.maxEnemies, 8); assert(report.sceneUpdate.samples > 100); assert(report.canvasRender.samples > 100);
  const out = resolve(root, 'reports/squad-combat'); mkdirSync(out, { recursive: true });
  writeFileSync(resolve(out, 'renderer-profile.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
