// Ten minutes of production effects/model switching; no model requests, no server writes.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],samples=[];
page.on('pageerror',e=>errors.push(String(e)));const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
const start=Date.now();const out={date:new Date().toISOString(),method:'Production Chromium. Effects loops alternating with model/clip changes. Retained heap sampled after explicit CDP GC every minute. No frame-rate claim during soak.',samples,errors};
try{
 await page.goto('http://localhost:5515/?demo&squad=1&squad3d=1');await page.getByRole('button',{name:'Miniatures',exact:true}).click();
 const roles=await page.getByLabel('Model',{exact:true}).locator('option').evaluateAll(es=>es.map(e=>e.value));for(const role of roles){await page.getByLabel('Model',{exact:true}).selectOption(role);await page.waitForTimeout(180)}
 await page.getByRole('button',{name:'Effects',exact:true}).click();const effects=await page.getByLabel('Effect action').locator('option').evaluateAll(es=>es.map(e=>e.value));
 const begun=Date.now();
 for(let i=0;i<=60;i++){
  if(i%6===0){await cdp.send('HeapProfiler.collectGarbage');const m=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));const row={elapsedMs:Date.now()-begun,heapBytes:m.JSHeapUsedSize,nodes:m.Nodes,documents:m.Documents,eventListeners:m.JSEventListeners};samples.push(row);console.log(JSON.stringify(row));out.elapsedMs=Date.now()-begun;await fs.writeFile('reports/turn3d/soak.json',JSON.stringify(out,null,2));}
  if(i===60)break;
  if(i%5===4){await page.getByRole('button',{name:'Miniatures',exact:true}).click();await page.getByLabel('Model',{exact:true}).selectOption(roles[i%roles.length]);await page.getByLabel('Animation clip').selectOption(['idle','attack','cast','victory'][i%4]);}
  else{await page.getByRole('button',{name:'Effects',exact:true}).click();await page.getByLabel('Effect action').selectOption(effects[i%effects.length]);}
  await page.waitForTimeout(10000);
 }
 const postWarm=samples.slice(2);out.retainedHeapRangeBytes=Math.max(...postWarm.map(s=>s.heapBytes))-Math.min(...postWarm.map(s=>s.heapBytes));out.firstToLastBytes=samples.at(-1).heapBytes-samples[0].heapBytes;out.completed=true;
 assert(out.elapsedMs>=600000);assert.deepEqual(errors,[]);assert(out.retainedHeapRangeBytes<8*1024*1024,'Unexpected retained heap growth');
}finally{out.wallMs=Date.now()-start;await fs.writeFile('reports/turn3d/soak.json',JSON.stringify(out,null,2));await browser.close()}
