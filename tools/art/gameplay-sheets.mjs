// Original rig sheets exported from the exact runtime compositor. No source images or network.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
const root = resolve(import.meta.dirname, '../..'), check = process.argv.includes('--check');
const requireWeb = createRequire(resolve(root, 'apps/web/package.json'));
const { createServer } = await import(requireWeb.resolve('vite'));
const vite = await createServer({ configFile: false, root: resolve(root, 'apps/web'), envDir: false, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
const palette = new Set(Object.values(JSON.parse(readFileSync(resolve(root, 'tools/art/visual-palette.json')))).map(s => parseInt(s.slice(1), 16)));
const out = 'apps/web/public/art/gameplay'; mkdirSync(resolve(root, out), { recursive: true });
const files = [], params = [];
function crc32(buf) { let c = 0xffffffff; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0); } return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const t = Buffer.from(type), n = Buffer.alloc(4), crc = Buffer.alloc(4); n.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([t, data]))); return Buffer.concat([n, t, data, crc]); }
export function png(w, h, pixels) {
  const header = Buffer.alloc(13); header.writeUInt32BE(w); header.writeUInt32BE(h, 4); header[8] = 8; header[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = pixels[y * w + x]; if (c < 0) continue; if (!palette.has(c)) throw Error('Unlocked palette color '+c.toString(16)); const i = y * (w * 4 + 1) + x * 4 + 1; raw[i] = c >> 16 & 255; raw[i+1] = c >> 8 & 255; raw[i+2] = c & 255; raw[i+3] = 255; }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
function save(path, data, parameters) {
  const dest = resolve(root, path), bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (check) { if (!existsSync(dest) || !readFileSync(dest).equals(bytes)) throw Error('Regenerate '+path); }
  else writeFileSync(dest, bytes);
  files.push({ file:path, bytes:bytes.length, sha256:createHash('sha256').update(bytes).digest('hex'), parameters });
}
try {
  const { composeFrame, FRAME } = await vite.ssrLoadModule('/src/game/rig/compose.ts');
  const { CLASS_LOOKS } = await vite.ssrLoadModule('/src/game/rig/palettes.ts');
  const { animsFor } = await vite.ssrLoadModule('/src/game/rig/poses.ts');
  for (const [id, look] of Object.entries(CLASS_LOOKS)) for (const [anim, def] of Object.entries(animsFor(look.weaponType))) {
    const width = FRAME.w * def.frames.length, height = FRAME.h, pixels = new Int32Array(width * height).fill(-1);
    def.frames.forEach((_, i) => { const f = composeFrame(look, {}, anim, i); if (f.clipped) throw Error(`Clipped ${id}/${anim}/${i}`); for (let y = 0; y < height; y++) pixels.set(f.pixels.subarray(y * FRAME.w, (y + 1) * FRAME.w), y * width + i * FRAME.w); });
    const parameters = { class:id, gear:{}, animation:anim, frames:def.frames.length, frameMs:def.frameMs, hitFrames:def.hitFrames??[], frameWidth:FRAME.w, frameHeight:FRAME.h, scale:1 };
    save(`${out}/mochi-${id}-${anim}.png`,png(width,height,pixels),parameters); params.push(parameters);
  }
  const manifest = { generator:'node tools/art/gameplay-sheets.mjs', date:'2026-11-04', provenance:'Original hand-authored rig maps and poses; no input images, no generative prompt; Evening Atelier palette.', files };
  const manifestPath = resolve(root, 'tools/art/gameplay-sheets.json'), data = JSON.stringify(manifest,null,2)+'\n';
  if(check) { if(readFileSync(manifestPath,'utf8')!==data) throw Error('Regenerate manifest'); } else writeFileSync(manifestPath,data);
  console.log(`${check?'Verified':'Generated'} ${files.length} original sheets, ${files.reduce((n,f)=>n+f.bytes,0)} bytes; all pixels palette-locked.`);
} finally { await vite.close(); }
