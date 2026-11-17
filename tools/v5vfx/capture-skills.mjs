/** Deterministic contact sheets of the actual scene; no player save or rules mutation. */
import {chromium, config, openFixture} from './browser-fixture.mjs';
import {mkdir, writeFile, readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {runtimeEvidence} from './runtime-evidence.mjs';

const root = process.cwd(), out = resolve(process.env.CXV_CAPTURE_OUT ?? 'work/v5/CXV/films/V1');
const url = process.env.CXV_URL ?? 'http://127.0.0.1:6310';
const ids = (process.env.CXV_SKILLS ?? 'mochi-1,mochi-2,mochi-4,soot-1,soot-2,soot-4,clover-1,clover-2,clover-4,panko-1,panko-2,panko-4').split(',');
await mkdir(out, {recursive: true});
const report = {started: new Date().toISOString(), sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
  ...runtimeEvidence(),
  method: '12 exact simulation timestamps per sheet; irregular sampling, not a real-time FPS measurement. Skill slot 2 uses the explicit archive fixture.', sheets: []};
const browser = await chromium.launch({headless: true, args: ['--use-angle=metal']});
try {
  const {page, errors, blockedRequests} = await openFixture(browser, config.fixtures.find(f => f.id === 'boss'), {url, fixedClock: false});
  report.url = page.url();
  report.blockedRequests = blockedRequests;
  // Review external original textures without copying assets or merging a producer branch.
  if (process.env.CXV_REVIEW_ASSETS) {
    const assetRoot = resolve(process.env.CXV_REVIEW_ASSETS), manifest = JSON.parse(await readFile(resolve(assetRoot, 'manifest.json'), 'utf8'));
    const owners = new Set(ids.map(id => id.replace(/-[1-4]$/, ''))), entries = Object.entries(manifest).filter(([id]) => owners.has(id.replace(/-(anticipation|impact|slash|projectile|decal|particle-[123]|ult-charge|ult-release)$/, '')));
    const files = new Map(), hashes = {};
    for (const [, entry] of entries) {
      const path = resolve(assetRoot, entry.file); if (!path.startsWith(assetRoot + '/')) throw Error('Invalid asset path');
      const data = await readFile(path); files.set(entry.file, data); hashes[entry.file] = createHash('sha256').update(data).digest('hex');
    }
    await page.route('**/__cxv_review__/*', route => {
      const data = files.get(decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1)));
      return data ? route.fulfill({body: data, contentType: 'image/webp'}) : route.abort();
    });
    await page.evaluate(async ({entries, root}) => {
      const registry = await import('/@fs' + root + '/apps/web/src/game/cardrpg/spine/vfx-registry.ts');
      registry.clearV5Textures();
      for (const [key, spec] of entries) {
        const image = new Image(); image.src = '/__cxv_review__/' + encodeURIComponent(spec.file); await image.decode();
        if (!registry.registerV5Texture(key, {image, width: image.naturalWidth, height: image.naturalHeight, cols: spec.cols, rows: spec.rows, frameMs: spec.frameMs, blend:spec.blend})) throw Error('Invalid review texture ' + key);
      }
    }, {entries, root});
    report.reviewAssets = {path: assetRoot, sourceCommit: execFileSync('git', ['-C', assetRoot, 'rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(), sha256: hashes};
  }
  for (const id of ids) {
    const dir = resolve(out, id); await mkdir(dir, {recursive: true});
    await page.evaluate(async ({id, root}) => {
      const {pilotFixture} = await import('/@fs' + root + '/apps/web/src/game/cardrpg/vfx-layered/fixture.ts');
      const {configureSequence} = await import('/@fs' + root + '/apps/web/src/game/cardrpg/battle-v3/sequence.ts');
      const fixture = pilotFixture(id, false, /-[23]$/.test(id)), m = window.__depthReview;
      m.galleryBattle = fixture.battle; m.plan = configureSequence(fixture.plan); m.galleryId = id;
      m.animationAt = 0; m.paused = true; m.sceneStarted = true; m.labOpen = false;
      m.state.settings.reducedMotion = false; m.notify(false);
      const s = window.__depthScene; cancelAnimationFrame(s.raf); s.ensureActors(s.view());
    }, {id, root});
    await page.waitForFunction(() => window.__depthScene.ready && window.__depthScene.actors.size === window.__depthReview.battle.actors.length, null, {timeout: 90000});
    const info = await page.evaluate(() => ({impact: window.__depthReview.plan.beats[2].start, duration: window.__depthReview.plan.duration}));
    const times = process.env.CXV_TRAVEL_SAMPLES ? (info.impact > 500 ? [0, 850, 1000, 1050, 1099, 1100, 1133, 1160, 1280, 1450, 1650, 2199] :
      [0, 150, 249, 300, 349, 350, 383, 410, 470, 550, 750, 799]) : info.impact > 500 ? [0, 600, 850, 1000, 1099, 1100, 1133, 1160, 1280, 1450, 1650, 2199] :
      [0, 150, 249, 349, 350, 383, 410, 470, 550, 650, 750, 799];
    const samples = [];
    for (let index = 0; index < times.length; index++) {
      const ms = times[index];
      const audit = await page.evaluate(({ms, id}) => {
        const m = window.__depthReview, s = window.__depthScene;
        m.animationAt = ms; s.render({...s.view(), fixedTime: 20 + ms / 1000, paused: true}, 0);
        let label = document.querySelector('[data-cxv-timestamp]');
        if (!label) {label = document.createElement('div'); label.dataset.cxvTimestamp = 'true';
          Object.assign(label.style, {position: 'fixed', bottom: '8px', left: '8px', color: '#fff4d8', background: '#21182dee', padding: '6px 10px', font: '16px monospace', zIndex: '999999'}); document.body.append(label);}
        label.textContent = `${id} · ${ms} ms · ${s.effects.timeline.audit.phase}`;
        return {...structuredClone(s.effects.timeline.audit), viewSkill: s.view().frame?.plan.skillId ?? null,
          modelSkill: m.plan?.skillId ?? null, presentationId: m.plan?.presentationId ?? null,
          eventTypes: m.plan?.events.map(e => e.type), source: s.socket(m.plan.actorId, 'mainHand'),
          casterRoot: s.actors.get(m.plan.actorId)?.actor.root.position.toArray(), pose: s.sampled.get(m.plan.actorId)?.name,
          heroStates: [...s.actors].filter(([,e])=>['mochi','soot','clover','panko'].includes(e.asset)).map(([actorId,e])=>({
            owner:e.asset,pose:s.sampled.get(actorId)?.name,key:e.craftPose?.drawing.key,crowd:s.motionAudit.find(a=>a.id===actorId)?.crowd,
            blink:e.craftPose?[e.craftPose.drawing.secondary.leftBlink,e.craftPose.drawing.secondary.rightBlink]:null}))};
      }, {ms, id});
      await page.screenshot({path: resolve(dir, `frame-${String(index).padStart(2, '0')}.png`)});
      samples.push({ms, ...audit});
    }
    const sheet = resolve(out, `${id}.jpg`);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', '6', '-i', resolve(dir, 'frame-%02d.png'),
      '-vf', 'scale=480:-1,tile=4x3', '-frames:v', '1', '-q:v', '4', sheet]);
    report.sheets.push({id, archive: /-[23]$/.test(id), ...info, sheet, samples});
    await writeFile(resolve(out, 'capture.json'), JSON.stringify(report, null, 2));
    if (!samples.some(s => s.ms === info.impact && s.draws > 0)) throw Error(`Missing timeline contact: ${id}`);
    process.stdout.write(`${id}: ${sheet}\n`);
  }
  report.errors = errors;
  if (errors.length) throw Error(errors.join('\n'));
  report.pass = true;
} catch (error) {report.pass = false; report.error = String(error); process.exitCode = 1;}
finally {await browser.close(); report.finished = new Date().toISOString(); await writeFile(resolve(out, 'capture.json'), JSON.stringify(report, null, 2));}
