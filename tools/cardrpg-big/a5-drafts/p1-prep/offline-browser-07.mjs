// REFERENCE: pilot-07/REGISTERED-BROWSER.json; fixed observations, native timing lock.
import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='reports/cardrpg-big/a5/p1/pilot-07';
const reg=JSON.parse(await readFile(`${base}/REGISTERED-BROWSER.json`,'utf8'));
const variant=process.env.A5_TRANSPORT_VARIANT,run=Number(process.env.A5_TRANSPORT_RUN);
assert(['original','packed'].includes(variant));assert([1,2,3].includes(run));
const artifact=reg.artifacts[variant];
assert.equal(createHash('sha256').update(await readFile(artifact.path)).digest('hex'),artifact.sha256);
const out=`${base}/${variant}-cpu4-run${run}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const cdp=await page.context().newCDPSession(page),errors=[],remote=[],checks=[];
let result;
page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
try{
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await cdp.send('Performance.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.addInitScript(()=>{
  window.__a5Cold={frames:[],longTasks:[],longFrames:[],marks:[]};let last;
  requestAnimationFrame(function tick(at){if(last)window.__a5Cold.frames.push({at,ms:at-last});last=at;requestAnimationFrame(tick);});
  for(const type of ['longtask','long-animation-frame'])if(PerformanceObserver.supportedEntryTypes.includes(type))
   new PerformanceObserver(list=>window.__a5Cold[type==='longtask'?'longTasks':'longFrames'].push(...list.getEntries().map(e=>e.toJSON()))).observe({type,buffered:true});
 });
 const mark=label=>page.evaluate(label=>window.__a5Cold.marks.push({label,at:performance.now()}),label);
 await page.goto('file://'+artifact.path);
 await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});await mark('hub-interactive');
 await page.getByRole('button',{name:'Watch a battle now',exact:true}).click();await mark('fight-click');
 await page.waitForFunction(()=>window.__depthScene?.ready||window.__depthReview?.sceneError,{timeout:60000});await mark('scene-ready');
 await page.waitForTimeout(23600);await mark('measurement-end');
 const observed=await page.evaluate(()=>({...window.__a5Cold,load:window.__b2Load,sceneError:window.__depthReview?.sceneError??null,
  assetCount:Object.keys(window.__cardAssets).length,overflow:document.documentElement.scrollWidth-innerWidth}));
 const hub=observed.marks.find(m=>m.label==='hub-interactive').at,ready=observed.marks.find(m=>m.label==='scene-ready').at;
 const maximum=frames=>Math.max(0,...frames.map(f=>f.ms));
 const metrics=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
 result={passed:false,artifact,run,variant,observed,metrics,errors,remote,checks,maxFrameMs:maximum(observed.frames),
  loadThroughHubMaxMs:maximum(observed.frames.filter(f=>f.at<=hub)),loadThroughSceneMaxMs:maximum(observed.frames.filter(f=>f.at<=ready))};
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);assert(!observed.sceneError);assert.equal(observed.overflow,0);
 checks.push('Fresh offline player entry, real Watch battle click, scene ready, no external requests/errors/overflow');
 if(run===1||variant==='original'&&run===2){
  // Hash audit is deliberately outside the recorded performance interval.
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  const expected=JSON.parse(await readFile('reports/cardrpg-big/a5/p1/pilot-04/transport.json','utf8')).rows;
  const restored=await page.evaluate(async()=>{
   const rows=[];
   for(const [key,url]of Object.entries(window.__cardAssets)){
    const bytes=await(await fetch(url)).arrayBuffer();
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
    rows.push({key,bytes:bytes.byteLength,sha256:hash});
   }
   return rows;
  });
  assert.equal(restored.length,expected.length);
  for(const row of restored){const original=expected.find(x=>x.key===row.key);assert(original);assert.equal(row.bytes,original.decodedBytes,row.key);assert.equal(row.sha256,original.decodedSha256,row.key);}
  result.restoredAssets=restored;checks.push(`All ${restored.length} restored browser assets match exact original bytes and SHA-256`);
  await page.screenshot({path:out+'/battle.png'});
 }
 result.passed=true;
 console.log(JSON.stringify({variant,run,maxFrameMs:result.maxFrameMs,loadThroughHubMaxMs:result.loadThroughHubMaxMs,loadThroughSceneMaxMs:result.loadThroughSceneMaxMs,checks}));
}finally{
 await writeFile(out+'/checks.json',JSON.stringify(result??{incomplete:true,variant,run,errors,remote,checks},null,2));await browser.close();
}
