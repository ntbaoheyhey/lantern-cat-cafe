// Run alone, after screenshots/tests. Five-minute visible soak, then hidden/reduced samples.
import assert from 'node:assert/strict';
import { writeFileSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';
import { root, web, chromium, fixtureData, openView } from './visual-support.mjs';
const data=await fixtureData(), browser=await chromium.launch(), result={method:'Chromium CDP TaskDuration/ScriptDuration (renderer main-thread time); requestAnimationFrame intervals; forced-GC heap at 0/60/120/180/240/300 s. Hidden sample uses a synthetic visibilitychange, not OS power measurement.',samples:[]};
const base=process.argv[2]??'http://localhost:5381';
try {
  const {page,evidence}=await openView(browser,data,{base,screen:'home',motion:'no-preference',clock:false});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
  await page.evaluate(()=>{
    window.visualFrames=[];let last;
    const frame=t=>{if(last!==undefined)window.visualFrames.push(t-last);last=t;requestAnimationFrame(frame);};requestAnimationFrame(frame);
  });
  let previous;
  for(let second=0;second<=300;second+=60){
    if(second)await page.waitForTimeout(60000);
    await cdp.send('HeapProfiler.collectGarbage');
    const metrics=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(v=>[v.name,v.value]));
    const intervals=await page.evaluate(()=>window.visualFrames.splice(0));
    const sorted=intervals.slice().sort((a,b)=>a-b);
    const sample={second,heapBytes:metrics.JSHeapUsedSize,nodes:metrics.Nodes,documents:metrics.Documents,taskSeconds:metrics.TaskDuration,scriptSeconds:metrics.ScriptDuration,fps:intervals.length?1000/(intervals.reduce((a,b)=>a+b,0)/intervals.length):null,p95Ms:sorted[Math.floor(sorted.length*.95)]??null,mainThreadPercent:previous?(metrics.TaskDuration-previous.TaskDuration)/(metrics.Timestamp-previous.Timestamp)*100:null};
    result.samples.push(sample);previous=metrics;console.log(JSON.stringify(sample));
  }
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  const hiddenStart=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(v=>[v.name,v.value]));
  await page.waitForTimeout(15000);
  const hiddenEnd=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(v=>[v.name,v.value]));
  result.hidden={mainThreadPercent:(hiddenEnd.TaskDuration-hiddenStart.TaskDuration)/(hiddenEnd.Timestamp-hiddenStart.Timestamp)*100,runningCss:await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)};
  result.errors=evidence.errors;result.writes=evidence.writes;
  await page.close();
  const reduced=await openView(browser,data,{base,screen:'home',motion:'reduce',clock:false});
  const calm=await reduced.page.context().newCDPSession(reduced.page);await calm.send('Performance.enable');
  const a=Object.fromEntries((await calm.send('Performance.getMetrics')).metrics.map(v=>[v.name,v.value]));
  await reduced.page.waitForTimeout(15000);
  const b=Object.fromEntries((await calm.send('Performance.getMetrics')).metrics.map(v=>[v.name,v.value]));
  result.reduced={mainThreadPercent:(b.TaskDuration-a.TaskDuration)/(b.Timestamp-a.Timestamp)*100,runningCss:await reduced.page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)};
  await reduced.page.close();
}finally{await browser.close();}
function bundle(dir){const files=readdirSync(dir).filter(n=>n.endsWith('.js'));return {files:files.length,gzipBytes:files.reduce((n,f)=>n+gzipSync(readFileSync(resolve(dir,f)),{level:9}).length,0),entry:files.filter(n=>n.startsWith('index-')).map(n=>({file:n,gzipBytes:gzipSync(readFileSync(resolve(dir,n)),{level:9}).length}))};}
result.bundle={before:bundle(resolve(web,'dist-visual-before/assets')),after:bundle(resolve(web,'dist-v2/e2e-5371/assets'))};
result.bundle.deltaGzip=result.bundle.after.gzipBytes-result.bundle.before.gzipBytes;
result.imageBytes=readdirSync(resolve(web,'public/art/visual')).reduce((n,f)=>n+statSync(resolve(web,'public/art/visual',f)).size,0);
writeFileSync(resolve(root,'reports/visual/performance.json'),JSON.stringify(result,null,2)+'\n');
assert.ok(result.bundle.deltaGzip<=150*1024);assert.ok(result.imageBytes<=1500000);
assert.ok(result.samples.slice(1).every(s=>Math.round(s.fps)>=60&&s.p95Ms<=20));
assert.ok(result.samples.at(-1).heapBytes<result.samples[1].heapBytes+5*1024*1024,'Retained heap grew by >=5 MiB after warmup');
assert.equal(result.hidden.runningCss,0);assert.equal(result.reduced.runningCss,0);assert.deepEqual(result.errors,[]);assert.deepEqual(result.writes,[]);
