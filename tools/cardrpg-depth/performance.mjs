import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const output = process.env.DEPTH_PERF_OUT || 'reports/cardrpg-depth/performance';
const sizes = JSON.parse(process.env.DEPTH_SIZES || '[[1024,600],[1280,720],[1440,900]]');
const chapters = JSON.parse(process.env.DEPTH_CHAPTERS || '[1,2,3]');
const dpr = Number(process.env.DEPTH_DPR || 1);
await mkdir(output, { recursive: true });
const file = resolve('docs/cardrpg2/index.html');
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const rows = [], errors = [], warnings = [];
try {
  for (const [width, height] of sizes) for (const chapter of chapters) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); if (e.type() === 'warning') warnings.push(e.text()); });
    await page.addInitScript(() => {
      const data = window.__perf = { record: false, frames: [], long: [], buffers: [], contexts: 0, released: 0, last: 0 };
      const getContext = HTMLCanvasElement.prototype.getContext, seen = new WeakSet();
      HTMLCanvasElement.prototype.getContext = function (...args) {
        const result = getContext.apply(this, args);
        if (result && String(args[0]).startsWith('webgl') && !seen.has(result)) {
          seen.add(result); data.contexts++;
          const getExtension = result.getExtension.bind(result);
          result.getExtension = name => {
            const extension = getExtension(name);
            if (name === 'WEBGL_lose_context' && extension && !extension.__counted) {
              const lose = extension.loseContext.bind(extension);
              extension.loseContext = () => { data.released++; lose(); };
              extension.__counted = true;
            }
            return extension;
          };
        }
        return result;
      };
      new PerformanceObserver(list => {
        if (data.record) for (const e of list.getEntries()) data.long.push({ start: e.startTime, duration: e.duration, node: window.__depthReview.state.run?.current });
      }).observe({ type: 'longtask' });
      requestAnimationFrame(function sample(t) {
        if (data.record) {
          if (data.last) data.frames.push(t - data.last);
          const canvas = window.__depthScene?.renderer.domElement;
          if (canvas) {
            const size = `${canvas.width}x${canvas.height}`;
            if (data.buffers.at(-1)?.size !== size) data.buffers.push({ size, at: t });
          }
        }
        data.last = data.record ? t : 0;
        requestAnimationFrame(sample);
      });
    });
    await page.goto('file://' + file);
    await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
    await page.evaluate(chapter => {
      const m = window.__depthReview;
      m.state.settings.speed = 4;
      m.state.tutorial = 3;
      m.state.cleared = Array.from({ length: chapter - 1 }, (_, index) => index + 1);
      m.start(chapter);
    }, chapter);
    await page.locator('.dp-node:enabled').first().click();
    await page.waitForFunction(() => window.__depthScene?.ready && window.__depthScene.stats.frames > 2);
    await page.evaluate(() => { window.__retained = window.__depthScene; window.__perf.record = true; });
    let steps = 0, battles = 0;
    while (!await page.evaluate(() => window.__depthReview.state.run.complete)) {
      const state = await page.evaluate(() => {
        const m = window.__depthReview, r = m.state.run;
        return { battle: !!r.battle, result: r.battle?.result, canAct: m.canAct, busy: m.busy, reward: r.rewardChoices.length > 0, kind: r.nodes.find(n => n.id === r.current)?.kind };
      });
      if (state.battle) {
        if (state.result && !state.busy) { await page.getByRole('button', { name: 'Collect encounter rewards' }).click(); battles++; }
        else if (state.canAct) await page.evaluate(() => window.__depthReview.step('smart'));
        await page.waitForTimeout(30);
      } else if (state.reward) await page.locator('.dp-reward').first().click();
      else if (state.kind === 'event') await page.locator('.cr-panel .dp-three button:enabled').first().click();
      else if (state.kind === 'treasure') await page.getByRole('button', { name: 'Take 70 run points' }).click();
      else if (state.kind === 'shop') await page.getByRole('button', { name: 'Save your points and leave' }).click();
      else if (state.kind === 'campfire') await page.getByRole('button', { name: 'Heal the team · 35% HP' }).click();
      else await page.locator('.dp-node:enabled').first().click();
      if (++steps > 15000) throw Error('Natural run stalled');
    }
    const result = await page.evaluate(() => {
      const m = window.__depthReview, scene = window.__depthScene;
      const gl = scene.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
      return { won: m.state.run.won, nodes: m.state.run.visited.length, rendererRetained: scene === window.__retained, stats: scene.stats, renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) };
    });
    await page.getByRole('button', { name: 'Cafe', exact: false }).first().click();
    await page.waitForTimeout(100);
    const data = await page.evaluate(() => { window.__perf.record = false; return window.__perf; });
    const sorted = [...data.frames].sort((a, b) => a - b);
    rows.push({ width, height, dpr, chapter, battles, ...result, ...data, p95: sorted[Math.floor(sorted.length * .95)], p99: sorted[Math.floor(sorted.length * .99)] });
    console.log(JSON.stringify({ width, height, dpr, chapter, ...result, frames: data.frames.length, long: data.long, buffers: data.buffers, contexts: data.contexts, released: data.released, p95: rows.at(-1).p95, p99: rows.at(-1).p99 }));
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(`${output}/measurement.json`, JSON.stringify({ date: new Date().toISOString(), artifactSha256: createHash('sha256').update(await readFile(file)).digest('hex'), method: 'Natural x4 presentation with public smart decisions. Starter cats and equipment in each chapter, with chapter-access flags unlocked in the measurement fixture. Complete seven-node routes, all transitions and scene disposal. No animation skipping, ticks, HP edits or result changes. Measurement begins immediately after initial model warmup and includes all later transitions.', rows, errors, warnings }, null, 2));
}
assert.deepEqual(errors, []); assert.deepEqual(warnings, []);
for (const row of rows) {
  assert.equal(row.won, true); assert.equal(row.battles, 3); assert.equal(row.rendererRetained, true);
  assert.equal(row.contexts, 1); assert.equal(row.released, 1); assert.equal(row.buffers.length, 1);
  assert.equal(row.long.length, 0); assert.ok(row.p95 <= 16.81 && row.p99 <= 33.31);
}
