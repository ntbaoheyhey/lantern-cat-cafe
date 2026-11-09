// Preserve the authored UVs and geometry; compress original maps only.
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { withTimingLock } from './lock.mjs';
const source = 'assets/cardrpg-look/stage', output = `${source}/game`;
await mkdir(output, { recursive: true });
const run = (cmd, args) => new Promise((resolve, reject) => {
  const child = spawn(cmd, args, { stdio: 'inherit' });
  child.on('error', reject); child.on('close', code => code === 0 ? resolve() : reject(Error(`${cmd}: ${code}`)));
});
const parameters = ['--compress','meshopt','--flatten','false','--join','false','--instance','false','--palette','false','--simplify','false','--prune','false','--texture-compress','webp','--texture-size','2048'];
await withTimingLock('LOOK stage compression', async () => {
  await run('/Users/bao/tools/cardrpg-look/npm/node_modules/.bin/gltf-transform', ['optimize', `${source}/cafe.glb`, `${output}/cafe.glb`, ...parameters]);
  await run('cwebp', ['-q', '90', `${source}/irradiance.png`, '-o', `${output}/irradiance.webp`]);
});
const rows = [];
for (const [from, to] of [['cafe.glb','cafe.glb'], ['irradiance.png','irradiance.webp']]) {
  const before = await readFile(`${source}/${from}`), after = await readFile(`${output}/${to}`);
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  rows.push({ source: `${source}/${from}`, output: `${output}/${to}`, sourceSha256: sha(before), sha256: sha(after), before: before.length, after: after.length, gzipAfter: gzipSync(after).length });
}
await writeFile(`${output}/packing.json`, JSON.stringify({ tool: 'glTF-Transform4.5.1 / cwebp1.6.0', parameters, irradianceQuality:90, rows }, null, 2)+'\n');
console.log(JSON.stringify(rows));
