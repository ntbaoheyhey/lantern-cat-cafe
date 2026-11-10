import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative,extname,basename} from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {packModelDictionary} from '../cardrpg-big/model-dictionary-transport.mjs';
import {offlineModulePayload} from '../cardrpg-big/offline-module-payload.mjs';

const root=resolve(import.meta.dirname,'../..'),web=resolve(root,'apps/web');
const requireWeb=createRequire(resolve(web,'package.json'));
const {build}=await import(requireWeb.resolve('vite'));
const assets=new Map(),mimeTypes={'.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const result=await build({configFile:false,root:web,envDir:false,publicDir:false,logLevel:'warn',
 plugins:[{name:'a6-offline-assets',enforce:'pre',load(id){
  const [file,query]=id.split('?'),mime=mimeTypes[extname(file)];
  if(!mime||!new URLSearchParams(query).has('url'))return null;
  const key=relative(root,file),packed=key.startsWith('assets/cardrpg2/models/')?resolve(root,'assets/cardrpg-look/fallback-models',basename(file)):file;
  assets.set(key,{key,mime,bytes:readFileSync(existsSync(packed)?packed:file)});
  return `export default window.__cardAssets[${JSON.stringify(key)}];`;
 }}],
 define:{'process.env.NODE_ENV':'"production"','import.meta.env.VITE_UI_V3':'"1"'},
 resolve:{dedupe:['react','react-dom','@taskbar-hero/game-rules']},
 build:{write:false,minify:true,lib:{entry:resolve(root,'tools/cardrpg-a6/offline.tsx'),name:'LanternA6',formats:['es']}}
});
const output=(Array.isArray(result)?result:[result]).flatMap(r=>r.output);
const css=output.filter(f=>f.type==='asset'&&f.fileName.endsWith('.css')).map(f=>f.source).join('\n');
const pack=value=>gzipSync(value,{level:9}).toString('base64');
const payload=pack(Buffer.from(JSON.stringify(offlineModulePayload(output,css))));
// Match B's accepted lean delivery, preserving atlas alpha and every manifest key.
const leanChanges=[];
let sharp;
const shrink=async(asset,width,height,quality)=>{
 sharp??=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
 const bytes=await sharp(asset.bytes).resize({width,height,fit:'inside',withoutEnlargement:true}).webp({quality,alphaQuality:100}).toBuffer();
 if(gzipSync(bytes).length<gzipSync(asset.bytes).length){leanChanges.push({key:asset.key,before:asset.bytes.length,after:bytes.length});asset.bytes=bytes;asset.mime='image/webp';}
};
for(const [key,asset] of assets){
 if(key==='assets/cardrpg-look/v3-vfx/roster-light.webp')await shrink(asset,3072,undefined,88);
 if(key.startsWith('assets/cardrpg-look/portraits/')&&key.endsWith('-2x.webp')){
  const smaller=assets.get(key.replace('-2x.webp','-1x.webp'));if(smaller){leanChanges.push({key,before:asset.bytes.length,after:smaller.bytes.length});asset.bytes=smaller.bytes;asset.mime=smaller.mime;}
 }
 if(/^assets\/(cardrpg3b?\/textures|cardrpg(?:3)?\/portraits)\//.test(key)&&asset.mime.startsWith('image/')){
  const limit=key.includes('/portraits/')?256:1024;await shrink(asset,limit,limit,82);
 }
}
const packed=packModelDictionary([...assets.values()].sort((a,b)=>a.key.localeCompare(b.key)));
const manifest=packed.assets.map(({key,mime,patches})=>({key,mime,...(patches.length?{patches}:{})}));
const tag=(id,bytes)=>`<script id="${id}" type="application/octet-stream">${pack(bytes)}</script>`;
const assetTags=packed.assets.map((asset,i)=>tag(`asset-${i}`,asset.bytes)).join('\n');
const dictionary=tag('model-dictionary',packed.dictionary)+`<script id="model-dictionary-index" type="application/json">${JSON.stringify(packed.entries.map(e=>[e.offset,e.length]))}</script>`;
const needsWasm=[...assets.values()].some(a=>a.mime==='model/gltf-binary'&&a.bytes.includes(Buffer.from('EXT_meshopt_compression')));
const loader=readFileSync(resolve(root,'tools/ui-v3/offline-loader.js'),'utf8');
const meter=readFileSync(resolve(root,'tools/cardrpg-big/offline-performance.js'),'utf8');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';img-src data: blob:;style-src 'unsafe-inline';script-src 'unsafe-inline'${needsWasm?" 'wasm-unsafe-eval'":''} blob:;connect-src data: blob:;media-src data: blob:"><title>The Lantern · Lane A6</title><script>${meter}</script><script>window.__LOOK_PACKED__=true;window.__LOOK_ART__='v3';window.__LOOK_ART_PIPELINE__='puppet';window.__LOOK_V2__=true;document.documentElement.dataset.lookV2='true';if(!new URLSearchParams(location.search).has('a6')){const url=new URL(location.href);url.searchParams.set('a6','1');history.replaceState(null,'',url);}</script><style>html,body{margin:0;background:#fff0d2;color:#472e23}#loading{padding:40px 40px 18px;margin:0;font:18px system-ui}#opening-progress{display:block;width:min(420px,calc(100% - 80px));margin:0 40px;accent-color:#efbd66}</style></head><body><div id="root"><p id="loading">Lighting the lanterns…</p><progress id="opening-progress" aria-label="Opening the cafe" value="0" max="1"></progress></div><script id="asset-manifest" type="application/json">${JSON.stringify(manifest).replace(/</g,'\\u003c')}</script>${assetTags}${dictionary}<script id="payload" type="application/octet-stream">${payload}</script><script>${loader}</script></body></html>`;
const bytes=Buffer.byteLength(html);if(bytes>40_000_000)throw Error(`Offline demo is ${bytes} bytes; limit is forty MB.`);
const directory=resolve(root,'docs/cardrpg-a6');mkdirSync(directory,{recursive:true});
writeFileSync(resolve(directory,'index.html'),html);
const summary={date:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),bytes,assets:assets.size,leanChanges,moduleChunks:output.filter(f=>f.type==='chunk').length,source:'Current A6 worktree; original embedded assets; no external requests required.'};
writeFileSync(resolve(directory,'build.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
