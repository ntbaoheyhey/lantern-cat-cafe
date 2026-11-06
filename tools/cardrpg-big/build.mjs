import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, relative, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { root, web, requireWeb } from '../visual-support.mjs';
const { build } = await import(requireWeb.resolve('vite'));
const embeddedAssets = new Map();
const mimeTypes = { '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const result = await build({ configFile: false, root: web, envDir: false, publicDir: false, logLevel: 'warn',
  plugins: [{
    name: 'cardrpg-offline-assets',
    enforce: 'pre',
    load(id) {
      const [file, query] = id.split('?');
      const mime = mimeTypes[extname(file)];
      if (!mime || !new URLSearchParams(query).has('url')) return null;
      const key = relative(root, file);
      embeddedAssets.set(key, { mime, bytes: readFileSync(file) });
      return `export default window.__cardAssets[${JSON.stringify(key)}];`;
    },
  }],
  define: { 'process.env.NODE_ENV': '"production"' }, resolve: { dedupe: ['react', 'react-dom'] },
  build: { write: false, minify: true, lib: { entry: resolve(root, 'tools/cardrpg-big/offline.tsx'), name: 'CardRpgDepth', formats: ['iife'] } } });
const output = (Array.isArray(result) ? result : [result]).flatMap(r => r.output);
const js = output.filter(f => f.type === 'chunk').map(f => f.code).join('\n');
const css = output.filter(f => f.type === 'asset' && f.fileName.endsWith('.css')).map(f => f.source).join('\n');
const payload = gzipSync(Buffer.from(JSON.stringify({ js, css })), { level: 9 }).toString('base64');
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const dirty = !!execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim();
const assetEntries = [...embeddedAssets].sort(([left], [right]) => left.localeCompare(right));
const manifest = assetEntries.map(([key, asset]) => ({ key, mime: asset.mime }));
const assetTags = assetEntries.map(([, asset], index) => `<script id="asset-${index}" type="application/octet-stream">${gzipSync(asset.bytes, { level: 9 }).toString('base64')}</script>`).join('\n');
const performanceMeter = readFileSync(resolve(root, 'tools/cardrpg-big/offline-performance.js'), 'utf8');
const loader = readFileSync(resolve(root, 'tools/cardrpg-big/offline-loader.js'), 'utf8');
const html = `<!doctype html>\n<!-- REFERENCE: docs/cardrpg2/index.html | tools/cardrpg-big/build.mjs | apps/web/src/game/cardrpg/depth | packages/game-rules/src/cardrpg/depth -->\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';img-src data: blob:;style-src 'unsafe-inline';script-src 'unsafe-inline';connect-src data: blob:;media-src data: blob:"><script>${performanceMeter}</script><title>The Lantern · Three chapters</title><style>html,body{margin:0;background:#1d1b28;color:#f5ebdc}#loading{margin:0;padding:40px 40px 18px;font:18px system-ui}#opening-progress{display:block;width:min(420px,calc(100% - 80px));margin:0 40px;accent-color:#d8b98a}</style></head><body><div id="root"><p id="loading">Opening the cafe…</p><progress id="opening-progress" aria-label="Opening the cafe" value="0" max="1"></progress></div><script id="asset-manifest" type="application/json">${JSON.stringify(manifest).replace(/</g, '\\u003c')}</script>
${assetTags}
<script id="payload" type="application/octet-stream">${payload}</script><script>${loader}</script></body></html>`;
mkdirSync(resolve(root, 'docs/cardrpg3'), { recursive: true });
writeFileSync(resolve(root, 'docs/cardrpg3/index.html'), html);
const sourceRoots = ['packages/game-rules/src', 'apps/web/src', 'assets', 'tools/cardrpg-depth', 'tools/cardrpg-big', 'tools/cardrpg-big2', 'tools/cardrpg-demo/verify-delivery.py', 'tools/visual-support.mjs'];
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', ...sourceRoots], { cwd: root, encoding: 'utf8' }).trim().split('\n');
const hashes = Object.fromEntries(files.map(path => [path, createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')]));
const runtimeDirty = !!execFileSync('git', ['diff', 'HEAD', '--', ...sourceRoots], { cwd: root, encoding: 'utf8' }).length
  || !!execFileSync('git', ['ls-files', '--others', '--exclude-standard', ...sourceRoots], { cwd: root, encoding: 'utf8' }).trim();
const receipt = { date: new Date().toISOString(), head, dirty, bytes: Buffer.byteLength(html), compressed: true,
  assetCount: manifest.length, scriptBytes: Buffer.byteLength(js), assetBytes: assetEntries.reduce((sum, [, asset]) => sum + asset.bytes.length, 0),
  sha256: createHash('sha256').update(html).digest('hex'), runtimeDirty, sourceRoots, sourceHashes: hashes,
  references: ['docs/cardrpg3/index.html', 'tools/cardrpg-big/build.mjs', 'packages/game-rules/src/cardrpg/depth', 'apps/web/src/game/cardrpg/depth'] };
writeFileSync(resolve(root, 'docs/cardrpg3/build.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify({ head, dirty, bytes: receipt.bytes, sha256: receipt.sha256 }));
