// Capture the actual legacy fallback or authored gesture without pretending both have authored clips.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const artifact = resolve(process.env.BIG_BEFORE_ARTIFACT || '/tmp/cardrpg-big2-b1-index.html');
const output = process.env.BIG_BEFORE_OUT || 'reports/cardrpg-big2/cats/batch1/before';
const owners = (process.env.BIG_NEW_OWNERS || 'panko,mallow,sorrel').split(',');
const temporary = await mkdtemp(resolve(tmpdir(), 'cardrpg-big2-before-'));
await mkdir(output, { recursive: true });
const rows = [], errors = [];
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('file://' + artifact);
  await page.getByRole('button', { name: /Tangled Cafe/ }).click();
  await page.locator('.dp-node:enabled').first().click();
  await page.getByRole('button', { name: 'Fight', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 120000 });
  const actions = await page.evaluate(owners => window.__depthReview.galleryActions.filter(action => owners.includes(action.owner) && (/-[1-4]$/.test(action.id) || action.id.startsWith('enemy:'))), owners);
  for (const action of actions) {
    await page.evaluate(id => window.__depthReview.inspect(id, 0), action.id);
    await page.waitForFunction(() => window.__depthReview.battle.actors.every(actor => window.__depthScene.puppets.get(actor.id)?.asset === actor.catalogId));
    const frames = [], checks = [];
    for (let index = 0; index < 8; index++) {
      const state = await page.evaluate(progress => {
        const scene = window.__depthScene, model = window.__depthReview;
        model.animationAt = model.plan.duration * progress;
        scene.render({ ...scene.view(), frame: model.frame, fixedTime: 10 });
        const caster = scene.puppets.get(model.plan.actorId), bounds = scene.renderer.domElement.getBoundingClientRect();
        return { clip: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }, sourceClip: caster.clip,
          progress, time: caster.actions.get(caster.clip)?.time, casterBounds: scene.audit().units.find(unit => unit.id === model.plan.actorId).box };
      }, index / 7);
      const path = resolve(temporary, `${action.id.replaceAll(':', '-')}-${index}.png`);
      await page.screenshot({ path, clip: state.clip }); frames.push(path); checks.push(state);
    }
    rows.push({ name: action.name, owner: action.owner, id: action.id, frames, bounds: checks.map(row => row.casterBounds), checks, output: resolve(`${output}/${action.id.replaceAll(':', '-')}.webp`) });
  }
} finally { await browser.close(); }
const manifest = resolve(temporary, 'frames.json'); await writeFile(manifest, JSON.stringify(rows));
execFileSync(process.env.BIG_PYTHON || '/tmp/cardrpg-big-tools/bin/python', ['tools/cardrpg-big/motion-sheets.py', manifest], { stdio: 'inherit' });
for (const row of rows) { delete row.frames; row.sha256 = createHash('sha256').update(await readFile(row.output)).digest('hex'); }
await writeFile(`${output}/captures.json`, JSON.stringify({ artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'), method: 'Eight actual gallery render frames at the same normalized times as the after filmstrips. Legacy fallback clip identities retained; no authored-clip claim.', rows, errors }, null, 2));
await rm(temporary, { recursive: true, force: true });
console.log(JSON.stringify({ beforeFilmstrips: rows.length, errors }));
if (errors.length || new Set(rows.map(row => row.owner)).size !== owners.length || (!process.env.BIG_ENEMY_BATCH && rows.length !== owners.length * 4)) process.exitCode = 1;
