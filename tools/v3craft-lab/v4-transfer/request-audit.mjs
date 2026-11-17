import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium, config, openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';

const root=resolve(import.meta.dirname,'../../..');
const output=resolve(root,'reports/v4-art/REVIEW/A10/scene-ready-transfer/request-audit-fixtures-r1.json');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const results=[];
try {
 for(const fixture of config.fixtures){
  const requests=new Map(); let cdp;
  const {page,errors}=await openFixture(browser,fixture,{url:'http://127.0.0.1:5991',fixedClock:false,setupPage:async page=>{
   cdp=await page.context().newCDPSession(page);
   await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
   cdp.on('Network.requestWillBeSent',e=>{
    if(e.type==='Image')requests.set(e.requestId,{url:e.request.url,type:e.type,initiator:e.initiator,done:false,bytes:0});
   });
   cdp.on('Network.responseReceived',e=>{const r=requests.get(e.requestId);if(r)Object.assign(r,{status:e.response.status,cache:!!(e.response.fromDiskCache||e.response.fromServiceWorker)});});
   cdp.on('Network.loadingFinished',e=>{const r=requests.get(e.requestId);if(r)Object.assign(r,{done:true,bytes:e.encodedDataLength});});
   cdp.on('Network.loadingFailed',e=>{const r=requests.get(e.requestId);if(r)Object.assign(r,{done:true,failed:e.errorText});});
  }});
  const state=await page.evaluate(()=>{
   const scene=window.__depthScene;
   return {ready:scene.ready,craft:!!scene.craft,renderer:scene.constructor.name,
    actors:[...scene.actors].map(([id,a])=>({id,asset:a.asset,source:a.actor?.source})),
    visibleImages:[...document.images].filter(i=>i.getBoundingClientRect().width&&i.getBoundingClientRect().height).map(i=>({url:i.currentSrc||i.src,width:i.width,height:i.height}))};
  });
  const images=[...requests.values()];
  const row={fixture:fixture.id,state,errors,images,puppets:images.filter(r=>r.url.includes('/v3-puppets/'))};
  results.push(row);
  writeFileSync(output,JSON.stringify({at:new Date().toISOString(),scope:'Development fixtures and request initiators; not production total-transfer acceptance',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),scriptSha256:createHash('sha256').update(readFileSync(import.meta.filename)).digest('hex'),results,complete:results.length===config.fixtures.length},null,2)+'\n');
  console.log(JSON.stringify({fixture:row.fixture,ready:state.ready,actors:state.actors.map(a=>a.asset+':'+a.source),puppets:row.puppets.length,puppetBytes:row.puppets.reduce((n,r)=>n+r.bytes,0),errors}));
  await cdp.detach();await page.close();
 }
}finally{await browser.close();}
