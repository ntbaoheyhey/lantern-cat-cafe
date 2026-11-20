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
const unit = process.env.ART_UNIT || 'mochi', role = process.env.ART_ROLE || 'guardian';
const cue = process.env.ART_CUE || `${unit}-4`;
const attack = process.env.ART_ATTACK || (cue.startsWith('enemy:') ? `${cue}:basic` : `${unit}-1`);
await mkdir(out, { recursive: true });
const receipt = { artifact: createHash('sha256').update(await readFile(artifact)).digest('hex'),
  method: 'Game renderer, authored real clip times, isolated diagnostic poses; not gameplay acceptance.', errors: [], poses: [] };
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => receipt.errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' || m.text().includes('PropertyBinding')) receipt.errors.push(m.text()); });
  await open(page, artifact);
  await apply(page, { gallery: process.env.ART_GALLERY || `${unit}-1`, progress: -1 });
  // Freeze only the diagnostic view; keep the model/controller data unchanged.
  await page.evaluate(({unit,role}) => {
    const s = window.__depthScene;
    window.__rigView = { ...s.view(), frame: null, cardStatuses: {}, cardPresentation: undefined,
      actors: s.view().actors.filter(a => s.puppets.get(a.id)?.asset === unit),
      currentId: null, targetIds: [], legalIds: [], galleryPreview: false,
      fixedTime: 10, model: { role, clip: 'idle', angle: 0 }, modelProgress: 0, paused: true };
    s.view = () => window.__rigView;
  },{unit,role});
  const poses = [['rest','idle',0], ['attack-anticipation',attack,.22], ['attack-impact',attack,.52],
    ['guard','guard',.5], ['cast',cue,.5], ['hurt','heavy-hit-front',.13], ['victory','victory',.40],
    ['tail','idle-tail',.48], ['blink','idle',.2], ['side','idle',0], ['back','idle',0]]
    .filter(p=>!process.env.ART_POSES || process.env.ART_POSES.split(',').includes(p[0]));
  for (const [label, clip, progress] of poses) {
    const stats = await page.evaluate(({ label, clip, progress, role }) => {
      const s = window.__depthScene, v = window.__rigView;
      v.model = { role, clip, angle: label === 'side' ? Math.PI / 2 : label === 'back' ? Math.PI : 0 };
      v.modelProgress = progress; v.fixedTime = label === 'blink' ? 3.97 : 10;
      s.render(v, 0); s.dirty = false;
      const p = [...s.puppets.values()][0];
      if (!p.model.userData.lookGenerated) throw Error('Diagnostic requires the reconstructed model, not a fallback');
      if (!p.actions.has(clip)) throw Error(`Requested diagnostic clip is absent: ${clip}`);
      const skin = []; p.model.traverse(o => { if (o.isSkinnedMesh) skin.push(o); });
      return { generated: p.model.userData.lookGenerated, rig: p.model.userData.rigVersion,
        bones: skin.map(m => m.skeleton.bones.length), clips: [...p.actions.keys()],
        triangles: s.stats.triangles, draws: s.stats.calls,
        rect: s.renderer.domElement.getBoundingClientRect().toJSON() };
    }, { label, clip, progress, role });
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
