import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const directory = process.env.BIG_SKILL_OUT || 'reports/cardrpg-big/baseline/skills';
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const snapshotDirectory = await mkdtemp(resolve(tmpdir(), 'cardrpg-big-measure-'));
const frozenArtifact = resolve(snapshotDirectory, 'index.html');
const artifactBytes = await readFile(artifact);
await writeFile(frozenArtifact, artifactBytes);
const configurations = JSON.parse(process.env.BIG_SKILL_CONFIGS || '[[1280,720,1,1,"medium"],[1280,720,2,1,"medium"],[1440,900,1,1,"medium"],[1440,900,2,1,"medium"],[1280,720,1,4,"medium"],[1280,720,2,4,"medium"],[1440,900,1,4,"medium"],[1440,900,2,4,"medium"],[1280,720,1,1,"low"],[2560,1440,1,1,"medium"]]');
await mkdir(directory, { recursive: true });
const receipt = { artifact, sha256: createHash('sha256').update(artifactBytes).digest('hex'), started: new Date().toISOString(), rows: [] };
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal', '--enable-precise-memory-info'] });
let stopping = false;
process.on('SIGINT', () => { stopping = true; });
process.on('SIGTERM', () => { stopping = true; });

function summarize(frames) {
  const times = frames.map(frame => frame.ms).sort((a, b) => a - b);
  return { frames: times.length, max: times.at(-1) ?? 0, p95: times[Math.floor(times.length * .95)] ?? 0, above25: times.filter(time => time > 25).length, above50: times.filter(time => time > 50).length, within20: times.filter(time => time <= 20).length / times.length };
}

try {
  let actions;
  for (const [width, height, dpr, cpu, quality] of configurations) {
    let index = 0;
    do {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await page.addInitScript(() => {
        const data = window.__skillPerf = { frames: [], longTasks: [], longFrames: [], marks: [], last: 0 };
        for (const type of ['longtask', 'long-animation-frame']) {
          if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) (type === 'longtask' ? data.longTasks : data.longFrames).push(entry.toJSON());
          }).observe({ type, buffered: true });
        }
        requestAnimationFrame(function sample(now) {
          const stats = window.__depthScene?.stats;
          if (data.last) data.frames.push({ at: now, ms: now - data.last,
            calls: stats?.calls, triangles: stats?.triangles, particles: stats?.particles });
          data.last = now;
          requestAnimationFrame(sample);
        });
      });
      await page.goto('file://' + frozenArtifact);
      await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor({ timeout: 120000 });
      actions ??= await page.evaluate(() => window.__depthReview.galleryActions);
      if (process.env.BIG_SKILL_LIMIT) actions = actions.slice(0, Number(process.env.BIG_SKILL_LIMIT));
      const action = actions[index];
      await page.getByRole('button', { name: /Tangled Cafe/ }).click();
      await page.locator('.dp-node:enabled').first().click();
      await page.waitForFunction(() => window.__depthScene?.ready, { timeout: 120000 });
      await page.evaluate(({ action, quality }) => {
        const m = window.__depthReview;
        m.state.settings.quality = quality;
        // Load the actor fixture without rendering any frame of the skill.
        m.inspect(action.id, -1);
      }, { action, quality });
      await page.waitForFunction(() => {
        const m = window.__depthReview, scene = window.__depthScene;
        return m.battle.actors.every(actor => scene.puppets.get(actor.id)?.asset === actor.catalogId);
      });
      const snapshot = async () => {
        const heap = await cdp.send('Runtime.getHeapUsage');
        const sceneState = await page.evaluate(() => {
          const scene = window.__depthScene;
          return { at: performance.now(), ...scene.stats, gpuObjects: { ...scene.renderer.info.memory } };
        });
        return { ...sceneState, heap: heap.usedSize, heapDetail: heap };
      };
      const casts = [];
      for (const use of ['first', 'repeat']) {
        const before = await snapshot();
        await page.evaluate(id => {
          window.__skillPerf.marks.push({ label: 'cast', id, at: performance.now() });
          window.__depthReview.inspect(id, 0, true);
        }, action.id);
        const duration = await page.evaluate(() => window.__depthReview.plan.duration);
        await page.waitForFunction(() => !window.__depthReview.plan, { timeout: 30000 });
        const after = await snapshot();
        casts.push({ use, duration, before, after });
      }
      const data = await page.evaluate(() => window.__skillPerf);
      for (const cast of casts) {
        const frames = data.frames.filter(frame => frame.at >= cast.before.at && frame.at <= cast.after.at);
        cast.summary = { ...summarize(frames), calls: Math.max(...frames.map(frame => frame.calls ?? 0)),
          triangles: Math.max(...frames.map(frame => frame.triangles ?? 0)), particles: Math.max(...frames.map(frame => frame.particles ?? 0)) };
      }
      const name = `${width}x${height}-dpr${dpr}-cpu${cpu}-${quality}-${action.id.replace(':', '-')}`;
      const row = { name, action, width, height, dpr, cpu, quality, errors, casts, pageOpen: summarize(data.frames) };
      await writeFile(`${directory}/${name}.json`, JSON.stringify({ ...row, ...data }));
      receipt.rows.push(row);
      await writeFile(`${directory}/summary.json`, JSON.stringify(receipt, null, 2));
      console.log(JSON.stringify({ name, max: row.pageOpen.max, first: casts[0].summary.max, repeat: casts[1].summary.max, errors }));
      await page.close();
      index++;
    } while (index < actions.length && !stopping);
    if (stopping) break;
  }
} finally {
  await browser.close();
  await rm(snapshotDirectory, { recursive: true, force: true });
  receipt.ended = new Date().toISOString();
  await writeFile(`${directory}/summary.json`, JSON.stringify(receipt, null, 2));
}
