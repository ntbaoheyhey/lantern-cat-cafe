import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pngBytes } from '../art3d/materials.mjs';

const size = 1024;
const color = new Uint8Array(size * size * 4);
const normal = new Uint8Array(size * size * 4);
const noise = (x, y) => {
  let value = Math.imul(x + 37, 374761393) ^ Math.imul(y + 59, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
};
function height(x, y) {
  const u = (x + size) % size, v = (y + size) % size;
  const warp = Math.sin(v * Math.PI / 32) * 1.3;
  return .5 + .16 * Math.sin((u + warp) * Math.PI / 8)
    + .13 * Math.sin(v * Math.PI / 8) + noise(u, v) * .08;
}
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const at = (y * size + x) * 4;
    const shade = Math.round(237 + height(x, y) * 16);
    color.set([shade, shade, shade, 255], at);
    const dx = (height(x - 1, y) - height(x + 1, y)) * .72;
    const dy = (height(x, y - 1) - height(x, y + 1)) * .72;
    const length = Math.hypot(dx, dy, 1);
    normal.set([Math.round((dx / length * .5 + .5) * 255), Math.round((dy / length * .5 + .5) * 255), Math.round((1 / length * .5 + .5) * 255), 255], at);
  }
}
await mkdir('assets/cardrpg3/textures', { recursive: true });
const assets = [];
for (const [name, pixels] of [['felt-color', color], ['felt-normal', normal]]) {
  const path = `assets/cardrpg3/textures/${name}.png`;
  const bytes = pngBytes(pixels, size, size);
  await writeFile(path, bytes);
  assets.push({ path, width: size, height: size, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
await writeFile('assets/provenance/cardrpg-big-surfaces.json', JSON.stringify({
  tool: 'Original deterministic Node.js scalar bake and PNG writer',
  command: 'node tools/cardrpg-big/surfaces.mjs',
  source: 'tools/cardrpg-big/surfaces.mjs',
  sourceSha256: createHash('sha256').update(await readFile('tools/cardrpg-big/surfaces.mjs')).digest('hex'),
  externalReferences: [], license: 'CC0-1.0',
  parameters: { size, weavePeriod: 16, warpPeriod: 64, noiseSeed: 'x+37,y+59 integer hash', channels: 'sRGB color and tangent normal', reuse: 'shared tiled surface on each hero, mipmapped and anisotropic' },
  assets,
}, null, 2));
console.log(JSON.stringify(assets));
