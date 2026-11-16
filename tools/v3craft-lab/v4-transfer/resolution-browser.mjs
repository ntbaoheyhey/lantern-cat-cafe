/** Fixed-state delivery comparison, not a recorder or production-transfer gate. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';

const root=resolve(import.meta.dirname,'../../..'),label=process.argv[2];
const blockSampled=process.argv.includes('--block-sampled');
if(!label||!/^[a-z0-9-]+$/.test(label))throw Error('Required unique audit label');
const out=resolve(root,'reports/v4-art/REVIEW/A10/scene-ready-transfer');
const report=resolve(out,'browser-'+label+'.json'),raw=resolve(out,'raw/browser-'+label);
if(existsSync(report))throw Error('Refusing to overwrite prior audit');
mkdirSync(raw,{recursive:true});
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const receipt={started:new Date().toISOString(),scope:'Fixed-state normal development fixtures; not film or SHIP production total-transfer acceptance',blockSampled,
 sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 scriptSha256AtRun:hash(import.meta.filename),runtimeSources:Object.fromEntries([
 'apps/web/src/game/cardrpg/spine/assets.ts','apps/web/src/game/cardrpg/vfx-layered/player.ts','apps/web/src/game/cardrpg/vfx-layered/atlas.ts',
 'apps/web/src/game/cardrpg/spine/atlas-delivery.ts','apps/web/src/game/cardrpg/spine/sampled-atlases.json','apps/web/src/game/cardrpg/vfx-layered/sampled-atlases.json',
 'apps/web/src/game/rig/atlas-color.ts','apps/web/src/game/rig/cutout.ts'
 ].filter(p=>existsSync(resolve(root,p))).map(p=>[p,hash(resolve(root,p))])),results:[],complete:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height]of [[1280,720],[1440,900]])for(const fixture of config.fixtures){
  const requests=new Map();let cdp;
  const {page,errors}=await openFixture(browser,fixture,{url:'http://127.0.0.1:5991',width,height,setupPage:async page=>{
   cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
   if(blockSampled)await cdp.send('Network.setBlockedURLs',{urls:['*sampled-delivery*']});
   cdp.on('Network.requestWillBeSent',e=>{if(e.type==='Image')requests.set(e.requestId,{url:e.request.url,done:false,bytes:0});});
   cdp.on('Network.responseReceived',e=>{const r=requests.get(e.requestId);if(r)Object.assign(r,{status:e.response.status,cached:!!(e.response.fromDiskCache||e.response.fromServiceWorker)});});
   cdp.on('Network.loadingFinished',e=>{const r=requests.get(e.requestId);if(r)Object.assign(r,{done:true,bytes:e.encodedDataLength});});
   cdp.on('Network.loadingFailed',e=>{const r=requests.get(e.requestId);if(r)Object.assign(r,{done:true,failed:e.errorText,blockedReason:e.blockedReason});});
  }});
  const state=await page.evaluate(()=>{
   const s=window.__depthScene;
   return {ready:s.ready,craft:!!s.craft,sizeAudit:s.sizeAudit(),
    actors:[...s.actors].map(([id,a])=>{
     const textures=new Map();a.actor.root.traverse(n=>{for(const m of Array.isArray(n.material)?n.material:[n.material])if(m?.map?.image){const i=m.map.image,key=m.customProgramCacheKey();textures.set(i.src,{src:i.src,width:i.naturalWidth||i.width,height:i.naturalHeight||i.height,colorSpace:m.map.colorSpace,alphaEncoding:m.map.userData.atlasAlphaEncoding??null,shaderKey:key.startsWith('painted-srgb-v2-')?key:null});}});
     return{id,asset:a.asset,source:a.actor.source,feet:s.socket(id,'feet'),head:s.socket(id,'head'),face:s.faceBounds(a),textures:[...textures.values()]};
    }),paint:[...s.effects.layered.images].map(([id,p])=>({id,url:p.image.src,width:p.image.naturalWidth,height:p.image.naturalHeight,x:p.x,y:p.y,sourceScaleX:p.sourceScaleX??1,sourceScaleY:p.sourceScaleY??1})),paintFailures:s.effects.layered.stats.failed};
  });
  const snapshot=resolve(raw,fixture.id+'-'+height+'.png');await page.screenshot({path:snapshot});
  const images=[...requests.values()];
  receipt.results.push({fixture:fixture.id,width,height,state,errors,images,imageBytes:images.reduce((sum,r)=>sum+r.bytes,0),snapshot:snapshot.slice(root.length+1),snapshotSha256:hash(snapshot)});
  writeFileSync(report,JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({fixture:fixture.id,height,ready:state.ready,craft:state.craft,images:images.length,imageBytes:receipt.results.at(-1).imageBytes,paintFailures:state.paintFailures,errors}));
  await cdp.detach();await page.close();
 }
}finally{await browser.close();}
receipt.complete=true;receipt.finished=new Date().toISOString();
const expectedBlock=i=>blockSampled&&i.url.includes('/sampled-delivery/')&&i.blockedReason==='inspector';
receipt.pass=receipt.results.every(r=>r.state.ready&&!r.state.craft&&!r.errors.length&&!r.state.paintFailures.length&&r.images.every(i=>i.done&&(expectedBlock(i)||(!i.failed&&!i.cached&&i.status<400)))&&(!blockSampled||r.state.actors.every(a=>a.textures.every(t=>!t.src.includes('/sampled-delivery/')))&&r.state.paint.every(p=>!p.url.includes('/sampled-delivery/'))));
writeFileSync(report,JSON.stringify(receipt,null,2)+'\n');
if(!receipt.pass)process.exitCode=1;
