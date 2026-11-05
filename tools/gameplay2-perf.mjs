// Isolated renderer measurement, no screenshots during timing and no dev server.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { root, web, requireWeb } from './visual-support.mjs';
import { chromium, sampleData, openSample } from './gameplay2-support.mjs';
const {preview}=await import(requireWeb.resolve('vite'));
const dist=resolve(web,'dist-gameplay2'), baseline=JSON.parse(readFileSync(resolve(root,'reports/gameplay2/base-size-v2.json')));
const js=readdirSync(resolve(dist,'assets')).filter(f=>f.endsWith('.js'));
const gzipJs=js.reduce((n,f)=>n+gzipSync(readFileSync(resolve(dist,'assets',f))).length,0);
const imageBytes=readdirSync(resolve(web,'public/art/gameplay2')).reduce((n,f)=>n+statSync(resolve(web,'public/art/gameplay2',f)).size,0);
const size={sha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),environment:baseline.environment,baselineGzipJs:baseline.gzipJs,gzipJs,deltaGzipJs:gzipJs-baseline.gzipJs,chunks:js.length,newRuntimeImages:imageBytes,jsBudget:150000,imageBudget:2000000};
writeFileSync(resolve(root,'reports/gameplay2/size.json'),JSON.stringify(size,null,2));
assert.ok(size.deltaGzipJs<=size.jsBudget);assert.ok(imageBytes<=size.imageBudget);
const data=await sampleData(), server=await preview({root:web,envDir:false,build:{outDir:dist},preview:{host:'127.0.0.1',port:5392,strictPort:true}}),browser=await chromium.launch(),records=[];
async function timing(page,cdp,duration=30000){
  const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  const before=await metrics();const frames=await page.evaluate(duration=>new Promise(resolve=>{
    const intervals=[],shifts=[];let start,last;const observer=new PerformanceObserver(l=>{for(const e of l.getEntries())shifts.push(e.value)});observer.observe({type:'layout-shift'});
    function frame(now){start??=now;if(last!==undefined)intervals.push(now-last);last=now;if(now-start<duration)requestAnimationFrame(frame);else{observer.disconnect();resolve({intervals,cls:shifts.reduce((s,n)=>s+n,0)})}}requestAnimationFrame(frame);
  }),duration);const after=await metrics(), sorted=[...frames.intervals].sort((a,b)=>a-b);
  return {durationMs:duration,fps:1000/(frames.intervals.reduce((s,n)=>s+n,0)/frames.intervals.length),p95Ms:sorted[Math.floor(sorted.length*.95)],cls:frames.cls,rendererTaskPercent:100*(after.TaskDuration-before.TaskDuration)/(duration/1000),heapBefore:before.JSHeapUsedSize,heapAfter:after.JSHeapUsedSize,frames:frames.intervals.length};
}
try {
  for(const [width,height,motion]of [[1280,720,'no-preference'],[1440,900,'no-preference'],[1920,1080,'no-preference'],[1280,720,'reduce']]) {
    const {page,evidence}=await openSample(browser,data,{base:'http://127.0.0.1:5392',width,height,motion,state:data.game.createCafe(29)});
    const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');await page.waitForTimeout(1000);
    const visible=await timing(page,cdp), hidden={};
    if(width===1280&&motion==='no-preference') {
      await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'))});
      const seconds=await page.evaluate(()=>JSON.parse(localStorage.getItem('taskbar-hero:cafe-sample:1')).state.seconds);
      Object.assign(hidden,await timing(page,cdp));hidden.secondsAdvanced=await page.evaluate(()=>JSON.parse(localStorage.getItem('taskbar-hero:cafe-sample:1')).state.seconds)-seconds;
      hidden.runningAnimations=await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length);
      assert.equal(hidden.secondsAdvanced,0);assert.equal(hidden.runningAnimations,0);
    }
    const animations=motion==='reduce'?await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length):null;
    records.push({...evidence,motion,visible,hidden,reducedRunningAnimations:animations});
    // Include inherited HUD digit/text changes in global CLS. Arena/route geometry
    // has its own exact-equality E2E regression; global presentation budget is .01.
    assert.deepEqual(evidence.errors,[]);assert.deepEqual(evidence.writes,[]);assert.ok(visible.p95Ms<=20);assert.ok(visible.cls<=.01,`Global CLS ${visible.cls} exceeds .01`);if(motion==='reduce')assert.equal(animations,0);
    await page.close();console.log(JSON.stringify(records.at(-1)));
  }
} finally {await browser.close();await new Promise(ok=>server.httpServer.close(ok));writeFileSync(resolve(root,'reports/gameplay2/performance.json'),JSON.stringify({method:'Production build, one Chromium page, 30s windows, no screenshot during timing. Renderer TaskDuration is not OS CPU or battery. Hidden visibility is synthetic; the rAF observer itself remains active to measure overhead.',size,records},null,2));}
