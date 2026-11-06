// Original deterministic stage surfaces. Same wood/cloth formula as the prior
// canvas bake, evaluated at build time; no browser or external artwork needed.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pngBytes } from '../art3d/materials.mjs';
const size = 256, assets = [];
await mkdir('assets/cardrpg3b/textures', { recursive: true });
for (const kind of ['wood', 'cloth', 'window']) {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const at = (y * size + x) * 4;
    if (kind === 'window') {
      const stops = [[91, 82, 102], [184, 129, 113], [232, 186, 134]];
      const t = (y + .5) / size, from = t < .55 ? 0 : 1;
      const blend = from ? (t - .55) / .45 : t / .55;
      const color = stops[from].map((v, c) => v + (stops[from + 1][c] - v) * blend);
      for (let i = 0; i < 18; i++) {
        const distance = Math.hypot(x + .5 - (18 + i * 47 % 228), y + .5 - (35 + i * 31 % 195));
        const alpha = Math.min(1, Math.max(0, 6 + i % 4 * 4 - distance + .5)) * 79 / 255;
        for (let c = 0; c < 3; c++) color[c] += ([231, 205, 162][c] - color[c]) * alpha;
      }
      pixels.set([...color.map(Math.round), 255], at);
    } else {
      const base = kind === 'wood' ? [203, 155, 112] : [211, 204, 195];
      const noise = Math.sin(x * 127.1 + y * 311.7) * 43758.5453 % 1;
      const shade = kind === 'wood' ? .68 + .11 * Math.sin(x * .20 + Math.sin(y * .021) * 3)
        + .07 * Math.sin(x * .71 + Math.sin(y * .03)) + noise * .035
        : .85 + ((x % 5 < 2) !== (y % 5 < 2) ? -.09 : .04) + noise * .035;
      pixels.set([...base.map(v => Math.round(v * shade)), 255], at);
    }
  }
  const path = `assets/cardrpg3b/textures/stage-${kind}.png`, bytes = pngBytes(pixels, size, size);
  await writeFile(path, bytes);
  assets.push({ path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
await writeFile('assets/provenance/cardrpg-big2-stage.json', JSON.stringify({
  tool: 'Original Node scalar bake and repository PNG writer', command: 'node tools/cardrpg-big2/bake-stage.mjs',
  sourceSha256: createHash('sha256').update(await readFile('tools/cardrpg-big2/bake-stage.mjs')).digest('hex'),
  parameters: { size, wood: 'prior sine-grain formula', cloth: 'prior 5px weave', window: 'three-stop gradient and 18 original circles with scalar edge coverage' },
  externalReferences: [], license: 'CC0-1.0', assets,
}, null, 2));
console.log(JSON.stringify(assets));
