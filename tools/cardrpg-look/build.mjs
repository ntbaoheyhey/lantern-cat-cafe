// Dedicated LOOK artifact; does not edit or invoke the lane A output builder.
import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from 'node:fs';
import { resolve, relative, extname, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { root, web, requireWeb } from '../visual-support.mjs';
import { evidencePayload } from '../cardrpg-big2/embed-evidence.mjs';
import { showcaseEvidence } from './showcase-evidence.mjs';
import { b2Evidence } from './b2/build-extra.mjs';
import { liveGallery } from './skills-v5/full/live-gallery.mjs';
const { build } = await import(requireWeb.resolve('vite'));
// B2 can build a separate artifact without rewriting the accepted closure demo.
const outputPath = process.env.LOOK_OUTPUT || 'docs/cardrpg-look/index.html';
const receiptPath = process.env.LOOK_RECEIPT || 'docs/cardrpg-look/build.json';
const readableDemo = outputPath.includes('b2') || outputPath.includes('v5');
const artDemo = process.env.LOOK_ART === 'v3';
const artBootstrap = artDemo ? `window.__LOOK_ART__=new URLSearchParams(location.search).get('lookArt')==='v2'?'v2':'v3';window.__LOOK_ART_PIPELINE__=['sculpt','painted'].includes(new URLSearchParams(location.search).get('artPipeline'))?new URLSearchParams(location.search).get('artPipeline'):'generated';` : '';
const lean = process.env.LOOK_LEAN === '1';
// Both streams decode to identical bytes. Different asset classes favour
// different DEFLATE hash-table sizes; keep the smaller stream per payload.
const gzip = bytes => {
  const standard = gzipSync(bytes, { level: 9 });
  const highMemory = gzipSync(bytes, { level: 9, memLevel: 9 });
  return highMemory.length < standard.length ? highMemory : standard;
};
for (const hero of ['mochi', 'soot', 'clover']) {
  if (!existsSync(resolve(root, `assets/cardrpg-look/game-models/${hero}.glb`))) {
    throw new Error(`Missing compressed LOOK hero: ${hero}. Finish authoring and pack-models first.`);
  }
}
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
      const packed = key.startsWith('assets/cardrpg2/models/') ? resolve(root, 'assets/cardrpg-look/fallback-models', basename(file)) : file;
      embeddedAssets.set(key, { mime, bytes: readFileSync(existsSync(packed) ? packed : file) });
      return `export default window.__cardAssets[${JSON.stringify(key)}];`;
    },
  }],
  define: { 'process.env.NODE_ENV': '"production"' }, resolve: { dedupe: ['react', 'react-dom'] },
  build: { write: false, minify: true, lib: { entry: resolve(root, process.env.LOOK_ENTRY || 'tools/cardrpg-look/offline.tsx'), name: 'CardRpgDepth', formats: ['iife'] } } });
const output = (Array.isArray(result) ? result : [result]).flatMap(r => r.output);
const js = output.filter(f => f.type === 'chunk').map(f => f.code).join('\n');
const css = output.filter(f => f.type === 'asset' && f.fileName.endsWith('.css')).map(f => f.source).join('\n');
const payload = gzip(Buffer.from(JSON.stringify({ js, css }))).toString('base64');
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const dirty = !!execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim();
const sourceAssetHashes = Object.fromEntries([...embeddedAssets].map(([path, asset]) =>
  [path, createHash('sha256').update(asset.bytes).digest('hex')]));
// Keep source PNGs and manifest keys. Only opaque, losslessly packed images
// with a smaller gzip payload are selected; translucent portraits stay PNG.
const imageRequest = `/tmp/cardrpg-v5look-image-pack-${process.pid}.json`;
writeFileSync(imageRequest, JSON.stringify([...embeddedAssets.keys()]
  .filter(key => extname(key) === '.png').map(key => resolve(root, key))));
let imagePacking;
try {
  imagePacking = JSON.parse(execFileSync(process.env.BIG_PYTHON || '/Users/bao/tools/cardrpg-look/venv/bin/python',
    [resolve(root, 'tools/cardrpg-big2/pack-images.py'), imageRequest],
    { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
} finally { unlinkSync(imageRequest); }
for (const row of imagePacking) {
  const key = relative(root, row.source), asset = embeddedAssets.get(key), packed = readFileSync(row.packed);
  row.key = key;
  row.selected = row.opaque && gzip(packed).length < gzip(asset.bytes).length;
  if (row.selected) embeddedAssets.set(key, { mime: 'image/webp', bytes: packed });
}
const leanChanges=[];
if (lean) for (const [key,asset] of embeddedAssets) {
  if (key==='assets/cardrpg-look/v3-vfx/roster-light.webp') {
    const {createRequire}=await import('node:module');
    const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
    // Keep every component and its alpha/gutter; only the lean atlas resolution
    // changes. Full demo and original source remain at512px per component.
    const bytes=await sharp(asset.bytes).resize({width:3072,withoutEnlargement:true}).webp({quality:88,alphaQuality:100,effort:6}).toBuffer();
    if(gzip(bytes).length<gzip(asset.bytes).length){
      leanChanges.push({key,before:asset.bytes.length,after:bytes.length,method:'WebPq88,384px per component,alpha100'});
      embeddedAssets.set(key,{mime:'image/webp',bytes});
    }
  }
  if (key.startsWith('assets/cardrpg-look/portraits/') && key.endsWith('-2x.webp')) {
    const smaller=embeddedAssets.get(key.replace('-2x.webp','-1x.webp'));
    if(smaller){leanChanges.push({key,before:asset.bytes.length,after:smaller.bytes.length,method:'existing1x'});embeddedAssets.set(key,smaller);}
  }
  if (/^assets\/(cardrpg3b?\/textures|cardrpg(?:3)?\/portraits)\//.test(key) && /^image\//.test(asset.mime)) {
    const {createRequire}=await import('node:module');
    const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
    const limit=key.includes('/portraits/')?256:1024;
    const bytes=await sharp(asset.bytes).resize({width:limit,height:limit,fit:'inside',withoutEnlargement:true}).webp({quality:82,alphaQuality:100}).toBuffer();
    if(gzip(bytes).length<gzip(asset.bytes).length){leanChanges.push({key,before:asset.bytes.length,after:bytes.length,method:`WebPq82,max${limit}`});embeddedAssets.set(key,{mime:'image/webp',bytes});}
  }
}
const assetEntries = [...embeddedAssets].sort(([left], [right]) => left.localeCompare(right));
const assetClasses = {};
for (const [path, asset] of assetEntries) {
  const category = path.includes('cardrpg-look/stage/') ? 'atelier-stage'
    : path.includes('cardrpg-look/game-models/') ? 'atelier-models'
    : path.endsWith('.glb') ? 'classic-models'
    : path.includes('portrait') ? 'portraits'
    : path.includes('flipbook') ? 'flipbooks'
    : path.includes('icon') ? 'icons' : 'textures-and-other';
  const row = assetClasses[category] ??= { files: 0, rawBytes: 0, gzipBytes: 0, embeddedBytes: 0 };
  const compressed = gzip(asset.bytes);
  row.files++; row.rawBytes += asset.bytes.length; row.gzipBytes += compressed.length;
  row.embeddedBytes += compressed.toString('base64').length;
}
const manifest = assetEntries.map(([key, asset]) => ({ key, mime: asset.mime }));
const assetTags = assetEntries.map(([, asset], index) => `<script id="asset-${index}" type="application/octet-stream">${gzip(asset.bytes).toString('base64')}</script>`).join('\n');
const performanceMeter = readFileSync(resolve(root, 'tools/cardrpg-big/offline-performance.js'), 'utf8');
const loader = readFileSync(resolve(root, 'tools/cardrpg-look/offline-loader.js'), 'utf8');
const evidence = readableDemo ? {tags:'',script:'',rows:[],files:[]} : evidencePayload(root);
const gallery = await liveGallery(root, process.env.LOOK_LIVE_GALLERY);
const showcase = outputPath.includes('v5') ? {script:'',bytes:0,files:[]} : readableDemo ? await b2Evidence(root) : await showcaseEvidence(root);
const html = `<!doctype html>\n<!-- REFERENCE: reports/cardrpg-look/skills-v5/full/V5FULL-REPORT.md | reports/cardrpg-look/skills-v5/V0-REPORT.md | reports/cardrpg-look/skills-v5/SPEC.md | reports/cardrpg-look/b2/B2-REPORT.md | reports/cardrpg-look/b2/PROMPT.txt | docs/cardrpg-look/b2.html | docs/cardrpg2/index.html | tools/cardrpg-look/build.mjs | docs/design/cardrpg/LOOK-BIBLE.md | apps/web/src/game/cardrpg/depth | packages/game-rules/src/cardrpg/depth -->\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';img-src data: blob:;style-src 'unsafe-inline';script-src 'unsafe-inline' 'wasm-unsafe-eval' blob:;connect-src data: blob:;media-src data: blob:"><script>window.__LOOK_PACKED__=true;${artBootstrap}${performanceMeter}</script><title>The Lantern · Lantern atelier</title><style>html,body{margin:0;background:#1d1b28;color:#f5ebdc}#loading{margin:0;padding:40px 40px 18px;font:18px system-ui}#opening-progress{display:block;width:min(420px,calc(100% - 80px));margin:0 40px;accent-color:#d8b98a}</style></head><body><div id="root"><p id="loading">Opening the cafe…</p><progress id="opening-progress" aria-label="Opening the cafe" value="0" max="1"></progress></div><script id="asset-manifest" type="application/json">${JSON.stringify(manifest).replace(/</g, '\\u003c')}</script>
${assetTags}
${evidence.tags}
<script>${evidence.script}</script>
<script>${showcase.script}</script>
<script>${gallery.script}</script>
<script id="payload" type="application/octet-stream">${payload}</script><script>${loader}</script></body></html>`;
mkdirSync(resolve(root, 'docs/cardrpg-look'), { recursive: true });
writeFileSync(resolve(root, outputPath), html);
const sourceRoots = ['packages/game-rules/src', 'apps/web/src', 'assets', 'tools/cardrpg-depth', 'tools/cardrpg-big', 'tools/cardrpg-big2', 'tools/cardrpg-look', 'tools/cardrpg-demo/verify-delivery.py', 'tools/visual-support.mjs'];
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', ...sourceRoots], { cwd: root, encoding: 'utf8' }).trim().split('\n');
const hashes = Object.fromEntries(files.map(path => [path, createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')]));
for (const row of showcase.files) hashes[row.path] = row.sourceSha256;
const assetHashes = Object.fromEntries(assetEntries.map(([path, asset]) =>
  [path, createHash('sha256').update(asset.bytes).digest('hex')]));
const inputPaths = [...sourceRoots, ...Object.keys(assetHashes), ...showcase.files.map(row => row.path)];
const runtimeDirty = !!execFileSync('git', ['diff', 'HEAD', '--', ...inputPaths], { cwd: root, encoding: 'utf8' }).length
  || !!execFileSync('git', ['ls-files', '--others', '--exclude-standard', ...inputPaths], { cwd: root, encoding: 'utf8' }).trim();
const receipt = { gallery: { bytes: gallery.bytes, files: gallery.files }, lean, leanChanges, date: new Date().toISOString(), head, dirty, bytes: Buffer.byteLength(html), compressed: true,
  compression: { format: 'gzip', level: 9, memLevels: [8, 9], selection: 'smallest stream per payload; decoded bytes unchanged' },
  imagePacking, showcase: { bytes: showcase.bytes, files: showcase.files }, evidence: { rows: evidence.rows.length, files: evidence.files, bytes: Buffer.byteLength(evidence.tags) },
  assetCount: manifest.length, assetClasses, scriptBytes: Buffer.byteLength(js), assetBytes: assetEntries.reduce((sum, [, asset]) => sum + asset.bytes.length, 0),
  sha256: createHash('sha256').update(html).digest('hex'), runtimeDirty, sourceRoots, sourceHashes: hashes,
  sourceAssetHashes, assetHashes,
  references: ['docs/cardrpg-look/index.html', 'tools/cardrpg-big/build.mjs', 'packages/game-rules/src/cardrpg/depth', 'apps/web/src/game/cardrpg/depth'] };
writeFileSync(resolve(root, receiptPath), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify({ head, dirty, bytes: receipt.bytes, sha256: receipt.sha256 }));
