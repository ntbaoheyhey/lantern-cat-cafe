// Twenty naturally animated replays of one recorded encounter. Replays avoid
// economy/progression drift while exercising real result/battle transitions.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3b/index.html');
const output = process.env.BIG_LIFECYCLE_OUT || 'reports/cardrpg-big2/performance/lifecycle';
await mkdir(output, { recursive: true });
const rows = [], errors = [];
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal', '--enable-precise-memory-info'] });
const receipt = { artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
  method: 'Cold file, real Watch/Fight/speed/replay clicks; first natural fight then20x4 natural replays; no tick injection or skip. Forced GC only between fights; RAF includes GC and loading separately marked.',
  tolerance: { retainedHeapGrowthBytes: 2 * 1024 * 1024, gpuObjectsGrowth: 0 }, rows, errors };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('HeapProfiler.enable');
  page.on('pageerror', error => errors.push(String(error)));
  await page.addInitScript(() => {
    window.__b2Lifecycle = { frames: [], marks: [], last: 0 };
    requestAnimationFrame(function frame(at) {
      const d = window.__b2Lifecycle;
      if (d.last) d.frames.push({ at, ms: at - d.last });
      d.last = at; requestAnimationFrame(frame);
    });
  });
  const mark = label => page.evaluate(label => window.__b2Lifecycle.marks.push({ label, at: performance.now() }), label);
  await page.goto('file://' + artifact);
  await page.getByRole('button', { name: 'Watch a battle now', exact: true }).click();
  await page.getByLabel('Playback speed', { exact: true }).selectOption('4');
  const result = () => page.waitForFunction(() => window.__depthReview.screen === 'result', null, { timeout: 120000 });
  await result();
  await page.evaluate(() => { window.__b2RetainedScene = window.__depthScene; });
  const snapshot = async index => {
    await mark(`gc-${index}-start`); await cdp.send('HeapProfiler.collectGarbage'); await mark(`gc-${index}-end`);
    const heap = await cdp.send('Runtime.getHeapUsage');
    const scene = await page.evaluate(() => {
      const scene = window.__depthScene;
      return { at: performance.now(), stats: scene.stats, gpu: scene.renderer.info.memory,
        programs: scene.renderer.info.programs.length, retained: scene === window.__b2RetainedScene,
        result: window.__depthReview.battle.result, choices: window.__depthReview.battle.choices.length };
    });
    rows.push({ index, heap, ...scene });
    await writeFile(`${output}/summary.json`, JSON.stringify(receipt, null, 2));
    console.log(JSON.stringify({ index, heap: heap.usedSize, gpu: scene.gpu, retained: scene.retained }));
  };
  await snapshot(0);
  for (let index = 1; index <= 20; index++) {
    if (index > 1) await page.getByRole('button', { name: 'Close replay', exact: true }).click();
    await mark(`battle-${index}-start`);
    await page.getByRole('button', { name: 'Watch replay', exact: true }).click();
    await result();
    await mark(`battle-${index}-end`);
    await snapshot(index);
  }
  receipt.raw = await page.evaluate(() => window.__b2Lifecycle);
  const first = rows[0], last = rows.at(-1);
  receipt.growth = { heap: last.heap.usedSize - first.heap.usedSize,
    geometries: last.gpu.geometries - first.gpu.geometries,
    textures: last.gpu.textures - first.gpu.textures, programs: last.programs - first.programs };
  assert.deepEqual(errors, []);
  assert.ok(rows.every(row => row.retained));
  assert.ok(receipt.growth.heap <= receipt.tolerance.retainedHeapGrowthBytes);
  assert.equal(receipt.growth.geometries, 0); assert.equal(receipt.growth.textures, 0); assert.equal(receipt.growth.programs, 0);
  receipt.passed = true;
} finally {
  await browser.close();
  await writeFile(`${output}/summary.json`, JSON.stringify(receipt, null, 2));
}
