import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const baseline = process.argv.includes('--baseline');
const output = process.env.BIG_OUT || `reports/cardrpg-big/${baseline ? 'baseline' : 'performance'}`;
const file = resolve(baseline ? 'docs/cardrpg2/index.html' : 'docs/cardrpg3/index.html');
const captureScreenshots = process.env.BIG_CAPTURE !== '0';
const scenarios = JSON.parse(process.env.BIG_SCENARIOS || '[[1280,720,1,1],[1280,720,2,1],[1440,900,1,1],[1440,900,2,1],[1280,720,1,4],[1280,720,2,4],[2560,1440,1,1]]');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const rows = [];
try {
  for (const [width, height, dpr, throttle] of scenarios) {
    const name = `${width}x${height}-dpr${dpr}-cpu${throttle}`;
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    const traced = rows.length === 0 && !process.env.BIG_NO_TRACE;
    if (traced) await cdp.send('Tracing.start', { categories: 'devtools.timeline,v8,blink.user_timing,gpu,cc,disabled-by-default-devtools.timeline,disabled-by-default-v8.cpu_profiler', transferMode: 'ReturnAsStream' });
    await page.addInitScript(() => {
      const data = window.__bigPerf = { frames: [], longTasks: [], longFrames: [], marks: [], snapshots: [], last: 0 };
      for (const type of ['longtask', 'long-animation-frame']) {
        if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) (type === 'longtask' ? data.longTasks : data.longFrames).push(entry.toJSON());
        }).observe({ type, buffered: true });
      }
      requestAnimationFrame(function sample(t) {
        if (data.last) data.frames.push({ at: t, ms: t - data.last });
        data.last = t;
        const scene = window.__depthScene;
        if (scene && data.frames.length % 60 === 0) data.snapshots.push({ at: t, ...scene.stats, heap: performance.memory?.usedJSHeapSize, geometries: scene.renderer.info.memory.geometries, textures: scene.renderer.info.memory.textures });
        requestAnimationFrame(sample);
      });
    });
    const mark = async label => page.evaluate(label => window.__bigPerf.marks.push({ label, at: performance.now() }), label);
    const capture = async label => {
      if (!captureScreenshots) return;
      await mark(`capture-${label}-start`);
      await page.screenshot({ path: `${output}/${name}-${label}.png` });
      await mark(`capture-${label}-end`);
    };
    await page.goto('file://' + file);
    await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor({ timeout: 60000 });
    await mark('hub-interactive');
    await capture('hub');
    if (baseline) {
      await page.getByRole('button', { name: /Tangled Cafe/ }).click();
      await mark('map-click');
      await capture('map');
      await page.locator('.dp-node:enabled').first().click();
      await mark('fight-click');
    } else {
      await page.getByRole('button', { name: 'Watch a battle now' }).click();
      await mark('fight-click');
    }
    await page.waitForFunction(() => window.__depthScene?.ready || window.__depthReview?.sceneError, { timeout: 60000 });
    await mark('scene-ready');
    if (baseline) await page.getByLabel('Auto', { exact: true }).check();
    await capture('battle');
    for (let cast = 0; cast < 3; cast++) {
      await page.waitForTimeout(1200);
      await capture(`cast${cast}`);
    }
    await page.waitForTimeout(Number(process.env.BIG_WINDOW_MS || 20000));
    await mark('measurement-end');
    const data = await page.evaluate(() => {
      const scene = window.__depthScene, canvas = scene.renderer.domElement;
      const gl = scene.renderer.getContext(), extension = gl.getExtension('WEBGL_debug_renderer_info');
      const rectangle = canvas.getBoundingClientRect();
      return { ...window.__bigPerf, stats: scene.stats, labelAudit: scene.labelAudit,
        renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        pixelRatio: scene.renderer.getPixelRatio(), canvas: { width: canvas.width, height: canvas.height, cssWidth: rectangle.width, cssHeight: rectangle.height },
        stageFraction: rectangle.height / innerHeight, heap: performance.memory?.usedJSHeapSize,
        post: { width: scene.post?.sceneTarget?.width, height: scene.post?.sceneTarget?.height, samples: scene.post?.sceneTarget?.samples },
        result: window.__depthReview.battle?.result, actions: window.__depthReview.battle?.choices.length,
        audit: typeof scene.audit === 'function' ? scene.audit() : null };
    });
    const sorted = data.frames.map(f => f.ms).sort((a, b) => a - b);
    const row = { width, height, dpr, throttle, errors, ...data, max: sorted.at(-1), p95: sorted[Math.floor(sorted.length * .95)], p99: sorted[Math.floor(sorted.length * .99)], above25: sorted.filter(ms => ms > 25).length, above50: sorted.filter(ms => ms > 50).length, within20: sorted.filter(ms => ms <= 20).length / sorted.length };
    if (traced) {
      const completed = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
      await cdp.send('Tracing.end');
      const { stream } = await completed;
      let trace = '';
      for (;;) { const chunk = await cdp.send('IO.read', { handle: stream }); trace += chunk.data; if (chunk.eof) break; }
      await cdp.send('IO.close', { handle: stream });
      await writeFile(`${output}/${name}-trace.json`, trace);
      const events = JSON.parse(trace).traceEvents;
      const origin = events.find(e => e.name === 'navigationStart' && e.args?.data?.documentLoaderURL?.startsWith('file:'))?.ts;
      row.hitchAttribution = data.frames.filter(f => f.ms > 33).map(frame => {
        const from = origin + (frame.at - frame.ms) * 1000, until = origin + frame.at * 1000;
        const work = origin ? events.filter(e => e.ph === 'X' && e.dur && e.ts < until && e.ts + e.dur > from && /FunctionCall|EvaluateScript|Compile|GC|Layout|Paint|UpdateLayer|Raster|Parse|RunTask/.test(e.name)) : [];
        return { ...frame, evidence: work.sort((a, b) => b.dur - a.dur).slice(0, 6).map(e => ({ name: e.name, ms: e.dur / 1000, function: e.args?.data?.functionName })), attribution: work.length ? 'Overlapping trace events, inclusive durations' : 'Unattributed by available trace timestamps' };
      });
    }
    await writeFile(`${output}/${name}.json`, JSON.stringify(row, null, 2));
    rows.push({ ...row, frames: undefined, longFrames: undefined, longTasks: undefined, snapshots: undefined, hitchAttribution: undefined });
    console.log(JSON.stringify({ name, max: row.max, p95: row.p95, above50: row.above50, stageFraction: row.stageFraction, errors }));
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(`${output}/summary.json`, JSON.stringify({ date: new Date().toISOString(), artifact: file, sha256: createHash('sha256').update(await readFile(file)).digest('hex'), captureScreenshots, method: 'Fresh file URL, fresh browser context, cache disabled, RAF and trace begin before navigation. Real mouse clicks. CPU throttle affects CPU only. Raw load frames are retained.', rows }, null, 2));
}
