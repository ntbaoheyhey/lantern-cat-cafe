/** Diagnostic transport experiment: original WebP bytes, retained real result page. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {installVictoryDemandOverride} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..'),out=resolve(process.env.CXV_CAPTURE_OUT??resolve(root,'work/v5/CXV/films/V7-F-image-delivery-decode'));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(out));await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),utc=()=>new Date().toISOString();
const source=resolve(root,'apps/web/public/art/v3-shell/b2/backdrop-garden.webp'),bytes=await readFile(source),half=Math.floor(bytes.length/2);
const report={utc:utc(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},asset:{path:source,bytes:bytes.length,sha256:hash(bytes)},harnessSha256:hash(await readFile(import.meta.filename)),fixtureSha256:hash(await readFile(resolve(root,'tools/v5vfx/browser-fixture.mjs'))),method:'Source-free transport diagnostic on one retained candidate result page, reduced static pose. Same original WebP bytes, Content-Length, Content-Type and Cache-Control; unique URLs. Complete/delayed-half/delayed-half/complete. The delayed response remains incomplete through an intermediate screenshot, then completes before the settled frame. Decode traces are diagnostic and are not performance measurements. No application/art replacement or acceptance waiver.',runs:[],captures:[],pass:false};
await writeFile(resolve(out,'harness.mjs'),await readFile(import.meta.filename));
const scheduler=process.env.CXV_VICTORY_SCHEDULER;assert(scheduler===undefined||['baseline','demand','native'].includes(scheduler));report.scheduler=scheduler??'unaltered';if(scheduler)report.method+=' Browser-response scheduling mode '+scheduler+' with audit counters; exact transformed module hashes recorded. Known Google Fonts stylesheet is blocked by the local fixture, retained explicitly; all other blocked requests fail.';
const deliveries=new Map();
const server=createServer((req,res)=>{
 const key=new URL(req.url,'http://127.0.0.1:6313').pathname.slice(1),d=deliveries.get(key);
 if(!d){res.writeHead(404);res.end();return;}
 assert.equal(d.requests,0,'unique resource requested more than once');d.requests++;d.requestUtc=utc();
 res.writeHead(200,{'Content-Type':'image/webp','Content-Length':bytes.length,'Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Timing-Allow-Origin':'*'});
 if(d.mode==='complete'){res.end(bytes);d.completeUtc=utc();d.started();}
 else {res.write(bytes.subarray(0,half));d.firstHalfUtc=utc();d.release=()=>{res.end(bytes.subarray(half));d.completeUtc=utc();};d.started();}
});
await new Promise((done,reject)=>{server.once('error',reject);server.listen(6313,'127.0.0.1',done);});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});report.browser=browser.version();
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'),{fixedClock:false,setupPage:scheduler?async page=>{report.override=await installVictoryDemandOverride(page,{mode:scheduler});}:undefined});report.url=page.url();report.errors=errors;report.blockedRequests=blockedRequests;
 await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
 await page.evaluate(()=>{const m=window.__depthReview;window.__v3a2.R.playBattle(m.battle,'auto');m.state.settings.reducedMotion=true;m.showResult();});
 await page.waitForSelector('.b3-victory-crew[data-ready=true][data-drawn="4"] canvas',{timeout:60000});
 await page.waitForTimeout(6500);await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>{performance.setResourceTimingBufferSize(10000);performance.clearResourceTimings();});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 const network=[];for(const event of ['requestWillBeSent','responseReceived','dataReceived','loadingFinished','loadingFailed'])cdp.on('Network.'+event,data=>network.push({event,...data}));
 const state=()=>page.evaluate(()=>{const e=document.querySelector('.uv-sheet'),c=document.querySelector('.b3-victory-crew'),s=getComputedStyle(e);return{sheet:e.getBoundingClientRect().toJSON(),crew:c.getBoundingClientRect().toJSON(),canvas:c.querySelector('canvas').getBoundingClientRect().toJSON(),ready:c.dataset.ready,drawn:c.dataset.drawn,backgroundImage:s.backgroundImage,backgroundSize:s.backgroundSize,backgroundPosition:s.backgroundPosition,animations:document.getAnimations().length};});
 const initial=await state();report.initial=initial;assert.equal(initial.animations,0);
 if(scheduler){const before=await page.evaluate(()=>({draws:globalThis.__cxvVictory.draws,elapsedDrawMs:globalThis.__cxvVictory.cpuMs}));await page.waitForTimeout(2000);const after=await page.evaluate(()=>({draws:globalThis.__cxvVictory.draws,elapsedDrawMs:globalThis.__cxvVictory.cpuMs}));report.reducedSteady={durationMs:2000,draws:after.draws-before.draws,elapsedDrawMs:after.elapsedDrawMs-before.elapsedDrawMs};assert(scheduler==='baseline'?report.reducedSteady.draws>60:report.reducedSteady.draws===0);}
 const paint=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
 const capture=async(name)=>{const details=await state();assert.deepEqual(details.sheet,initial.sheet);assert.deepEqual(details.crew,initial.crew);assert.deepEqual(details.canvas,initial.canvas);assert.equal(details.drawn,'4');const path=resolve(out,name+'.png');await page.screenshot({path});const image=await readFile(path);assert.equal(image.readUInt32BE(16),1280);assert.equal(image.readUInt32BE(20),720);const item={name,path,utc:utc(),sha256:hash(image),width:1280,height:720,state:details};report.captures.push(item);return item;};
 await capture('original');
 const categories='blink,cc,skia,devtools.timeline,blink.user_timing,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,disabled-by-default-skia,disabled-by-default-cc.debug';report.traceCategories=categories;
 for(const [i,mode] of ['complete','delayed','delayed','complete'].entries()){
  const name=String(i+1)+'-'+mode,key=name+'.webp',url='http://127.0.0.1:6313/'+key;let started;const first=new Promise(done=>started=done);const d={mode,requests:0,started};deliveries.set(key,d);
  await cdp.send('Tracing.start',{categories,transferMode:'ReturnAsStream'});const responsePromise=page.waitForResponse(url,{timeout:30000});
  await page.evaluate(({url,name})=>{performance.mark('cxv-image-'+name+'-start');const e=document.querySelector('.uv-sheet');if(!window.__cxvOriginalScene)window.__cxvOriginalScene={value:e.style.getPropertyValue('--b2-scene'),priority:e.style.getPropertyPriority('--b2-scene')};e.style.setProperty('--b2-scene',`url("${url}")`,'important');},{url,name});
  let timer;try{await Promise.race([first,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('No image request '+name)),15000))]);}finally{clearTimeout(timer);}
  await page.waitForTimeout(700);await paint();const intermediate=await capture(name+'-intermediate');d.intermediateUtc=intermediate.utc;if(d.release)d.release();
  const response=await responsePromise;assert.equal(await response.finished(),null);assert.equal(hash(await response.body()),report.asset.sha256);await paint();await page.waitForTimeout(500);
  await page.evaluate(name=>performance.mark('cxv-image-'+name+'-settled'),name);const settled=await capture(name+'-settled');
  const finished=new Promise(done=>cdp.once('Tracing.tracingComplete',done));await cdp.send('Tracing.end');const {stream}=await finished;assert(stream);let trace='';for(;;){const chunk=await cdp.send('IO.read',{handle:stream});trace+=chunk.base64Encoded?Buffer.from(chunk.data,'base64').toString('utf8'):chunk.data;if(chunk.eof)break;}await cdp.send('IO.close',{handle:stream});
  const tracePath=resolve(out,name+'.trace.json');await writeFile(tracePath,trace);const events=JSON.parse(trace).traceEvents;
  const decode=events.filter(e=>/DecodingImageGenerator|Decode LazyPixelRef|PaintImage/.test(e.name));
  const request=network.find(e=>e.event==='requestWillBeSent'&&e.request.url===url);assert(request);const transfer=network.filter(e=>e.requestId===request.requestId);assert(transfer.some(e=>e.event==='loadingFinished'));assert(!transfer.some(e=>e.event==='loadingFailed'));
  const resource=await page.evaluate(url=>performance.getEntriesByName(url).map(e=>e.toJSON()),url);
  report.runs.push({name,mode,url,delivery:{requests:d.requests,requestUtc:d.requestUtc,firstHalfUtc:d.firstHalfUtc??null,completeUtc:d.completeUtc,intermediateUtc:d.intermediateUtc},intermediate:intermediate.name,settled:settled.name,resource,network:transfer,trace:{path:tracePath,bytes:Buffer.byteLength(trace),sha256:hash(trace),events:events.length,decode}});
  console.log(JSON.stringify({name,delivery:report.runs.at(-1).delivery,traceEvents:events.length,decodeEvents:decode.length,decodeNames:[...new Set(decode.map(e=>e.name))]}));await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 }
 await page.evaluate(()=>{const e=document.querySelector('.uv-sheet'),o=window.__cxvOriginalScene;if(o.value)e.style.setProperty('--b2-scene',o.value,o.priority);else e.style.removeProperty('--b2-scene');});await paint();await capture('original-restored');
 assert.equal(runtimeEvidence().runtimePatchSha256,report.runtimePatchSha256);assert(!errors.length);assert(blockedRequests.every(r=>r.url==='https://fonts.googleapis.com/css2'&&r.type==='stylesheet'));report.errors=errors;report.blockedRequests=blockedRequests;report.pass=true;report.ended=utc();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,pass:report.pass,captures:report.captures.length,ended:report.ended}));
}catch(error){report.failure=String(error.stack??error);report.ended=utc();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');throw error;}
finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
