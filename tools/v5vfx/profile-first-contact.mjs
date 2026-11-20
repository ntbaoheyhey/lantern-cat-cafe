/** Attribute first-action submission work; fixed poses are not a gameplay FPS test. */
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-first-contact');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Frozen Mochi basic in the real scene at4x CPU. Instrumented canvas/WebGL submissions and CPU profile. First versus warmed same-pose cost attribution only; no FPS, GPU completion, ordinary progression or production claim.',samples:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 await page.evaluate(async()=>{const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts');const {configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');const f=pilotFixture('mochi-1'),m=window.__depthReview;Object.assign(m,{galleryBattle:f.battle,plan:configureSequence(f.plan),animationAt:0,paused:true});m.notify(false);window.__depthScene.ensureActors(window.__depthScene.view());});
 await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
 await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
 await page.evaluate(()=>{
  const s=window.__depthScene;cancelAnimationFrame(s.raf);const probe=window.__cxvFirstContact={costs:{},restores:[]};
  const instrument=(object,key,label)=>{const original=object[key];if(typeof original!=='function')return;object[key]=function(...args){const at=performance.now();try{return original.apply(this,args);}finally{const ms=performance.now()-at,row=probe.costs[label]??(probe.costs[label]={calls:0,totalMs:0,maxMs:0});row.calls++;row.totalMs+=ms;row.maxMs=Math.max(row.maxMs,ms);}};probe.restores.push(()=>object[key]=original);};
  instrument(CanvasRenderingContext2D.prototype,'getImageData','canvas.getImageData');instrument(CanvasRenderingContext2D.prototype,'drawImage','canvas.drawImage');
  const gl=s.renderer.getContext();for(const key of ['texImage2D','texSubImage2D','compileShader','linkProgram','drawElements','drawArrays'])instrument(gl,key,'gl.'+key);
  for(const[,e]of s.actors){instrument(e.actor.mesh,'pose','native.pose');instrument(e.craftPose,'deform','craft.deform');}
 });
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
 for(const [tag,ms]of [['idle',0],['anticipation-first',50],['transition-first',300],['contact-first',350],['contact-warm',350],['release',650],['idle-return',799],['contact-return',350]]){
  report.samples.push(await page.evaluate(({tag,ms})=>{const s=window.__depthScene,m=window.__depthReview,p=window.__cxvFirstContact;p.costs={};m.animationAt=ms;const at=performance.now();s.render({...s.view(),fixedTime:30+ms/1000,paused:true},0);const cpuMs=performance.now()-at;return{tag,ms,cpuMs,costs:p.costs,calls:s.stats.calls,textures:s.stats.textures,keys:[...s.actors].map(([id,e])=>({id,key:e.craftPose?.drawing.key}))};},{tag,ms}));
 }
 const {profile}=await cdp.send('Profiler.stop');await writeFile(resolve(out,'cpu.cpuprofile'),JSON.stringify(profile));await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 await page.evaluate(()=>{for(const restore of window.__cxvFirstContact.restores)restore();delete window.__cxvFirstContact;});
 report.errors=errors;report.ended=new Date().toISOString();report.pass=!errors.length&&report.samples.length===8;await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,pass:report.pass,errors,rows:report.samples.map(({keys,...r})=>r)}));if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
