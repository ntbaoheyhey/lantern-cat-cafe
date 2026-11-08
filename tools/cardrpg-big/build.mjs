import {packModelDictionary} from './model-dictionary-transport.mjs';
import {offlineModulePayload} from './offline-module-payload.mjs';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { resolve, relative, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { root, web, requireWeb } from '../visual-support.mjs';
import { evidencePayload } from '../cardrpg-big2/embed-evidence.mjs';
const { build } = await import(requireWeb.resolve('vite'));
const embeddedAssets = new Map();
// App default stays OFF; explicit LOOK demos opt in before React mounts.
// A separate output directory lets lane B call this builder without replacing main.
const lookV2 = process.env.BIG_LOOK_V2 === '1';
const outputDirectory = resolve(root, process.env.BIG_OUTPUT_DIR || 'docs/cardrpg3');
const gameplayV4 = process.env.BIG_GAMEPLAY_V4 === '1' || (outputDirectory === resolve(root, 'docs/cardrpg3') && process.env.BIG_GAMEPLAY_V4 !== '0');
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
  define: { 'process.env.NODE_ENV': '"production"', __GAMEPLAY_V4__: JSON.stringify(gameplayV4) }, resolve: { dedupe: ['react', 'react-dom'] },
  build: { write: false, minify: true, lib: { entry: resolve(root, 'tools/cardrpg-big/offline.tsx'), name: 'CardRpgDepth', formats: ['es'] } } });
const output = (Array.isArray(result) ? result : [result]).flatMap(r => r.output);
const js = output.filter(f => f.type === 'chunk').map(f => f.code).join('\n');
const css = output.filter(f => f.type === 'asset' && f.fileName.endsWith('.css')).map(f => f.source).join('\n');
const payload = gzipSync(Buffer.from(JSON.stringify(offlineModulePayload(output,css))), { level: 9 }).toString('base64');
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const dirty = !!execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim();
const sourceAssetHashes = Object.fromEntries([...embeddedAssets].map(([path, asset]) =>
  [path, createHash('sha256').update(asset.bytes).digest('hex')]));
// Keep source PNGs and manifest keys. Only opaque, losslessly packed images
// with a smaller gzip payload are selected; translucent portraits stay PNG.
const imageRequest = `/tmp/cardrpg-a4-image-pack-${process.pid}.json`;
writeFileSync(imageRequest, JSON.stringify([...embeddedAssets.keys()]
  .filter(key => extname(key) === '.png').map(key => resolve(root, key))));
let imagePacking;
try {
  imagePacking = JSON.parse(execFileSync(process.env.BIG_PYTHON || '/tmp/cardrpg-a4-tools/bin/python',
    [resolve(root, 'tools/cardrpg-big/a4-pack-images.py'), imageRequest],
    { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
} finally { unlinkSync(imageRequest); }
for (const row of imagePacking) {
  const key = relative(root, row.source), asset = embeddedAssets.get(key), packed = readFileSync(row.packed);
  row.key = key;
  row.selected = row.opaque && gzipSync(packed, { level: 9 }).length < gzipSync(asset.bytes, { level: 9 }).length;
  if (row.selected) embeddedAssets.set(key, { mime: 'image/webp', bytes: packed });
}
const assetEntries = [...embeddedAssets].sort(([left], [right]) => left.localeCompare(right));
const packed=packModelDictionary(assetEntries.map(([key,asset])=>({key,...asset})));
const manifest=packed.assets.map(({key,mime,patches})=>({key,mime,...(patches.length?{patches}:{})}));
const dictionaryTags='<script id="model-dictionary" type="application/octet-stream">'+gzipSync(packed.dictionary,{level:9}).toString('base64')+'</script>\n<script id="model-dictionary-index" type="application/json">'+JSON.stringify(packed.entries.map(e=>[e.offset,e.length]))+'</script>';

const assetTags = packed.assets.map((asset, index) => `<script id="asset-${index}" type="application/octet-stream">${gzipSync(asset.bytes, { level: 9 }).toString('base64')}</script>`).join('\n');
// Meshopt is embedded; permit WASM only when this artifact actually contains compressed glTFs.
// Uncompressed L0 and normal default builds keep their existing CSP byte-for-byte.
const needsMeshoptWasm = assetEntries.some(([, asset]) => asset.mime === 'model/gltf-binary'
  && asset.bytes.includes(Buffer.from('\"EXT_meshopt_compression\"')));
const wasmCsp = needsMeshoptWasm ? " 'wasm-unsafe-eval'" : '';
const performanceMeter = readFileSync(resolve(root, 'tools/cardrpg-big/offline-performance.js'), 'utf8');
const loader = readFileSync(resolve(root, 'tools/cardrpg-big/offline-loader.js'), 'utf8');
const evidence = evidencePayload(root);
if (evidence.rows.length < 93 || evidence.files.length < 160) {
  throw new Error('Offline comparison evidence is incomplete. Restore the tracked baseline report images/JSON from Git before building (sparse checkout may omit them).');
}
const html = `<!doctype html>\n<!-- REFERENCE: docs/cardrpg2/index.html | tools/cardrpg-big/build.mjs | apps/web/src/game/cardrpg/depth | packages/game-rules/src/cardrpg/depth -->\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';img-src data: blob:;style-src 'unsafe-inline';script-src 'unsafe-inline'${wasmCsp} blob:;connect-src data: blob:;media-src data: blob:"><script>${performanceMeter}</script><script>window.__LOOK_V2__=${lookV2};document.documentElement.dataset.lookV2=String(window.__LOOK_V2__);</script><title>The Lantern · Three chapters</title><style>html,body{margin:0;background:#1d1b28;color:#f5ebdc}#loading{margin:0;padding:40px 40px 18px;font:18px system-ui}#opening-progress{display:block;width:min(420px,calc(100% - 80px));margin:0 40px;accent-color:#d8b98a}</style></head><body><div id="root"><p id="loading">Opening the cafe…</p><progress id="opening-progress" aria-label="Opening the cafe" value="0" max="1"></progress></div><script id="asset-manifest" type="application/json">${JSON.stringify(manifest).replace(/</g, '\\u003c')}</script>
${assetTags}
${evidence.tags}
${dictionaryTags}
<script>${evidence.script}</script>
<script id="payload" type="application/octet-stream">${payload}</script><script>${loader}</script></body></html>`;
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(resolve(outputDirectory, 'index.html'), html);
const sourceRoots = ['packages/game-rules/src', 'apps/web/src', 'assets', 'tools/cardrpg-depth', 'tools/cardrpg-big', 'tools/cardrpg-big2', 'tools/cardrpg-demo/verify-delivery.py', 'tools/visual-support.mjs'];
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', ...sourceRoots], { cwd: root, encoding: 'utf8' }).trim().split('\n');
const hashes = Object.fromEntries(files.map(path => [path, createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')]));
const assetHashes = Object.fromEntries(assetEntries.map(([path, asset]) =>
  [path, createHash('sha256').update(asset.bytes).digest('hex')]));
const inputPaths = [...sourceRoots, ...Object.keys(assetHashes)];
const runtimeDirty = !!execFileSync('git', ['diff', 'HEAD', '--', ...inputPaths], { cwd: root, encoding: 'utf8' }).length
  || !!execFileSync('git', ['ls-files', '--others', '--exclude-standard', ...inputPaths], { cwd: root, encoding: 'utf8' }).trim();
const receipt = { date: new Date().toISOString(), head, dirty, lookV2, gameplayV4, needsMeshoptWasm, outputDirectory: relative(root, outputDirectory), bytes: Buffer.byteLength(html), compressed: true,
  moduleChunks: output.filter(f=>f.type==='chunk').map(f=>({name:f.fileName,bytes:Buffer.byteLength(f.code),entry:f.isEntry,imports:f.imports,dynamicImports:f.dynamicImports,modules:Object.keys(f.modules)})), dictionary:{entries:packed.entries.length,bytes:packed.dictionary.length,gzipBytes:gzipSync(packed.dictionary,{level:9}).length},imagePacking, evidence: { rows: evidence.rows.length, files: evidence.files, bytes: Buffer.byteLength(evidence.tags) },
  assetCount: manifest.length, scriptBytes: Buffer.byteLength(js), assetBytes: assetEntries.reduce((sum, [, asset]) => sum + asset.bytes.length, 0),
  sha256: createHash('sha256').update(html).digest('hex'), runtimeDirty, sourceRoots, sourceHashes: hashes,
  sourceAssetHashes, assetHashes,
  references: ['docs/cardrpg3/index.html', 'tools/cardrpg-big/build.mjs', 'packages/game-rules/src/cardrpg/depth', 'apps/web/src/game/cardrpg/depth'] };
writeFileSync(resolve(outputDirectory, 'build.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify({ head, dirty, bytes: receipt.bytes, sha256: receipt.sha256 }));
