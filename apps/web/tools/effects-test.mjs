// Wallet-free EFFECTS test: records video, grabs timed frame sequences, asserts animation behaviour.
// Screenshots cannot show motion, so this samples the running app over time. Demo mode on the Vite DEV
// server only (dev builds expose canvas data-stage-release/impact); nothing touches live services.
// Usage: SCREENSHOTS=1 node tools/effects-test.mjs [outDir] [--frames] [--viewport=1600x900]
// One summary PNG by default; --frames opts into extra PNG sequences. Exit 1 on hard failures.
import { createServer } from 'vite';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('@playwright/test');

const out = resolve(process.argv.slice(2).find(arg => !arg.startsWith('--')) ?? '../../reports/effects');
const writeScreenshots = process.env.SCREENSHOTS === '1';
const writeFrames = writeScreenshots && process.argv.includes('--frames');
const viewportArg = process.argv.find(arg => arg.startsWith('--viewport='))?.slice('--viewport='.length) ?? '1280x720';
if (!['1280x720', '1600x900'].includes(viewportArg)) throw new Error('--viewport must be 1280x720 or 1600x900');
const [viewportWidth, viewportHeight] = viewportArg.split('x').map(Number);
const viewport = { width: viewportWidth, height: viewportHeight };
const manifest = JSON.parse(readFileSync(new URL('./screen-manifest.json', import.meta.url), 'utf8'));
const port = 5198, base = `http://localhost:${port}`;
const key = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)[1];
mkdirSync(out, { recursive: true });
process.env.VITE_GAME_V2 = '1';
process.env.VITE_SUPABASE_URL = '';
process.env.VITE_SUPABASE_ANON_KEY = '';
const vite = await createServer({ envDir: false, server: { port, strictPort: true } });
let browser;
try {
await vite.listen();

const results = [];
const check = (scenario, name, ok, detail, known = false) => {
  results.push({ scenario, name, status: ok ? 'PASS' : known ? 'KNOWN' : 'FAIL', detail });
  console.log(`${ok ? 'PASS' : known ? 'KNOWN' : 'FAIL'}  [${scenario}] ${name} - ${detail}`);
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });

async function open(name, { fixture, reduced = false, size = viewport }) {
  const opts = { viewport: size, reducedMotion: reduced ? 'reduce' : 'no-preference' };
  let ctx = await browser.newContext({ ...opts, recordVideo: { dir: `${out}/video-${name}`, size } });
  let page;
  try { page = await ctx.newPage(); } catch (e) { // ffmpeg missing: run without video (frames are still captured)
    if (!/ffmpeg/i.test(String(e))) throw e;
    await ctx.close().catch(() => {}); ctx = await browser.newContext(opts); page = await ctx.newPage();
    if (!globalThis.__noVideoWarned) { console.log('NOTE: ffmpeg not installed, no .webm video (run: npx playwright install ffmpeg)'); globalThis.__noVideoWarned = true; }
  }
  await page.addInitScript(() => localStorage.setItem('taskbar-hero.howToPlaySeen', '1'));
  await page.goto(`${base}/`);
  const save = await page.evaluate(async ({ fixture }) => {
    const m = await import('/src/api/mockV2Fixtures.ts');
    return m.mockV2SaveJson(fixture, { nowMs: Date.now(), classId: 'warrior' });
  }, { fixture });
  await page.evaluate(([k, s]) => localStorage.setItem(k, s), [key, save]);
  await page.reload();
  await page.locator('.v2-stage-canvas canvas').waitFor({ timeout: 20000 });
  await sleep(1500);
  return { ctx, page, canvas: page.locator('.v2-stage-canvas canvas') };
}

/** Sample the canvas every ~100 ms. Returns per-frame hash, attack/impact counters and timestamps. */
async function sample(page, canvas, seconds, dir) {
  mkdirSync(`${out}/${dir}`, { recursive: true });
  const frames = [];
  const start = Date.now();
  while (Date.now() - start < seconds * 1000) {
    const t = Date.now() - start;
    const buf = await canvas.screenshot({ type: 'png' });
    const d = await canvas.evaluate(c => ({ release: c.dataset.stageRelease ?? null, impact: c.dataset.stageImpact ?? null, monster: c.dataset.stageMonster ?? null }));
    frames.push({ t, hash: createHash('md5').update(buf).digest('hex'), ...d });
    if (writeFrames && frames.length % 5 === 0 && frames.length <= 60) writeFileSync(`${out}/${dir}/f${String(frames.length).padStart(3, '0')}-${t}ms.png`, buf);
    await sleep(60);
  }
  return frames;
}
const distinct = (frames, k) => new Set(frames.map(f => f[k]).filter(v => v !== null)).size;
const seqChanges = (frames, k) => frames.slice(1).filter((f, i) => f[k] !== null && f[k] !== frames[i][k]).length;
const changes = frames => frames.slice(1).filter((f, i) => f.hash !== frames[i].hash).length;

// A. Normal combat: hero attacks, hits land, frames keep changing.
{
  const { ctx, page, canvas } = await open('combat', { fixture: 'fresh' });
  const fps = page.evaluate(() => new Promise(res => {
    const dts = []; let last = performance.now(); const end = last + 4000;
    const tick = now => { dts.push(now - last); last = now; now < end ? requestAnimationFrame(tick) : res(dts); };
    requestAnimationFrame(tick);
  }));
  const frames = await sample(page, canvas, 8, 'combat');
  const dts = (await fps).slice(2).sort((a, b) => a - b);
  const avgFps = 1000 / (dts.reduce((a, b) => a + b, 0) / dts.length);
  const p95 = dts[Math.floor(dts.length * .95)];
  check('combat', 'hits land on the monster repeatedly (hero swing reaches contact)', seqChanges(frames, 'impact') >= 3, `${seqChanges(frames, 'impact')} impact cues in 8 s`);
  check('combat', 'canvas is animating (not frozen)', changes(frames) >= frames.length * .5, `${changes(frames)} of ${frames.length - 1} frame pairs differ`);
  const impacts = frames.filter((f, i) => i > 0 && f.impact !== frames[i - 1].impact);
  const flashVisible = impacts.filter(f => f.hash !== frames[frames.indexOf(f) - 1].hash).length;
  check('combat', 'hit flash/damage number changes pixels at each impact', impacts.length > 0 && flashVisible === impacts.length, `${flashVisible}/${impacts.length} impacts changed the frame`);
  check('combat', 'frame rate (headless software GL, relative)', avgFps >= 8, `avg ${avgFps.toFixed(1)} fps, p95 frame ${p95.toFixed(0)} ms`);
  check('combat', 'no long-frame stalls over 250 ms', dts.filter(d => d > 250).length <= 2, `${dts.filter(d => d > 250).length} frames over 250 ms`);
  if (writeScreenshots) await page.screenshot({ path: `${out}/combat-end.png` });
  await ctx.close();
}

// B. Halted stage (boss ready): hero must still look alive. AGU1 piece 1 fixes this.
{
  const { ctx, page, canvas } = await open('boss-ready', { fixture: 'bossReadyStrong' });
  const frames = await sample(page, canvas, 4, 'boss-ready');
  check('boss-ready', 'no attack swings while halted (by design)', seqChanges(frames, 'impact') === 0, `${seqChanges(frames, 'impact')} impacts`);
  check('boss-ready', 'hero idle loop keeps animating while halted', changes(frames) >= 3, `${changes(frames)} frame changes in 4 s`);
  await ctx.close();
}

// C. Reduced motion: no flying shots / transform animations, stage still readable.
{
  const normal = await open('motion-normal', { fixture: 'fresh' });
  const walk = async page => {
    const names = new Set(); let transformAnims = 0;
    const visited = [];
    for (const screen of manifest.screens) {
      await page.getByTestId(screen.navTestId).click();
      if (screen.subnavTestId) await page.getByTestId(screen.subnavTestId).click();
      visited.push(screen.id);
      for (let i = 0; i < 6; i++) {
        await sleep(80);
        const found = await page.evaluate(() => document.getAnimations().map(a => ({
          name: a.animationName ?? a.transitionProperty ?? 'anim', props: a.effect?.getKeyframes?.().flatMap(k => Object.keys(k)).filter(p => !['offset', 'easing', 'composite', 'computedOffset'].includes(p)) ?? [] })));
        for (const f of found) { names.add(f.name); if (f.props.some(p => /transform|translate|scale|rotate/.test(p))) transformAnims++; }
      }
    }
    return { screens: visited, names: [...names], transformAnims };
  };
  const n = await walk(normal.page); await normal.ctx.close();
  const red = await open('motion-reduced', { fixture: 'fresh', reduced: true });
  const r = await walk(red.page);
  const expectedScreens = JSON.stringify(manifest.screens.map(screen => screen.id));
  check('coverage', 'every manifest screen visited in both motion modes',
    JSON.stringify(n.screens) === expectedScreens && JSON.stringify(r.screens) === expectedScreens,
    `normal=${n.screens.join(',')}; reduced=${r.screens.join(',')}`);
  const homeTab = red.page.getByRole('tab', { name: 'Home' });
  if (await homeTab.count()) {
    await homeTab.click();
    await sleep(600);
  }
  const frames = await sample(red.page, red.canvas, 4, 'reduced');
  check('reduced-motion', 'no transform/slide animations when reduced', r.transformAnims === 0, `${r.transformAnims} transform animations (normal had ${n.transformAnims})`);
  check('reduced-motion', 'stage still updates (impacts) when reduced', seqChanges(frames, 'impact') >= 1, `${seqChanges(frames, 'impact')} impacts`);
  writeFileSync(`${out}/animation-inventory.json`, JSON.stringify({ normal: n, reduced: r }, null, 2));
  await red.ctx.close();
}

await browser.close();
writeFileSync(`${out}/summary.json`, JSON.stringify(results, null, 2));
const fail = results.filter(r => r.status === 'FAIL').length;
console.log(`\n${results.length} checks, ${fail} FAIL at ${viewportArg}. Videos + frames in ${out}`);
process.exitCode = fail ? 1 : 0;
} finally {
  await browser?.close();
  await vite.close();
}
