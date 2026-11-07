// Run against an explicitly started local VITE_GAME_V2=1 server. No account fixtures or grants.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, root, requireWeb, web } from './visual-support.mjs';
const base = process.env.SQUAD_URL ?? 'http://127.0.0.1:5392';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Local previews only');
const out = resolve(root, 'reports/squad-combat'); mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const report = { viewports: [], errors: [], writes: [], replay: null, frameCadence: null };
async function pageAt(width, height, clock = true) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('request', r => { if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method())) report.writes.push(`${r.method()} ${r.url()}`); });
  await page.route('**/*', r => ['127.0.0.1', 'localhost', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.abort());
  if (clock) await page.clock.install({ time: new Date('2026-11-05T04:00:00Z') });
  await page.goto(`${base}/?demo&coach=off#squad`);
  await page.locator('.squad-canvas canvas').waitFor(); await page.evaluate(() => document.fonts.ready);
  if (clock) await page.clock.pauseAt(new Date('2026-11-05T04:00:10Z'));
  return page;
}
try {
  for (const [width, height] of [[1280, 720], [1440, 900], [1920, 1080]]) {
    const page = await pageAt(width, height);
    await page.getByLabel('Encounter', { exact: true }).selectOption('crowd');
    await page.clock.runFor(100);
    assert.equal(await page.locator('.squad-targets button').count(), 8);
    const bounds = await page.locator('.squad-ultimate').evaluateAll(els => els.map(el => { const r = el.getBoundingClientRect(); return { x: r.x, right: r.right, top: r.top, bottom: r.bottom }; }));
    assert(bounds.every(r => r.top >= 0 && r.bottom <= height && r.x >= 0 && r.right <= width), `Ultimate clipping at ${width}`);
    const overflow = await page.locator('.screen-squad').evaluate(el => el.scrollWidth > el.clientWidth);
    assert.equal(overflow, false);
    await page.screenshot({ path: resolve(out, `crowd-ready-${width}.png`) });
    await page.getByRole('button', { name: 'Begin patrol', exact: true }).click();
    await page.clock.runFor(4200);
    await page.screenshot({ path: resolve(out, `crowd-combat-${width}.png`) });
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const pausedText = await page.locator('.squad-arena-top').innerText();
    await page.clock.runFor(2000); assert.equal(await page.locator('.squad-arena-top').innerText(), pausedText);
    await page.getByRole('button', { name: 'Compact view' }).click();
    assert.equal(await page.locator('.squad-arena-top').innerText(), pausedText);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.clock.runFor(100);
    await page.screenshot({ path: resolve(out, `compact-reduced-${width}.png`) });
    report.viewports.push({ width, height, ultimates: bounds, horizontalOverflow: overflow, enemies: 8, pausePreserved: true });
    await page.close();
  }
  const page = await pageAt(1280, 720);
  await page.getByRole('button', { name: 'Begin patrol', exact: true }).click();
  await page.clock.runFor(120000);
  assert.equal(await page.getByTestId('squad-adventure').getAttribute('data-phase'), 'won');
  await page.getByRole('region', { name: 'Encounter result' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(out, 'full-patrol-result.png') });
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save battle replay' }).click();
  await (await downloaded).saveAs(resolve(out, 'browser-replay.json'));
  const { createServer } = await import(requireWeb.resolve('vite'));
  const vite = await createServer({ configFile: false, root: web, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
  try {
    const { replayBattle } = await vite.ssrLoadModule('../../packages/game-rules/src/squad/battle.ts');
    const replay = JSON.parse(readFileSync(resolve(out, 'browser-replay.json'), 'utf8'));
    const state = replayBattle(replay);
    assert.equal(state.phase, 'won'); assert.equal(state.settlements.length, 4);
    report.replay = { ticks: state.tick, seconds: state.tick / 20, outcome: state.phase, score: state.settlements.reduce((n, s) => n + s.budget, 0), skills: [...new Set(state.events.filter(e => e.type === 'cast').map(e => e.skill))], passives: [...new Set(state.events.filter(e => e.type === 'passive').map(e => e.text))] };
  } finally { await vite.close(); }
  await page.close();
  const real = await pageAt(1440, 900, false);
  await real.getByLabel('Encounter', { exact: true }).selectOption('boss');
  await real.getByRole('button', { name: 'Begin patrol', exact: true }).click();
  await real.waitForTimeout(1800);
  await real.screenshot({ path: resolve(out, 'yarn-sweep-1440.png') });
  report.frameCadence = await real.evaluate(() => new Promise(resolve => {
    const deltas = []; let last = performance.now(), start = last;
    function frame(t) { deltas.push(t - last); last = t; if (t - start < 5000) requestAnimationFrame(frame); else { deltas.sort((a, b) => a - b); resolve({ sampleMs: t - start, frames: deltas.length, p95Ms: deltas[Math.floor(deltas.length * .95)], maxMs: deltas.at(-1), note: 'Browser RAF cadence during live boss combat; not isolated renderer CPU or battery consumption.' }); } }
    requestAnimationFrame(frame);
  }));
  await real.close();
  assert.deepEqual(report.errors, []); assert.deepEqual(report.writes, []);
  writeFileSync(resolve(out, 'browser-check.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
