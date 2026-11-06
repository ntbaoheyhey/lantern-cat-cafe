import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { root, web, requireWeb } from '../visual-support.mjs';

const manifest = JSON.parse(await readFile('assets/provenance/cardrpg-depth-models.json', 'utf8'));
const { createServer } = await import(requireWeb.resolve('vite'));
const server = await createServer({ root: web, configFile: false, envDir: false,
  server: { host: '127.0.0.1', port: 5926, strictPort: true, fs: { allow: [root] } },
});
await server.listen();
let browser;
const records = [];
await mkdir('assets/cardrpg3/portraits', { recursive: true });
await mkdir('reports/cardrpg-big/sharpness/expressions', { recursive: true });
try {
  browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
  for (const asset of manifest.assets) {
    const expressions = ['mochi', 'soot', 'clover'].includes(asset.id)
      ? ['idle', 'happy', 'hurt', 'determined', 'casting', 'KO'] : ['idle'];
    for (const expression of expressions) {
      const page = await browser.newPage({ viewport: { width: 400, height: 480 } });
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto('http://127.0.0.1:5926/@fs' + resolve('tools/cardrpg-big/portrait.html')
        + `?id=${asset.id}&role=${asset.role}&expression=${expression}`);
      await page.waitForFunction(() => window.__portrait?.ready);
      const render = await page.evaluate(() => window.__portrait);
      if (errors.length) throw new Error(errors.join('\n'));
      const bytes = Buffer.from(render.webp.split(',')[1], 'base64');
      const path = expression === 'idle' ? `assets/cardrpg3/portraits/${asset.id}.webp`
        : `reports/cardrpg-big/sharpness/expressions/${asset.id}-${expression}.webp`;
      await writeFile(path, bytes);
      records.push({ id: asset.id, expression, path, width: render.width, height: render.height,
        triangles: render.triangles, bytes: bytes.length, modelSha256: asset.sha256,
        sha256: createHash('sha256').update(bytes).digest('hex') });
      await page.close();
    }
  }
} finally {
  await browser?.close();
  await server.close();
}
await writeFile('assets/provenance/cardrpg-big-portraits.json', JSON.stringify({
  tool: 'Three.js / Chromium ANGLE Metal, native WebP quality .94',
  command: 'node tools/cardrpg-big/portraits.mjs',
  externalReferences: [], license: 'CC0-1.0',
  parameters: { cssSize: [400, 480], pixelRatio: 2, exposure: 1.18, camera: [0, 1.7, 5.8], facing: .2 },
  sources: await Promise.all(['tools/cardrpg-big/portrait.html', 'tools/cardrpg-big/portraits.mjs',
    'apps/web/src/game/squad/turn3d/card-face.ts', 'apps/web/src/game/squad/turn3d/card-surfaces.ts'].map(async path => ({
    path, sha256: createHash('sha256').update(await readFile(path)).digest('hex'),
  }))),
  assets: records,
}, null, 2));
console.log(JSON.stringify({ renders: records.length, bytes: records.reduce((sum, row) => sum + row.bytes, 0) }));
