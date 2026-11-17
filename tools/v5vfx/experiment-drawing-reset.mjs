/** Frozen final-state and GPU comparison of overwritten setup drawings. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {installDrawingResetPrototype} from './drawing-reset-prototype.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-drawing-reset-parity-r2');assert(!existsSync(resolve(out,'report.json')));await mkdir(out,{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:sha(await readFile(new URL(import.meta.url))),prototypeSha256:sha(await readFile(new URL('./drawing-reset-prototype.mjs',import.meta.url))),viewport:{width:1280,height:720},method:'Tool-only guard suppresses only idle0 drawing calls inside actor.sample; native setup/bones and later craft deformation remain. Separate identical fixed-random scene replays, nine hero/enemy basic/ultimate plans, eight contact/hold/return/backseek times, normal/reduced. Compare final vertex hashes, maps, feet, face corners, sockets, native bones, cue audit and full1280x720 renderer RGBA. Direct setup remains immediate. Not an ordinary-performance or judge-acceptance test.',runs:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const mode of ['baseline','coalesced']){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false,setupPage:async p=>p.addInitScript(()=>{Math.random=()=>.5;})});report.url=page.url();report.indexSha256??=sha(await (await page.request.get(new URL(page.url()).origin+'/')).body());
  await installDrawingResetPrototype(page,{active:mode==='coalesced'});
  const run=await page.evaluate(async()=>{
   const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts'),{configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
   const s=window.__depthScene,m=window.__depthReview,p=window.__cxvDrawingReset,rows=[],direct=[];
   const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
   for(const v of p.variants){v.d.sample('ult',1.1,false);v.actor.mesh.skeleton.setToSetupPose();direct.push({id:v.id,key:v.d.key,immediate:v.d.key==='K0'&&v.d.material.map===v.d.set.textures.K0});}
   for(const id of ['mochi-1','mochi-4','soot-4','clover-4','panko-4','enemy:yarn-giant:basic','enemy:yarn-giant:signature','enemy:binding-thread:basic','enemy:binding-thread:signature']){
    const f=pilotFixture(id);Object.assign(m,{galleryBattle:f.battle,plan:configureSequence(f.plan),animationAt:0,paused:true});m.notify(false);
    const expected=m.battle.actors.map(a=>a.id).sort().join(','),readyDeadline=performance.now()+10000;
    do{await new Promise(done=>setTimeout(done,10));s.ensureActors(s.view());cancelAnimationFrame(s.raf);if(performance.now()>readyDeadline)throw Error('Actors did not settle for '+id);}while(!s.ready||[...s.actors.keys()].sort().join(',')!==expected);
    p.refresh();s.eventAudit.length=0;
    const contact=m.plan.beats[2].start,duration=m.plan.duration,times=[0,50,contact-1,contact,contact+89,contact+90,duration-1,contact];
    for(const reduced of [false,true])for(const ms of times){
     m.animationAt=ms;s.render({...s.view(),fixedTime:30+ms/1000,paused:true,galleryPreview:true,reducedMotion:reduced},0);
     const actors=[];
     for(const [actorId,e]of [...s.actors].sort((a,b)=>a[0].localeCompare(b[0]))){const d=e.craftPose?.drawing;if(!d)continue;const positions=d.geometry.attributes.position.array;
      actors.push({actorId,unit:e.asset,key:d.key,mapKey:Object.entries(d.set.textures).find(([,t])=>t===d.material.map)?.[0],verticesSha256:await hash(new Uint8Array(positions.buffer,positions.byteOffset,positions.byteLength)),feet:d.contactPoints(),face:d.faceCorners(),sockets:[...e.actor.sockets].map(([key,v])=>({key,position:v.position.toArray()})),bones:e.actor.mesh.bones.map(b=>[b.worldX,b.worldY,b.a,b.b,b.c,b.d]),world:d.matrixWorld.toArray()});
     }
     const gl=s.renderer.getContext(),pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
     rows.push({id,ms,reduced,actors,cues:structuredClone(s.eventAudit),rgbaSha256:await hash(pixels)});
    }
   }
   return{rows,direct,counts:p.variants.map(({id,unit,drawingCalls,setupCalls,skipped,inActor})=>({id,unit,drawingCalls,setupCalls,skipped,inActor}))};
  });
  await page.screenshot({path:resolve(out,mode+'.png')});execFileSync('sips',['-Z','1024',resolve(out,mode+'.png'),'--out',resolve(out,mode+'-review.png')],{stdio:'ignore'});
  report.runs.push({mode,...run,errors,blockedRequests});report.errors.push(...errors);await page.evaluate(()=>window.__cxvDrawingReset.restore());await page.close();
 }
 const [base,candidate]=report.runs;report.comparisons=base.rows.map((a,i)=>{const b=candidate.rows[i];return{id:a.id,ms:a.ms,reduced:a.reduced,geometryExact:JSON.stringify(a.actors)===JSON.stringify(b.actors),cuesExact:JSON.stringify(a.cues)===JSON.stringify(b.cues),rgbaExact:a.rgbaSha256===b.rgbaSha256};});
 report.pass=!report.errors.length&&report.comparisons.every(r=>r.geometryExact&&r.cuesExact&&r.rgbaExact)&&report.runs.every(r=>r.direct.every(d=>d.immediate)&&r.counts.every(c=>c.inActor===0))&&candidate.counts.some(c=>c.skipped>0);
 report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,comparisons:report.comparisons.length,differences:report.comparisons.filter(r=>!r.geometryExact||!r.cuesExact||!r.rgbaExact).slice(0,8),counts:report.runs.map(r=>({mode:r.mode,setupCalls:r.counts.reduce((n,c)=>n+c.setupCalls,0),skipped:r.counts.reduce((n,c)=>n+c.skipped,0)})),errors:report.errors}));
}finally{await browser.close();}
