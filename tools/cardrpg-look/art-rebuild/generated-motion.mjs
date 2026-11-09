// Inspect actual generated skin deformation with the game's mixer and lighting.
// Diagnostic gallery poses are labelled; they are not a natural-battle film.
import { chromium } from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { open, apply } from '../skills-v5/full/harness.mjs';
const sharp = createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const artifact = resolve(process.env.ART_ARTIFACT), out = resolve(process.env.ART_OUT);
await mkdir(out, { recursive: true });
const receipt = { artifact: createHash('sha256').update(await readFile(artifact)).digest('hex'),
  method: 'Game renderer, authored real clip times, isolated diagnostic poses; not gameplay acceptance.', errors: [], poses: [] };
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => receipt.errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' || m.text().includes('PropertyBinding')) receipt.errors.push(m.text()); });
  await open(page, artifact);
  await apply(page, { gallery: 'mochi-1', progress: -1 });
  // Freeze only the diagnostic view; keep the model/controller data unchanged.
  await page.evaluate(() => {
    const s = window.__depthScene;
    window.__rigView = { ...s.view(), frame: null, cardStatuses: {}, cardPresentation: undefined,
      actors: s.view().actors.filter(a => s.puppets.get(a.id)?.asset === 'mochi'),
      currentId: null, targetIds: [], legalIds: [], galleryPreview: false,
      fixedTime: 10, model: { role: 'guardian', clip: 'idle', angle: 0 }, modelProgress: 0, paused: true };
    s.view = () => window.__rigView;
  });
  const poses = [['rest','idle',0], ['attack-anticipation','mochi-1',.22], ['attack-impact','mochi-1',.52],
    ['guard','guard',.5], ['cast','mochi-4',.5], ['hurt','heavy-hit-front',.13], ['victory','victory',.40],
    ['tail','idle-tail',.48], ['blink','idle',.2], ['side','idle',0], ['back','idle',0]];
  for (const [label, clip, progress] of poses) {
    const stats = await page.evaluate(({ label, clip, progress }) => {
      const s = window.__depthScene, v = window.__rigView;
      v.model = { role: 'guardian', clip, angle: label === 'side' ? Math.PI / 2 : label === 'back' ? Math.PI : 0 };
      v.modelProgress = progress; v.fixedTime = label === 'blink' ? 3.97 : 10;
      s.render(v, 0); s.dirty = false;
      const p = [...s.puppets.values()][0];
      const skin = []; p.model.traverse(o => { if (o.isSkinnedMesh) skin.push(o); });
      return { generated: p.model.userData.lookGenerated, rig: p.model.userData.rigVersion,
        bones: skin.map(m => m.skeleton.bones.length), clips: [...p.actions.keys()],
        triangles: s.stats.triangles, draws: s.stats.calls,
        rect: s.renderer.domElement.getBoundingClientRect().toJSON() };
    }, { label, clip, progress });
    const r = stats.rect;
    const file = label + '.webp';
    await sharp(await page.screenshot({ clip: { x: r.x, y: r.y, width: r.width, height: r.height } }))
      .resize({ width: 720 }).webp({ quality: 88 }).toFile(out + '/' + file);
    receipt.poses.push({ label, clip, progress, file, ...stats });
  }
  await page.close();
} finally {
  await browser.close();
  await writeFile(out + '/motion.json', JSON.stringify(receipt, null, 2) + '\n');
}
const tiles = [];
for (const [i, pose] of receipt.poses.entries()) {
  const img = await sharp(out + '/' + pose.file).resize(400, 330, { fit: 'cover' }).toBuffer();
  tiles.push({ input: img, left: (i % 4) * 400, top: Math.floor(i / 4) * 360 + 30 });
  const svg = `<svg width="400" height="30"><text x="12" y="21" fill="#fff0d2" font-size="16">${pose.label}</text></svg>`;
  tiles.push({ input: Buffer.from(svg), left: (i % 4) * 400, top: Math.floor(i / 4) * 360 });
}
await sharp({ create: { width: 1600, height: Math.ceil(receipt.poses.length / 4) * 360, channels: 3, background: '#172d36' } })
  .composite(tiles).webp({ quality: 88 }).toFile(out + '/contact-sheet.webp');
console.log(JSON.stringify({ poses: receipt.poses.length, errors: receipt.errors }));
