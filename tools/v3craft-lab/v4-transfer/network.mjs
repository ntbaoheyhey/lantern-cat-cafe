import {writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
const root=resolve(import.meta.dirname,'../../..'),url=process.argv[2]??'http://127.0.0.1:5990',browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const manifest=JSON.parse(readFileSync(resolve(root,'assets/cardrpg-look/vfx-packed/manifest.json'))),results=[];
try{for(const fixture of config.fixtures){
 const records=new Map();let cdp;
 const {page,errors}=await openFixture(browser,fixture,{url,setupPage:async page=>{
  cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  cdp.on('Network.requestWillBeSent',e=>{if(e.request.url.startsWith('http'))records.set(e.requestId,{id:e.requestId,url:e.request.url,type:e.type,done:false,cached:false,failed:false});});
  cdp.on('Network.responseReceived',e=>{const r=records.get(e.requestId);if(r){r.status=e.response.status;r.cached=!!(e.response.fromDiskCache||e.response.fromServiceWorker);}});
  cdp.on('Network.requestServedFromCache',e=>{const r=records.get(e.requestId);if(r)r.cached=true;});
  cdp.on('Network.loadingFinished',e=>{const r=records.get(e.requestId);if(r){r.done=true;r.bytes=e.encodedDataLength;}});
  cdp.on('Network.loadingFailed',e=>{const r=records.get(e.requestId);if(r){r.done=true;r.failed=true;}});
 }});
 const atBattle=new Set(records.keys());
 const runtime=await page.evaluate(async root=>{
  const s=window.__depthScene,{PAINT_TIMELINES}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/vfx-layered/player.ts');
  const owners=[...new Set([...s.actors.values()].map(a=>a.asset))],ids=[...s.effects.layered.images.keys()];
  return {ready:s.ready,craftActive:!!s.craft,owners,loadedIds:ids,failed:s.effects.layered.stats.failed,
   missing:[...PAINT_TIMELINES.values()].filter(t=>owners.includes(t.owner)&&!ids.includes(t.id)).map(t=>t.id)};
 },root);
 for(let i=0;i<100&&[...atBattle].some(id=>!records.get(id).done);i++)await new Promise(r=>setTimeout(r,50));
 const selected=[...records.values()].filter(r=>atBattle.has(r.id));
 const packedResources=selected.filter(r=>manifest.pages.some(p=>new URL(r.url).pathname.endsWith('/'+p.file)));
 const packed=packedResources.filter(r=>r.type==='Image');
 const unitAtlases=selected.filter(r=>new URL(r.url).pathname.includes('/delivery/atlas-'));
 results.push({fixture:fixture.id,runtime,errors,requests:selected.length,totalTransferBytes:selected.reduce((n,r)=>n+(r.bytes??0),0),
  complete:selected.every(r=>r.done&&!r.failed&&!r.cached&&r.status<400),packed,unitAtlases,metadataImportBytes:packedResources.filter(r=>r.type!=='Image').reduce((n,r)=>n+r.bytes,0),assetTransferBytes:[...packed,...unitAtlases].reduce((n,r)=>n+r.bytes,0),
  incomplete:selected.filter(r=>!r.done),failed:selected.filter(r=>r.failed||r.status>=400),cached:selected.filter(r=>r.cached)});
 await cdp.detach();await page.close();console.log(JSON.stringify({fixture:fixture.id,ready:runtime.ready,pages:packed.length,missing:runtime.missing.length,bytes:results.at(-1).assetTransferBytes}));
}}finally{await browser.close();}
writeFileSync(resolve(root,'reports/v4-art/REVIEW/A10/transfer/network-fixtures.json'),JSON.stringify({at:new Date().toISOString(),scope:'Normal renderer (craft off), fresh browser contexts, development fixture only. Not the SHIP production journey or an 8MB gate pass.',method:'CDP cache disabled; full responses of every request initiated before scene readiness and first fixture action; later completions counted in full.',results},null,2)+'\n');
if(results.some(r=>!r.complete||r.errors.length||!r.runtime.ready||r.runtime.craftActive||r.runtime.missing.length))process.exitCode=1;
