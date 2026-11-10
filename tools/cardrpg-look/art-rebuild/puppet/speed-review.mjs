// Natural presentation-clock sampling; captures are kept outside the timing loop.
import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve(process.env.ART_OUT),artifact=resolve(process.env.ART_ARTIFACT);
await mkdir(out,{recursive:true});
const result={method:'Warmed representative A6 cast playback at x1/x2/x3, with natural requestAnimationFrame and no injected ticks. Reduced motion samples the same information at x3.',errors:[],rows:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>result.errors.push(String(e)));
 await page.goto('file://'+artifact+'?dev=1&a6=1');
 await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
 await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false);});
 await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
 for(const id of ['mochi-4','soot-4','enemy:rain-spool'])for(const [speed,reduced] of [[1,false],[2,false],[3,false],[3,true]]){
  // Prewarm this actor and set the speed before releasing its action clock.
  await page.evaluate(({id,speed,reduced})=>{const m=window.__depthReview;m.gallerySpeed=speed;m.state.settings.speed=speed;m.state.settings.reducedMotion=reduced;m.inspect(id,0);m.galleryBattle.initial.gameplayA6=true;m.notify(false);},{id,speed,reduced});
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady,null,{timeout:120000});
  const row=await page.evaluate(({id,speed,reduced})=>new Promise(resolve=>{
   const m=window.__depthReview,s=window.__depthScene;
   m.inspect(id,0,true);m.galleryBattle.initial.gameplayA6=true;m.notify(false);
   const expectedMs=m.plan.duration/speed,started=performance.now(),counts={},samples=[];
   let previous=started,numberFrames=0,faceHp=0,largestJointRotation=0;
   const sample=now=>{
    if(!m.plan){
     const sorted=samples.slice(1).sort((a,b)=>a-b);
     resolve({id,speed,reduced,a6:m.a6Mode,expectedMs,observedMs:now-started,framesByBeat:counts,numberFrames,faceHp,largestJointRotation,p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1)});
     return;
    }
    samples.push(now-previous);previous=now;
    const beat=m.frame?.beat.kind;if(beat)counts[beat]=(counts[beat]??0)+1;
    if(s.puppetNumbers.drawn.length)numberFrames++;
    faceHp=Math.max(faceHp,s.labelAudit.overlaps);
    if(reduced){
     const actor=s.puppets.get(m.plan.actorId);
     const rig=actor?.model.children[0];
     if(rig)for(const layer of rig.children)if(layer.name.startsWith('puppet_'))largestJointRotation=Math.max(largestJointRotation,Math.abs(layer.rotation.z));
    }
    requestAnimationFrame(sample);
   };
   requestAnimationFrame(sample);
  }),{id,speed,reduced});
  result.rows.push(row);
  await writeFile(out+'/speed-review.json',JSON.stringify(result,null,2)+'\n');
 }
}finally{await browser.close();await writeFile(out+'/speed-review.json',JSON.stringify(result,null,2)+'\n');}
const failures=result.rows.filter(r=>!r.a6||!r.framesByBeat.impact||!r.numberFrames||r.faceHp||r.reduced&&r.largestJointRotation>1e-8||Math.abs(r.observedMs-r.expectedMs)>Math.max(100,r.expectedMs*.15));
console.log(JSON.stringify({casts:result.rows.length,errors:result.errors,failures,impactFrames:result.rows.map(r=>({id:r.id,speed:r.speed,reduced:r.reduced,frames:r.framesByBeat.impact})),maxP95:Math.max(...result.rows.map(r=>r.p95))}));
if(result.errors.length||failures.length)process.exitCode=1;
