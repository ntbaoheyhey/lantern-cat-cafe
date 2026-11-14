import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync} from 'node:fs';
import {resolve,relative,extname,basename} from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {packModelDictionary} from '../cardrpg-big/model-dictionary-transport.mjs';
import {offlineModulePayload} from '../cardrpg-big/offline-module-payload.mjs';
import {demoAssetAliases} from '../v3-demo/asset-aliases.mjs';

const root=resolve(import.meta.dirname,'../..'),web=resolve(root,'apps/web');
const v3Demo=process.argv.includes('--v3-demo');
const directory=resolve(root,v3Demo?'docs/cardrpg-v3-demo':'docs/cardrpg-a6');
const gitHead=ref=>execFileSync('git',['rev-parse',ref],{cwd:root,encoding:'utf8'}).trim();
const builtAt=new Date().toISOString(),head=gitHead('HEAD');
const reference=v3Demo?`REFERENCE: demo built ${builtAt} from branch codex/v3-demo-2026-11-14 @ ${head} (A ${gitHead('codex/v3-battle-2026-11-13')} + B ${gitHead('codex/v3-shell-2026-11-13')}); live: http://localhost:5994 ; static: docs/cardrpg-v3-demo/index.html`:'';
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
 define:{'process.env.NODE_ENV':'"production"','import.meta.env.VITE_UI_V3':'"1"',...(v3Demo?{'import.meta.env.VITE_REVIEW_DEMO':'"1"','import.meta.env.VITE_ECONOMY_V3':'"1"','import.meta.env.VITE_CHAIN_MODE':'"offline"'}:{})},
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
if(v3Demo){
 const publicMime={...mimeTypes,'.json':'application/json','.webm':'video/webm','.mp4':'video/mp4','.mp3':'audio/mpeg','.woff2':'font/woff2'};
 const visit=folder=>{for(const entry of readdirSync(folder,{withFileTypes:true})){
  const file=resolve(folder,entry.name);if(entry.isDirectory()){visit(file);continue;}
  const mime=publicMime[extname(file)];if(!mime)continue;
  const key='public/'+relative(resolve(web,'public'),file);assets.set(key,{key,mime,bytes:readFileSync(file)});
 }};
 for(const folder of ['art','units','cinematics','audio','icons','fonts'])visit(resolve(web,'public',folder));
 for(const [url,file] of demoAssetAliases(root)){
  const key='public'+url;assets.set(key,{key,mime:'image/webp',bytes:readFileSync(file)});
 }
}
const packed=packModelDictionary([...assets.values()].sort((a,b)=>a.key.localeCompare(b.key)));
const manifest=packed.assets.map(({key,mime,patches})=>({key,mime,...(patches.length?{patches}:{})}));
const tag=(id,bytes)=>`<script id="${id}" type="application/octet-stream">${pack(bytes)}</script>`;
const transport=packed.assets.map((asset,i)=>[`asset-${i}`,pack(asset.bytes)]);
const assetTags=transport.map(([id,data])=>`<script id="${id}" type="application/octet-stream">${data}</script>`).join('\n');
const dictionary=tag('model-dictionary',packed.dictionary)+`<script id="model-dictionary-index" type="application/json">${JSON.stringify(packed.entries.map(e=>[e.offset,e.length]))}</script>`;
const needsWasm=[...assets.values()].some(a=>a.mime==='model/gltf-binary'&&a.bytes.includes(Buffer.from('EXT_meshopt_compression')));
let loader=readFileSync(resolve(root,'tools/ui-v3/offline-loader.js'),'utf8');
if(v3Demo){
 const shim=readFileSync(resolve(root,'tools/v3-demo/offline-public.js'),'utf8');
 const marker="document.getElementById('asset-manifest').remove();";
 if(!loader.includes(marker))throw Error('Offline loader hook changed');
 loader=loader.replace(marker,marker+'\n'+shim).replace('style.textContent=css','style.textContent=publicCss(css)');
}
const meter=readFileSync(resolve(root,'tools/cardrpg-big/offline-performance.js'),'utf8');
let html=`${reference?`<!-- ${reference} -->\n`:''}<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';img-src data: blob:;style-src 'unsafe-inline';script-src ${v3Demo?"'self' ":''}'unsafe-inline'${needsWasm?" 'wasm-unsafe-eval'":''} blob:;connect-src data: blob:;media-src data: blob:;font-src data: blob:"><title>${v3Demo?'Lantern Cat Café · V3 A+B Demo':'The Lantern · Lane A6'}</title><script>${meter}</script><script>window.__LOOK_PACKED__=true;window.__LOOK_ART__='v3';window.__LOOK_ART_PIPELINE__='puppet';window.__LOOK_V2__=true;document.documentElement.dataset.lookV2='true';if(!new URLSearchParams(location.search).has('a6')){const url=new URL(location.href);url.searchParams.set('a6','1');history.replaceState(null,'',url);}</script><style>html,body{margin:0;background:#fff0d2;color:#472e23}#loading{padding:40px 40px 18px;margin:0;font:18px system-ui}#opening-progress{display:block;width:min(420px,calc(100% - 80px));margin:0 40px;accent-color:#efbd66}</style></head><body><div id="root"><p id="loading">Lighting the lanterns…</p><progress id="opening-progress" aria-label="Opening the cafe" value="0" max="1"></progress></div><script id="asset-manifest" type="application/json">${JSON.stringify(manifest).replace(/</g,'\\u003c')}</script>${assetTags}${dictionary}<script id="payload" type="application/octet-stream">${payload}</script><script>${loader}</script></body></html>`;
const standaloneBytes=Buffer.byteLength(html),limit=v3Demo?60_000_000:40_000_000;
mkdirSync(directory,{recursive:true});
let mode='single-file',transportFiles=[];
if(standaloneBytes>limit){
 if(!v3Demo)throw Error(`Offline demo is ${standaloneBytes} bytes; limit is forty MB.`);
 mode='folder';mkdirSync(resolve(directory,'assets'),{recursive:true});
 let batch=[],size=0;
 const flush=()=>{
  if(!batch.length)return;
  const file=`assets/pack-${String(transportFiles.length).padStart(3,'0')}.js`;
  const code=`for(const [id,data] of ${JSON.stringify(batch)}){const s=document.createElement('script');s.id=id;s.type='application/octet-stream';s.textContent=data;document.body.append(s);}`;
  writeFileSync(resolve(directory,file),code);transportFiles.push({file,bytes:Buffer.byteLength(code)});batch=[];size=0;
 };
 for(const row of transport){if(size+row[1].length>4_000_000)flush();batch.push(row);size+=row[1].length;}flush();
 html=html.replace(assetTags,transportFiles.map(({file})=>`<script src="./${file}"></script>`).join('\n'));
}
writeFileSync(resolve(directory,'index.html'),html);
const summary={date:builtAt,head,reference,mode,bytes:Buffer.byteLength(html),standaloneBytes,transportFiles,assets:assets.size,leanChanges,moduleChunks:output.filter(f=>f.type==='chunk').length,source:v3Demo?'A+B demo; original A rigs/cinematics, B shell/audio/economy; packed public assets resolve to Blob URLs. Chain services explicitly offline.':'Current A6 worktree; original embedded assets; no external requests required.'};
writeFileSync(resolve(directory,'build.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({date:builtAt,head,mode,bytes:summary.bytes,standaloneBytes,transportFiles:transportFiles.length,assets:assets.size}));
