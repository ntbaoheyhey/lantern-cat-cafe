import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
export async function liveGallery(root, directory) {
  if (!directory) return { script: '', bytes: 0, files: [] };
  const data = JSON.parse(gunzipSync(await readFile(resolve(directory, 'shots.json.gz'))));
  const rows = data.shots.filter(row => row.width === 1280 && row.dpr === 1);
  if (rows.length !== 17) throw Error('Live guide needs the fixed 17-shot pack at 1280 DPR1');
  const names=['Burn stacks','Mark and Daze','Regen and Warm','Status overflow','Three-foe Row','Triple Crumb Burst','Bleed tick','Bitter reduces healing','Wildfire','Rupture','Spread','Splash','Multi-hit','Bounce','Yarn Giant phase','Mochi shelter','Clover greenhouse'];
  const shots = [], files = [];
  for (const row of rows) {
    const path = resolve(directory, row.file), bytes = await readFile(path);
    files.push({ path, sourceSha256: createHash('sha256').update(bytes).digest('hex') });
    shots.push({ id: row.id, name: names[Number(row.id.slice(1))-1], mode: row.mode, case: row.case, seed: row.seed, round: row.round, action: row.action, image: 'data:image/webp;base64,' + bytes.toString('base64') });
  }
  const script = `window.__v5LiveGallery=${JSON.stringify({ source: data.sha256, shots }).replace(/</g, '\\u003c')};`;
  return { script, bytes: Buffer.byteLength(script), files };
}
