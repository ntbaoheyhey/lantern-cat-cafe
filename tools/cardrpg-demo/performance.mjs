// Local RAF cadence, Long Tasks and CDP renderer metrics. No GPU-time claim.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';import {gzipSync} from 'node:zlib';import {execFileSync} from 'node:child_process';
const base=process.env.CARDRPG_URL||'http://127.0.0.1:5521',out=process.env.CARDRPG_PERF_OUT||'reports/cardrpg/baseline';
await fs.mkdir(out,{recursive:true});const rows=[],errors=[],hardware=process.env.CARDRPG_GPU!=='software';
const browser=await chromium.launch({headless:true,channel:'chromium',args:hardware?['--use-angle=metal']:['--use-angle=swiftshader']});
const quantile=(a,p)=>{const s=[...a].sort((a,b)=>a-b);return s[Math.floor((s.length-1)*p)]??0};
try{for(const [width,height] of (process.env.CARDRPG_WIDTHS?JSON.parse(process.env.CARDRPG_WIDTHS):[[1024,600],[1280,720],[1440,900]])){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:Number(process.env.CARDRPG_DPR||1)});page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{window.__perf={long:[],raf:[],record:false,last:0};new PerformanceObserver(list=>{if(window.__perf.record)window.__perf.long.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))}).observe({type:'longtask',buffered:false});const tick=t=>{const p=window.__perf;if(p.record&&p.last)p.raf.push(t-p.last);p.last=t;requestAnimationFrame(tick)};requestAnimationFrame(tick)});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
 if(base.startsWith('file:')){
  await page.goto(base);await page.getByRole('button',{name:/Prepare patrol/}).click();await page.getByRole('button',{name:/Begin patrol/}).click();await page.waitForFunction(()=>window.__turn3dReview);await page.evaluate(()=>{const c=window.__turn3dReview.controller;c.gallery(c.galleryId)});
 }else{
  await page.goto(base+'/?demo&squad=1&squad3d=1&squadDebug=1');await page.getByRole('button',{name:'Effects',exact:true}).click();
 }
 // One empty frame loads the fixture's models; it does not render any spell.
 await page.evaluate(()=>{const c=window.__turn3dReview.controller;c.captureFrame=null;c.presenter.reset(c.battle.events.slice(0,1));c.fixedTime=1;c.notify()});
 await page.waitForFunction(()=>{const r=window.__turn3dReview;return r.scene?.stats.loaded===r.view().actors.length});
 if(!hardware)await page.getByLabel('Rendering quality').selectOption('low');
 await page.waitForTimeout(600);
 await cdp.send('Tracing.start',{categories:'toplevel,devtools.timeline,v8,blink.user_timing',transferMode:'ReturnAsStream'});
 const allIds=await page.getByLabel('Effect action').locator('option').evaluateAll(es=>es.map(e=>e.value));const ids=process.env.CARDRPG_EFFECTS?process.env.CARDRPG_EFFECTS.split(','):allIds;
 if(process.env.CARDRPG_PROFILE){await cdp.send('Profiler.enable');await cdp.send('Profiler.start')}
 for(const id of ids)for(const temperature of ['cold','warm']){
  const a=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  await page.evaluate(id=>{const p=window.__perf;p.raf=[];p.long=[];p.record=true;p.last=0;const c=window.__turn3dReview.controller;c.gallery(id);c.presenter.playbackRate=1;c.presenter.fast=false},id);
  const duration=await page.evaluate(()=>window.__turn3dReview.controller.frame?.plan.duration??1500);
  await page.waitForTimeout(duration+150);
  const sample=await page.evaluate(()=>{const p=window.__perf;p.record=false;const r=window.__turn3dReview,c=r.scene.renderer.domElement,gl=c.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {raf:p.raf,long:p.long,stats:r.scene.stats,pixelRatio:r.scene.renderer.getPixelRatio(),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}});
  const z=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  rows.push({width,height,id,temperature,durationMs:duration,p95Ms:quantile(sample.raf,.95),p99Ms:quantile(sample.raf,.99),maxMs:Math.max(0,...sample.raf),longTasks:sample.long,renderer:sample.renderer,pixelRatio:sample.pixelRatio,stats:sample.stats,taskMs:(z.TaskDuration-a.TaskDuration)*1000,heapStart:a.JSHeapUsedSize,heapEnd:z.JSHeapUsedSize,raf:sample.raf});
 }
 if(process.env.CARDRPG_PROFILE){const profile=await cdp.send('Profiler.stop');await fs.writeFile(`${out}/profile-${width}.json`,JSON.stringify(profile))}
 const completed=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));await cdp.send('Tracing.end');const {stream}=await completed;let trace='';for(;;){const chunk=await cdp.send('IO.read',{handle:stream});trace+=chunk.data;if(chunk.eof)break}await cdp.send('IO.close',{handle:stream});await fs.writeFile(`${out}/trace-${hardware?'metal':'software'}-${width}.json.gz`,gzipSync(trace));
 console.log(JSON.stringify({width,samples:rows.length,longTasks:rows.reduce((n,r)=>n+r.longTasks.length,0)}));
 await fs.writeFile(`${out}/performance-${hardware?'metal':'software'}.json`,JSON.stringify({base,date:new Date().toISOString(),method:(base.startsWith('file:')?'Production offline artifact':'Development runtime')+'; first and second cast; RAF/CDP; no GPU timestamp claim.',errors,rows},null,2));await page.close();
}}finally{await browser.close();await fs.writeFile(`${out}/performance-${hardware?'metal':'software'}.json`,JSON.stringify({base,date:new Date().toISOString(),machine:execFileSync('uname',['-sm'],{encoding:'utf8'}).trim(),method:(base.startsWith('file:')?'Production offline artifact':'Development runtime')+' / Metal requested; inspect recorded renderer and pixelRatio. All raw RAF intervals retained. One model-only fixture warmup; no cast before the cold sample.',errors,rows},null,2))}
