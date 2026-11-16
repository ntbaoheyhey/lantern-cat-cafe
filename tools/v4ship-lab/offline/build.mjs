/** File-open review package; original asset bytes, build-only mock services. LEARN/S10.md. */
import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync} from 'node:fs';
import {resolve,relative,extname} from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';
import {packModelDictionary} from '../../cardrpg-big/model-dictionary-transport.mjs';
import {offlineModulePayload} from '../../cardrpg-big/offline-module-payload.mjs';
import {demoAssetAliases} from '../../v3-demo/asset-aliases.mjs';

const root=resolve(import.meta.dirname,'../../..'),web=resolve(root,'apps/web'),attempt=process.argv[2];
if(!/^\d+$/.test(attempt))throw Error('Choose a new offline build number');
if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
if(git(['branch','--show-current'])!=='codex/v4-ship-2026-11-16')throw Error('Wrong branch');
const runtimePaths=['apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'];
if(git(['diff','--name-only','HEAD','--',...runtimePaths]))throw Error('Commit runtime changes before building');
const directory=resolve(root,`work/v4ship-prep/S10-offline-${attempt}`),report=resolve(root,`reports/v4-ship/S10/offline-build-${attempt}.json`);
if(existsSync(directory)||existsSync(report))throw Error('Preserve previous builds');
mkdirSync(resolve(directory,'assets'),{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const result={at:new Date().toISOString(),sourceCommit:git(['rev-parse','HEAD']),directory,mode:'file-open offline mock chain; not submission footage or chain evidence',pass:false,
  sourceTransforms:[],harness:['adapter.tsx','entry.tsx','offline.css','build.mjs'].map(name=>({path:`tools/v4ship-lab/offline/${name}`,sha256:sha(readFileSync(resolve(import.meta.dirname,name)))}))};
const assets=new Map(),mimeTypes={'.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.atlas':'text/plain','.webm':'video/webm','.mp4':'video/mp4','.ogg':'audio/ogg','.wav':'audio/wav','.mp3':'audio/mpeg','.woff2':'font/woff2'};
const add=(key,file)=>{const bytes=readFileSync(file);assets.set(key,{key,mime:mimeTypes[extname(file)]??'application/octet-stream',bytes,source:relative(root,file),sha256:sha(bytes)});};
const adapter=resolve(import.meta.dirname,'adapter.tsx');
const replacements={
 'apps/web/src/wallet/WalletProvider.tsx':['WalletProvider','useAuthContext','useSession'],
 'apps/web/src/game/cardrpg/chain/guest.ts':['GUEST_KEY','TESTNET_NOTICE','requireFuji','guestAccount','existingGuestAddress','guestSignIn','guestClient','copyGuestKey'],
 'apps/web/src/game/cardrpg/chain/runtime.ts':['loadChainConfig','publicChain','readHoldings','erc20Abi','requireWallet','chainRuntime','txLink'],
 'apps/web/src/game/cardrpg/chain/journey-client.ts':['journeyClient'],
 'apps/web/src/game/cardrpg/chain/journey-workshop.ts':['workshopClient','sameJourneyCall','scopedStorage'],
 'apps/web/src/game/cardrpg/chain/WalletProof.tsx':['WalletProof'],
 'apps/web/src/game/cardrpg/chain/ReceiptToast.tsx':['ReceiptToast'],
 'apps/web/src/game/cardrpg/shell/LiveCounters.tsx':['LiveCounters','readCounters','clearCounterCache','COUNTER_POLICY','EconomyVitals','SeasonEdition'],
};
const textReplacements={
 'apps/web/src/game/cardrpg/shell/Entrance.tsx':[
  ["'lantern.entered.v3'","'lantern.v4.offline.entered'"],
  ['Fuji testnet · No real value','Offline mock chain · No transactions'],
  ['<button disabled={busy} onClick={()=>setModal(true)}><GameIcon name="wallet"/>Connect wallet</button>',''],
  ['https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D','#offline-notice'],
  ['>Contracts</a>','>Offline review</a>'],
 ],
 'apps/web/src/game/cardrpg/shell/DemoJourney.tsx':[
  ['lantern.ship.journey:','lantern.v4.offline.journey:'],
  ['Fuji testnet · Demo rewards · No real value','Offline review · Every chain action is mocked'],
  ['Four cats. One giant. Win a testnet relic.','Four cats. One giant. Preview a mock relic.'],
  ['Mint your trial reward on Avalanche. The café supplies test gas.','Preview a mock reward. No wallet or chain transaction.'],
  ['Reward transaction · Snowtrace','Mock reward · Offline ledger'],
 ],
 'apps/web/src/game/cardrpg/shell/DemoWorkshop.tsx':[
  ['Confirming on Avalanche…','Updating offline preview…'],
  ['<p>{row.body}</p>','<p><strong>Mock example: </strong>{row.body}</p>'],
 ],
};
const requireWeb=createRequire(resolve(web,'package.json'));
const logs=[];
const logger={hasWarned:false,info:m=>logs.push({level:'info',message:m}),warn(m){this.hasWarned=true;logs.push({level:'warn',message:m});},warnOnce(m){if(!logs.some(r=>r.message===m))this.warn(m);},error:m=>logs.push({level:'error',message:m}),clearScreen(){},hasErrorLogged:()=>false};
try{
 const {build}=await import(requireWeb.resolve('vite'));
 const built=await build({configFile:false,root:web,envDir:false,publicDir:false,logLevel:'warn',customLogger:logger,
  plugins:[{name:'ship-offline-original-assets',enforce:'pre',load(id){
   const [file,query]=id.split('?'),mime=mimeTypes[extname(file)];
   if(!mime||!existsSync(file)||query&&!new URLSearchParams(query).has('url')||extname(file)==='.json'&&!query)return null;
   const key=relative(root,file);add(key,file);return `export default window.__cardAssets[${JSON.stringify(key)}];`;
  }},{name:'ship-offline-mock-services',enforce:'pre',transform(code,id){
   const path=relative(root,id);if(replacements[path]){result.sourceTransforms.push({path,kind:'mock module',sourceSha256:sha(code)});return `export {${replacements[path].join(',')}} from ${JSON.stringify(adapter)};`;}
   const rows=textReplacements[path];if(!rows)return null;
   const original=code;
   for(const [before,after]of rows){if(!code.includes(before))throw Error(`Offline text boundary changed: ${path}`);code=code.replaceAll(before,after);}
   result.sourceTransforms.push({path,kind:'offline labels and storage namespace',sourceSha256:sha(original),transformedSha256:sha(code)});return code;
  }}],
  define:{'process.env.NODE_ENV':'"production"',...Object.fromEntries(Object.entries({VITE_UI_V3:'1',VITE_ECONOMY_V3:'1',VITE_GUEST_WALLET:'1',VITE_CHAIN_LOOP:'1',VITE_SHIP_JOURNEY:'1',VITE_CHAIN_MODE:'offline',VITE_ALLOW_MOCK_AUTH:'0',VITE_SUPABASE_URL:'',VITE_FUJI_RPC_URL:'https://offline.invalid'}).map(([key,value])=>['import.meta.env.'+key,JSON.stringify(value)]))},
  resolve:{dedupe:['react','react-dom','@taskbar-hero/game-rules','@taskbar-hero/chain','wagmi','viem','@tanstack/react-query']},
  build:{write:false,minify:true,lib:{entry:resolve(import.meta.dirname,'entry.tsx'),name:'LanternV4OfflineReview',formats:['es']}}
 });
 const output=(Array.isArray(built)?built:[built]).flatMap(r=>r.output);
 const css=output.filter(f=>f.type==='asset'&&f.fileName.endsWith('.css')).map(f=>f.source).join('\n');
 const visit=folder=>{for(const entry of readdirSync(folder,{withFileTypes:true})){
  const file=resolve(folder,entry.name);if(entry.isDirectory())visit(file);else if(entry.isFile()&&entry.name!=='.DS_Store')add('public/'+relative(resolve(web,'public'),file),file);
 }};
 for(const folder of ['art','units','cinematics','audio','icons','fonts','relics','chain'])visit(resolve(web,'public',folder));
 const aliases=demoAssetAliases(root);for(const [url,file]of aliases)add('public'+url,file);
 const packed=packModelDictionary([...assets.values()].sort((a,b)=>a.key.localeCompare(b.key)));
 const manifest=packed.assets.map(({key,mime,patches})=>({key,mime,...(patches.length?{patches}:{})}));
 const pack=bytes=>gzipSync(bytes,{level:9}).toString('base64');
 const tag=(id,bytes)=>`<script id="${id}" type="application/octet-stream">${pack(bytes)}</script>`;
 const files=[];let batch=[],bytes=0;
 const flush=()=>{if(!batch.length)return;const path=`assets/pack-${String(files.length).padStart(3,'0')}.js`;
  const code=`for(const [id,data] of ${JSON.stringify(batch)}){const s=document.createElement('script');s.id=id;s.type='application/octet-stream';s.textContent=data;document.body.append(s);}`;
  writeFileSync(resolve(directory,path),code);files.push({path,bytes:Buffer.byteLength(code),sha256:sha(code)});batch=[];bytes=0;
 };
 packed.assets.forEach((asset,i)=>{const encoded=pack(asset.bytes);if(bytes+encoded.length>4_000_000)flush();batch.push(['asset-'+i,encoded]);bytes+=encoded.length;});flush();
 let loader=readFileSync(resolve(root,'tools/ui-v3/offline-loader.js'),'utf8');
 const marker="document.getElementById('asset-manifest').remove();";if(!loader.includes(marker))throw Error('Loader boundary changed');
 const shim=readFileSync(resolve(root,'tools/v3-demo/offline-public.js'),'utf8');
 loader=loader.replace(marker,marker+'\n'+shim).replace('style.textContent=css','style.textContent=publicCss(css)');
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';img-src data: blob:;style-src 'unsafe-inline';script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:;connect-src data: blob:;media-src data: blob:;font-src data: blob:"><title>Lantern Cat Café · V4 OFFLINE MOCK REVIEW</title><script>window.__LOOK_PACKED__=true;window.__LOOK_ART__='v3';window.__LOOK_ART_PIPELINE__='puppet';window.__LOOK_V2__=true;document.documentElement.dataset.lookV2='true';if(!new URLSearchParams(location.search).has('a6')){const url=new URL(location.href);url.searchParams.set('a6','1');history.replaceState(null,'',url);}document.addEventListener('click',e=>{const a=e.target.closest?.('a');if(a&&(a.href.startsWith('http:')||a.href.startsWith('https:'))){e.preventDefault();}},true);</script><style>html,body{margin:0;background:#fff0d2;color:#472e23}#loading{padding:40px;font:18px system-ui}#opening-progress{margin:0 40px;width:320px}.offline-notice{position:fixed;z-index:2147483647;top:0;left:50%;transform:translateX(-50%);padding:6px 16px;background:#182522;color:#fff;font:600 13px system-ui;white-space:nowrap;pointer-events:none}</style></head><body><aside class="offline-notice" id="offline-notice">OFFLINE REVIEW · Mock chain · No real transactions</aside><div id="root"><p id="loading">Opening offline review…</p><progress id="opening-progress" aria-label="Opening offline review" value="0" max="1"></progress></div><script id="asset-manifest" type="application/json">${JSON.stringify(manifest).replaceAll('<','\\u003c')}</script>${files.map(f=>`<script src="./${f.path}"></script>`).join('\n')}${tag('model-dictionary',packed.dictionary)}<script id="model-dictionary-index" type="application/json">${JSON.stringify(packed.entries.map(e=>[e.offset,e.length]))}</script>${tag('payload',Buffer.from(JSON.stringify(offlineModulePayload(output,css))))}<script>${loader}</script></body></html>`;
 for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!/\b(type|src)=/.test(match[1]))new Script(match[2],{filename:'offline-inline.js'});
 writeFileSync(resolve(directory,'index.html'),html);
 writeFileSync(resolve(directory,'README.txt'),'V4 OFFLINE MOCK REVIEW — preparation, not R2 or submission evidence.\nOpen index.html in current desktop Chrome/Edge. Keep the assets folder alongside it. No server, wallet, login or network is required. Every chain action and ledger entry is mocked. Combat uses the real game rules and original assets/audio. No real transaction is sent. Use Restart offline journey at the end to reset this review.\nSource: '+result.sourceCommit+'\n');
 result.assets=[...assets.values()].map(({key,mime,source,sha256,bytes})=>({key,mime,source,sha256,bytes:bytes.length}));
 Object.assign(result,{moduleChunks:output.filter(f=>f.type==='chunk').length,originalAssetBytes:result.assets.reduce((n,a)=>n+a.bytes,0),index:{bytes:Buffer.byteLength(html),sha256:sha(html)},files,aliases:[...aliases].map(([url,file])=>({url,source:relative(root,file)})),packageBytes:files.reduce((n,f)=>n+f.bytes,Buffer.byteLength(html)),pass:true});
 if(git(['diff','--name-only',result.sourceCommit,'--',...runtimePaths]))throw Error('Runtime changed during build');
}catch(error){result.pass=false;result.failure=error.message;process.exitCode=1;}
const logPath=resolve(root,`reports/v4-ship/S10/offline-build-${attempt}.log.json.gz`),logBytes=gzipSync(JSON.stringify(logs));writeFileSync(logPath,logBytes);result.log={path:relative(root,logPath),sha256:sha(logBytes),messages:logs.length};
writeFileSync(report,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({report:relative(root,report),pass:result.pass,failure:result.failure,assets:result.assets?.length,packageBytes:result.packageBytes}));
