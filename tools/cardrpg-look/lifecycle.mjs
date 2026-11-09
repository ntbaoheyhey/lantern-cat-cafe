// Twenty naturally animated replays of one recorded encounter. Replays avoid
// economy/progression drift while exercising real result/battle transitions.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { withTimingLock } from './lock.mjs';
if (!process.env.BIG_ARTIFACT || !process.env.BIG_LIFECYCLE_OUT) throw Error('Explicit LOOK lifecycle artifact/output required');
const artifact = resolve(process.env.BIG_ARTIFACT);
const output = process.env.BIG_LIFECYCLE_OUT;
await mkdir(output, { recursive: true });
const rows = [], errors = [], rawWindows = [];
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal', '--enable-precise-memory-info'] });
const receipt = { artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
  method: 'Cold file, real Watch/Fight/speed/replay clicks; first natural fight then20 natural replays at4x speed; four replays per shared-lock window with the same retained scene; no tick injection or skip. Forced GC only between fights; raw samples are drained before each GC/heap snapshot to avoid measuring the recorder as an application leak. No frame sampling or scene rendering while waiting for another lane; existing scene/resources stay retained.',
  rawWindows,
  tolerance: { retainedHeapGrowthBytes: 2 * 1024 * 1024, gpuObjectsGrowth: 0 }, rows, errors };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('HeapProfiler.enable');
  page.on('pageerror', error => errors.push(String(error)));
  await page.addInitScript(() => {
    window.__b2Lifecycle = { frames: [], marks: [], last: 0, active: true };
    requestAnimationFrame(function frame(at) {
      const d = window.__b2Lifecycle;
      if (d.last && d.active) d.frames.push({ at, ms: at - d.last });
      d.last = at; requestAnimationFrame(frame);
    });
  });
  const mark = label => page.evaluate(label => { const d=window.__b2Lifecycle; if(label.startsWith('battle-') && label.endsWith('-start')){d.active=true;window.__lookLifecycleWaiting=false;} d.marks.push({ label, at: performance.now() }); }, label);
  const result = () => page.waitForFunction(() => window.__depthReview.screen === 'result', null, { timeout: 120000 });
  const snapshot = async index => {
    rawWindows.push({ index, ...await page.evaluate(()=>{ const d=window.__b2Lifecycle, raw={frames:d.frames,marks:d.marks}; d.frames=[]; d.marks=[]; d.active=false; window.__lookLifecycleWaiting=true; return raw; }) });
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
  await withTimingLock('LOOK lifecycle baseline battle', async () => {
  await page.goto('file://' + artifact);
  await page.getByRole('button', { name: 'Watch a battle now', exact: true }).click();
  await page.getByLabel('Playback speed', { exact: true }).selectOption('4');
  await result();
  await page.evaluate(() => { const scene=window.__depthScene; window.__b2RetainedScene=scene; const getView=scene.view.bind(scene); scene.view=()=>{const view=getView();return {...view,suspended:view.suspended||!!window.__lookLifecycleWaiting};}; });
  await snapshot(0);
  });
  for (let firstIndex=1; firstIndex<=20; firstIndex+=4) await withTimingLock(`LOOK lifecycle replays${firstIndex}–${firstIndex+3}`, async()=> {
  for (let index = firstIndex; index <= firstIndex+3; index++) {
    if (index > 1) await page.getByRole('button', { name: 'Close replay', exact: true }).click();
    await mark(`battle-${index}-start`);
    await page.getByRole('button', { name: 'Watch replay', exact: true }).click();
    await result();
    await mark(`battle-${index}-end`);
    await snapshot(index);
  }
  });
  receipt.rawWindows = rawWindows;
  receipt.finalMarks = await page.evaluate(() => window.__b2Lifecycle.marks);
  const first = rows[0], last = rows.at(-1);
  receipt.growth = { heap: last.heap.usedSize - first.heap.usedSize,
    geometries: last.gpu.geometries - first.gpu.geometries,
    textures: last.gpu.textures - first.gpu.textures, programs: last.programs - first.programs };
  assert.deepEqual(errors, []);
  assert.ok(rows.every(row => row.retained));
  // A complete measurement with a missed budget remains valid evidence.
  // Keep the final coordinator moving; the independent audit reports each miss.
  receipt.budgetMisses = [];
  if (receipt.growth.heap > receipt.tolerance.retainedHeapGrowthBytes) receipt.budgetMisses.push('retained heap exceeds2MiB growth');
  for (const key of ['geometries', 'textures', 'programs']) if (receipt.growth[key] !== 0) receipt.budgetMisses.push(`${key} growth ${receipt.growth[key]}`);
  receipt.completed = true;
  receipt.passed = receipt.budgetMisses.length === 0;
  console.log(JSON.stringify({lifecycleComplete:true,growth:receipt.growth,budgetMisses:receipt.budgetMisses}));
} finally {
  await browser.close();
  await writeFile(`${output}/summary.json`, JSON.stringify(receipt, null, 2));
}
